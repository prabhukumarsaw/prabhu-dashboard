"use strict";
/**
 * Notification Service - Reusable notification system
 * Supports: In-app, Email, Push, SMS notifications
 * Designed for use across all modules
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.createBulkNotifications = createBulkNotifications;
exports.getUserNotifications = getUserNotifications;
exports.markNotificationAsRead = markNotificationAsRead;
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
exports.getUnreadNotificationCount = getUnreadNotificationCount;
exports.deleteNotification = deleteNotification;
exports.getUserNotificationPreferences = getUserNotificationPreferences;
exports.updateNotificationPreference = updateNotificationPreference;
exports.upsertNotificationTemplate = upsertNotificationTemplate;
exports.getNotificationTemplate = getNotificationTemplate;
exports.sendNotificationFromTemplate = sendNotificationFromTemplate;
exports.sendSMSNotification = sendSMSNotification;
exports.cleanupOldNotifications = cleanupOldNotifications;
exports.getNotificationStats = getNotificationStats;
const prisma_1 = require("../lib/prisma");
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("../lib/logger");
// ============== Email Configuration ==============
let emailTransporter = null;
function getEmailTransporter() {
    if (emailTransporter)
        return emailTransporter;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        logger_1.logger.warn('SMTP not configured, email notifications disabled');
        return null;
    }
    emailTransporter = nodemailer_1.default.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: smtpPort === '465',
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });
    return emailTransporter;
}
// ============== Core Notification Functions ==============
/**
 * Create a single notification
 */
async function createNotification(input) {
    const { tenantId, userId, type, title, message, actionUrl, metadata, channels, sendEmail, sendPush } = input;
    // Create in-app notification
    const notification = await prisma_1.prisma.notification.create({
        data: {
            tenantId,
            userId,
            type,
            title,
            message,
            actionUrl,
            metadata: (metadata || {}),
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });
    // Determine which channels to use
    const channelsToUse = channels || await getUserNotificationChannels(userId, 'general');
    // Send via requested channels
    const promises = [];
    const notificationWithUser = notification;
    if ((sendEmail || channelsToUse.includes('email')) && notificationWithUser.user?.email) {
        promises.push(sendEmailNotification(notificationWithUser.user.email, title, message, actionUrl).catch((err) => {
            logger_1.logger.error('Email notification failed', { userId, error: err });
        }));
    }
    if (sendPush || channelsToUse.includes('push')) {
        promises.push(sendPushNotification(userId, title, message, actionUrl).catch((err) => {
            logger_1.logger.error('Push notification failed', { userId, error: err });
        }));
    }
    await Promise.allSettled(promises);
    return notification;
}
/**
 * Create bulk notifications
 */
async function createBulkNotifications(input) {
    const { tenantId, userIds, type, title, message, actionUrl, metadata, channels } = input;
    const notifications = await Promise.all(userIds.map((userId) => createNotification({
        tenantId,
        userId,
        type,
        title,
        message,
        actionUrl,
        metadata,
        channels,
    })));
    return notifications;
}
/**
 * Get user notifications
 */
async function getUserNotifications(userId, tenantId, options) {
    const { isRead, type, limit = 50, offset = 0 } = options || {};
    const where = {
        userId,
        tenantId,
    };
    if (isRead !== undefined) {
        where.isRead = isRead;
    }
    if (type) {
        where.type = type;
    }
    const [notifications, total] = await Promise.all([
        prisma_1.prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        }),
        prisma_1.prisma.notification.count({ where }),
    ]);
    return {
        notifications,
        total,
        limit,
        offset,
    };
}
/**
 * Mark notification as read
 */
async function markNotificationAsRead(notificationId, userId) {
    return prisma_1.prisma.notification.updateMany({
        where: {
            id: notificationId,
            userId,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });
}
/**
 * Mark all notifications as read for a user
 */
async function markAllNotificationsAsRead(userId, tenantId) {
    return prisma_1.prisma.notification.updateMany({
        where: {
            userId,
            tenantId,
            isRead: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });
}
/**
 * Get unread notification count
 */
async function getUnreadNotificationCount(userId, tenantId) {
    return prisma_1.prisma.notification.count({
        where: {
            userId,
            tenantId,
            isRead: false,
        },
    });
}
/**
 * Delete notification
 */
async function deleteNotification(notificationId, userId) {
    return prisma_1.prisma.notification.deleteMany({
        where: {
            id: notificationId,
            userId,
        },
    });
}
// ============== Notification Preferences ==============
/**
 * Get user notification preferences
 */
async function getUserNotificationPreferences(userId) {
    return prisma_1.prisma.notificationPreference.findMany({
        where: { userId },
    });
}
/**
 * Update notification preference
 */
async function updateNotificationPreference(userId, channel, category, enabled) {
    return prisma_1.prisma.notificationPreference.upsert({
        where: {
            userId_channel_category: {
                userId,
                channel,
                category,
            },
        },
        create: {
            userId,
            channel,
            category,
            enabled,
        },
        update: {
            enabled,
        },
    });
}
/**
 * Get enabled notification channels for a user and category
 */
async function getUserNotificationChannels(userId, category) {
    const preferences = await prisma_1.prisma.notificationPreference.findMany({
        where: {
            userId,
            category,
            enabled: true,
        },
    });
    return preferences.map((p) => p.channel);
}
// ============== Notification Templates ==============
/**
 * Create or update notification template
 */
async function upsertNotificationTemplate(input) {
    const { code, name, subject, body, channel, variables, tenantId } = input;
    return prisma_1.prisma.notificationTemplate.upsert({
        where: { code },
        create: {
            code,
            name,
            subject,
            body,
            channel,
            variables: variables || [],
            tenantId,
        },
        update: {
            name,
            subject,
            body,
            channel,
            variables: variables || [],
            tenantId,
        },
    });
}
/**
 * Get notification template
 */
async function getNotificationTemplate(code, tenantId) {
    return prisma_1.prisma.notificationTemplate.findFirst({
        where: {
            code,
            isActive: true,
            OR: [{ tenantId: null }, { tenantId }],
        },
    });
}
/**
 * Send notification using template
 */
async function sendNotificationFromTemplate(tenantId, userId, templateCode, variables) {
    const template = await getNotificationTemplate(templateCode, tenantId);
    if (!template) {
        throw new Error(`Notification template not found: ${templateCode}`);
    }
    let title = template.subject || template.name;
    let message = template.body;
    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        title = title.replace(regex, value);
        message = message.replace(regex, value);
    });
    return createNotification({
        tenantId,
        userId,
        type: 'info',
        title,
        message,
        channels: [template.channel],
    });
}
// ============== Channel Implementations ==============
/**
 * Send email notification
 */
async function sendEmailNotification(email, subject, message, actionUrl) {
    const transporter = getEmailTransporter();
    if (!transporter) {
        logger_1.logger.warn('Email transporter not available');
        return;
    }
    const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${subject}</h2>
      <p>${message.replace(/\n/g, '<br>')}</p>
      ${actionUrl ? `<p><a href="${actionUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a></p>` : ''}
    </div>
  `;
    await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: email,
        subject,
        html: htmlBody,
        text: message,
    });
}
/**
 * Send push notification (placeholder - implement with web-push or FCM)
 */
async function sendPushNotification(userId, title, message, actionUrl) {
    // TODO: Implement push notification using web-push or Firebase Cloud Messaging
    // This requires storing push subscription endpoints in the database
    logger_1.logger.info('Push notification', { userId, title, message, actionUrl });
}
/**
 * Send SMS notification (placeholder - implement with Twilio or similar)
 */
async function sendSMSNotification(phoneNumber, message) {
    // TODO: Implement SMS notification using Twilio, AWS SNS, etc.
    logger_1.logger.info('SMS notification', { phoneNumber, message });
}
// ============== Utility Functions ==============
/**
 * Clean up old read notifications (older than specified days)
 */
async function cleanupOldNotifications(tenantId, daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const result = await prisma_1.prisma.notification.deleteMany({
        where: {
            tenantId,
            isRead: true,
            readAt: {
                lte: cutoffDate,
            },
        },
    });
    return result.count;
}
/**
 * Get notification statistics
 */
async function getNotificationStats(tenantId, userId) {
    const where = { tenantId };
    if (userId)
        where.userId = userId;
    const [total, unread, byType] = await Promise.all([
        prisma_1.prisma.notification.count({ where }),
        prisma_1.prisma.notification.count({ where: { ...where, isRead: false } }),
        prisma_1.prisma.notification.groupBy({
            by: ['type'],
            where,
            _count: true,
        }),
    ]);
    return {
        total,
        unread,
        read: total - unread,
        byType: byType.reduce((acc, item) => {
            acc[item.type] = item._count;
            return acc;
        }, {}),
    };
}
//# sourceMappingURL=notification.service.js.map