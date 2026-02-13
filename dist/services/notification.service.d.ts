/**
 * Notification Service - Reusable notification system
 * Supports: In-app, Email, Push, SMS notifications
 * Designed for use across all modules
 */
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
    channels?: NotificationChannel[];
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
/**
 * Create a single notification
 */
export declare function createNotification(input: CreateNotificationInput): Promise<{
    user: {
        email: string;
        id: string;
        firstName: string | null;
        lastName: string | null;
    };
} & {
    type: string;
    tenantId: string;
    id: string;
    createdAt: Date;
    userId: string;
    message: string;
    title: string;
    actionUrl: string | null;
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
    isRead: boolean;
    readAt: Date | null;
}>;
/**
 * Create bulk notifications
 */
export declare function createBulkNotifications(input: BulkNotificationInput): Promise<({
    user: {
        email: string;
        id: string;
        firstName: string | null;
        lastName: string | null;
    };
} & {
    type: string;
    tenantId: string;
    id: string;
    createdAt: Date;
    userId: string;
    message: string;
    title: string;
    actionUrl: string | null;
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
    isRead: boolean;
    readAt: Date | null;
})[]>;
/**
 * Get user notifications
 */
export declare function getUserNotifications(userId: string, tenantId: string, options?: {
    isRead?: boolean;
    type?: NotificationType;
    limit?: number;
    offset?: number;
}): Promise<{
    notifications: {
        type: string;
        tenantId: string;
        id: string;
        createdAt: Date;
        userId: string;
        message: string;
        title: string;
        actionUrl: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        readAt: Date | null;
    }[];
    total: number;
    limit: number;
    offset: number;
}>;
/**
 * Mark notification as read
 */
export declare function markNotificationAsRead(notificationId: string, userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
/**
 * Mark all notifications as read for a user
 */
export declare function markAllNotificationsAsRead(userId: string, tenantId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
/**
 * Get unread notification count
 */
export declare function getUnreadNotificationCount(userId: string, tenantId: string): Promise<number>;
/**
 * Delete notification
 */
export declare function deleteNotification(notificationId: string, userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
/**
 * Get user notification preferences
 */
export declare function getUserNotificationPreferences(userId: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    channel: string;
    category: string;
    enabled: boolean;
}[]>;
/**
 * Update notification preference
 */
export declare function updateNotificationPreference(userId: string, channel: NotificationChannel, category: NotificationCategory, enabled: boolean): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    channel: string;
    category: string;
    enabled: boolean;
}>;
/**
 * Create or update notification template
 */
export declare function upsertNotificationTemplate(input: NotificationTemplateInput): Promise<{
    tenantId: string | null;
    id: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    code: string;
    subject: string | null;
    channel: string;
    body: string;
    variables: import("@prisma/client/runtime/library").JsonValue | null;
}>;
/**
 * Get notification template
 */
export declare function getNotificationTemplate(code: string, tenantId?: string): Promise<{
    tenantId: string | null;
    id: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    code: string;
    subject: string | null;
    channel: string;
    body: string;
    variables: import("@prisma/client/runtime/library").JsonValue | null;
} | null>;
/**
 * Send notification using template
 */
export declare function sendNotificationFromTemplate(tenantId: string, userId: string, templateCode: string, variables: Record<string, string>): Promise<{
    user: {
        email: string;
        id: string;
        firstName: string | null;
        lastName: string | null;
    };
} & {
    type: string;
    tenantId: string;
    id: string;
    createdAt: Date;
    userId: string;
    message: string;
    title: string;
    actionUrl: string | null;
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
    isRead: boolean;
    readAt: Date | null;
}>;
/**
 * Send SMS notification (placeholder - implement with Twilio or similar)
 */
export declare function sendSMSNotification(phoneNumber: string, message: string): Promise<void>;
/**
 * Clean up old read notifications (older than specified days)
 */
export declare function cleanupOldNotifications(tenantId: string, daysOld?: number): Promise<number>;
/**
 * Get notification statistics
 */
export declare function getNotificationStats(tenantId: string, userId?: string): Promise<{
    total: number;
    unread: number;
    read: number;
    byType: Record<string, number>;
}>;
//# sourceMappingURL=notification.service.d.ts.map