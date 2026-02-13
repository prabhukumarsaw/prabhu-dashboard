"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.createBulk = createBulk;
exports.list = list;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.getUnreadCount = getUnreadCount;
exports.remove = remove;
exports.getPreferences = getPreferences;
exports.updatePreference = updatePreference;
exports.getStats = getStats;
const notificationService = __importStar(require("../services/notification.service"));
async function create(req, res) {
    const { userId, type, title, message, actionUrl, metadata, channels, sendEmail, sendPush } = req.body;
    const tenantId = req.tenantId;
    if (!userId || !type || !title || !message) {
        res.status(400).json({ success: false, message: 'userId, type, title, and message are required' });
        return;
    }
    try {
        const notification = await notificationService.createNotification({
            tenantId,
            userId,
            type,
            title,
            message,
            actionUrl,
            metadata,
            channels,
            sendEmail,
            sendPush,
        });
        res.status(201).json({ success: true, data: notification });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function createBulk(req, res) {
    const { userIds, type, title, message, actionUrl, metadata, channels } = req.body;
    const tenantId = req.tenantId;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({ success: false, message: 'userIds array is required' });
        return;
    }
    try {
        const notifications = await notificationService.createBulkNotifications({
            tenantId,
            userIds,
            type,
            title,
            message,
            actionUrl,
            metadata,
            channels,
        });
        res.status(201).json({ success: true, data: { notifications, count: notifications.length } });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function list(req, res) {
    const userId = req.user?.id;
    const tenantId = req.tenantId;
    const { isRead, type, limit, offset } = req.query;
    try {
        const result = await notificationService.getUserNotifications(userId, tenantId, {
            isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
            type: type,
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function markAsRead(req, res) {
    const { id } = req.params;
    const userId = req.user?.id;
    try {
        await notificationService.markNotificationAsRead(id, userId);
        res.json({ success: true, message: 'Notification marked as read' });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function markAllAsRead(req, res) {
    const userId = req.user?.id;
    const tenantId = req.tenantId;
    try {
        await notificationService.markAllNotificationsAsRead(userId, tenantId);
        res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function getUnreadCount(req, res) {
    const userId = req.user?.id;
    const tenantId = req.tenantId;
    try {
        const count = await notificationService.getUnreadNotificationCount(userId, tenantId);
        res.json({ success: true, data: { count } });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function remove(req, res) {
    const { id } = req.params;
    const userId = req.user?.id;
    try {
        await notificationService.deleteNotification(id, userId);
        res.json({ success: true, message: 'Notification deleted' });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function getPreferences(req, res) {
    const userId = req.user?.id;
    try {
        const preferences = await notificationService.getUserNotificationPreferences(userId);
        res.json({ success: true, data: preferences });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function updatePreference(req, res) {
    const userId = req.user?.id;
    const { channel, category, enabled } = req.body;
    if (!channel || !category || enabled === undefined) {
        res.status(400).json({ success: false, message: 'channel, category, and enabled are required' });
        return;
    }
    try {
        const preference = await notificationService.updateNotificationPreference(userId, channel, category, enabled);
        res.json({ success: true, data: preference });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
async function getStats(req, res) {
    const tenantId = req.tenantId;
    const userId = req.query.userId || req.user?.id;
    try {
        const stats = await notificationService.getNotificationStats(tenantId, userId);
        res.json({ success: true, data: stats });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}
//# sourceMappingURL=notification.controller.js.map