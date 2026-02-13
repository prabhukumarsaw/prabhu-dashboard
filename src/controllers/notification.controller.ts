import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';

export async function create(req: Request, res: Response): Promise<void> {
  const { userId, type, title, message, actionUrl, metadata, channels, sendEmail, sendPush } = req.body;
  const tenantId = req.tenantId!;

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
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function createBulk(req: Request, res: Response): Promise<void> {
  const { userIds, type, title, message, actionUrl, metadata, channels } = req.body;
  const tenantId = req.tenantId!;

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
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  const userId = (req.user as any)?.id;
  const tenantId = req.tenantId!;
  const { isRead, type, limit, offset } = req.query;

  try {
    const result = await notificationService.getUserNotifications(userId, tenantId, {
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      type: type as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = (req.user as any)?.id;

  try {
    await notificationService.markNotificationAsRead(id, userId);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  const userId = (req.user as any)?.id;
  const tenantId = req.tenantId!;

  try {
    await notificationService.markAllNotificationsAsRead(userId, tenantId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  const userId = (req.user as any)?.id;
  const tenantId = req.tenantId!;

  try {
    const count = await notificationService.getUnreadNotificationCount(userId, tenantId);
    res.json({ success: true, data: { count } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = (req.user as any)?.id;

  try {
    await notificationService.deleteNotification(id, userId);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getPreferences(req: Request, res: Response): Promise<void> {
  const userId = (req.user as any)?.id;

  try {
    const preferences = await notificationService.getUserNotificationPreferences(userId);
    res.json({ success: true, data: preferences });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function updatePreference(req: Request, res: Response): Promise<void> {
  const userId = (req.user as any)?.id;
  const { channel, category, enabled } = req.body;

  if (!channel || !category || enabled === undefined) {
    res.status(400).json({ success: false, message: 'channel, category, and enabled are required' });
    return;
  }

  try {
    const preference = await notificationService.updateNotificationPreference(
      userId,
      channel,
      category,
      enabled
    );
    res.json({ success: true, data: preference });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getStats(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId!;
  const userId = (req.query.userId as string) || (req.user as any)?.id;

  try {
    const stats = await notificationService.getNotificationStats(tenantId, userId);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}
