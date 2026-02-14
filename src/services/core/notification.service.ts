/**
 * Notification Service - Reusable notification system
 * Supports: In-app, Email, Push, SMS notifications
 * Designed for use across all modules
 */

import { prisma } from '../../lib/prisma';
import nodemailer from 'nodemailer';
import { logger } from '../../lib/logger';
import { config } from '../../config';
import crypto from 'crypto';

// ============== Types ==============

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export type NotificationChannel = 'email' | 'push' | 'in_app' | 'sms';

export type NotificationCategory = 'security' | 'billing' | 'system' | 'general';

export interface CreateNotificationInput {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  channels?: NotificationChannel[]; // If not provided, uses user preferences
  sendEmail?: boolean;
  sendPush?: boolean;
}

export interface BulkNotificationInput {
  tenantId: string;
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  channels?: NotificationChannel[];
}

export interface NotificationTemplateInput {
  code: string;
  name: string;
  subject?: string;
  body: string;
  channel: NotificationChannel;
  variables?: string[];
  tenantId?: string;
}

// ============== Email Configuration ==============

let emailTransporter: nodemailer.Transporter | null = null;

function getEmailTransporter(): nodemailer.Transporter | null {
  if (emailTransporter) return emailTransporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    logger.warn('SMTP not configured, email notifications disabled');
    return null;
  }

  emailTransporter = nodemailer.createTransport({
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
export async function createNotification(input: CreateNotificationInput) {
  const { tenantId, userId, type, title, message, actionUrl, metadata, channels, sendEmail, sendPush } = input;

  // Create in-app notification
  const notification = await prisma.notification.create({
    data: {
      tenantId,
      userId,
      type,
      title,
      message,
      actionUrl,
      metadata: (metadata || {}) as any,
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
  const promises: Promise<void>[] = [];

  const notificationWithUser = notification as any;
  if ((sendEmail || channelsToUse.includes('email')) && notificationWithUser.user?.email) {
    promises.push(sendEmailNotification(notificationWithUser.user.email, title, message, actionUrl).catch((err) => {
      logger.error('Email notification failed', { userId, error: err });
    }));
  }

  if (sendPush || channelsToUse.includes('push')) {
    promises.push(sendPushNotification(userId, title, message, actionUrl).catch((err) => {
      logger.error('Push notification failed', { userId, error: err });
    }));
  }

  await Promise.allSettled(promises);

  return notification;
}

/**
 * Create bulk notifications
 */
export async function createBulkNotifications(input: BulkNotificationInput) {
  const { tenantId, userIds, type, title, message, actionUrl, metadata, channels } = input;

  const notifications = await Promise.all(
    userIds.map((userId) =>
      createNotification({
        tenantId,
        userId,
        type,
        title,
        message,
        actionUrl,
        metadata,
        channels,
      })
    )
  );

  return notifications;
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  tenantId: string,
  options?: {
    isRead?: boolean;
    type?: NotificationType;
    limit?: number;
    offset?: number;
  }
) {
  const { isRead, type, limit = 50, offset = 0 } = options || {};

  const where: any = {
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
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where }),
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
export async function markNotificationAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
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
export async function markAllNotificationsAsRead(userId: string, tenantId: string) {
  return prisma.notification.updateMany({
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
export async function getUnreadNotificationCount(userId: string, tenantId: string) {
  return prisma.notification.count({
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
export async function deleteNotification(notificationId: string, userId: string) {
  return prisma.notification.deleteMany({
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
export async function getUserNotificationPreferences(userId: string) {
  return prisma.notificationPreference.findMany({
    where: { userId },
  });
}

/**
 * Update notification preference
 */
export async function updateNotificationPreference(
  userId: string,
  channel: NotificationChannel,
  category: NotificationCategory,
  enabled: boolean
) {
  return prisma.notificationPreference.upsert({
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
async function getUserNotificationChannels(
  userId: string,
  category: NotificationCategory
): Promise<NotificationChannel[]> {
  const preferences = await prisma.notificationPreference.findMany({
    where: {
      userId,
      category,
      enabled: true,
    },
  });

  return preferences.map((p: { channel: string }) => p.channel as NotificationChannel);
}

// ============== Notification Templates ==============

/**
 * Create or update notification template
 */
export async function upsertNotificationTemplate(input: NotificationTemplateInput) {
  const { code, name, subject, body, channel, variables, tenantId } = input;

  return prisma.notificationTemplate.upsert({
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
export async function getNotificationTemplate(code: string, tenantId?: string) {
  return prisma.notificationTemplate.findFirst({
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
export async function sendNotificationFromTemplate(
  tenantId: string,
  userId: string,
  templateCode: string,
  variables: Record<string, string>
) {
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
    channels: [template.channel as NotificationChannel],
  });
}

// ============== Channel Implementations ==============

/**
 * Send email notification
 */
async function sendEmailNotification(
  email: string,
  subject: string,
  message: string,
  actionUrl?: string
): Promise<void> {
  const transporter = getEmailTransporter();
  if (!transporter) {
    logger.warn('Email transporter not available');
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
async function sendPushNotification(
  userId: string,
  title: string,
  message: string,
  actionUrl?: string
): Promise<void> {
  // TODO: Implement push notification using web-push or Firebase Cloud Messaging
  // This requires storing push subscription endpoints in the database
  logger.info('Push notification', { userId, title, message, actionUrl });
}

/**
 * Send SMS notification (placeholder - implement with Twilio or similar)
 */
export async function sendSMSNotification(
  phoneNumber: string,
  message: string
): Promise<void> {
  // TODO: Implement SMS notification using Twilio, AWS SNS, etc.
  logger.info('SMS notification', { phoneNumber, message });
}

// ============== Utility Functions ==============

/**
 * Clean up old read notifications (older than specified days)
 */
export async function cleanupOldNotifications(tenantId: string, daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.notification.deleteMany({
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
export async function getNotificationStats(tenantId: string, userId?: string) {
  const where: any = { tenantId };
  if (userId) where.userId = userId;

  const [total, unread, byType] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, isRead: false } }),
    prisma.notification.groupBy({
      by: ['type'],
      where,
      _count: true,
    }),
  ]);

  return {
    total,
    unread,
    read: total - unread,
    byType: byType.reduce((acc: Record<string, number>, item: { type: string; _count: number }) => {
      acc[item.type] = item._count;
      return acc;
    }, {} as Record<string, number>),
  };
}
