/**
 * Real-time Service - WebSocket and Server-Sent Events
 * Supports: Real-time notifications, live activity feed, collaborative features
 */
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
export interface SocketUser {
    userId: string;
    tenantId: string;
    socketId: string;
}
export interface RealtimeEvent {
    type: string;
    payload: Record<string, unknown>;
    target?: {
        userId?: string;
        tenantId?: string;
        room?: string;
    };
}
/**
 * Initialize Socket.IO server
 */
export declare function initializeSocketIO(httpServer: HTTPServer): SocketIOServer;
/**
 * Emit event to specific user
 */
export declare function emitToUser(userId: string, event: string, data: Record<string, unknown>): void;
/**
 * Emit event to tenant
 */
export declare function emitToTenant(tenantId: string, event: string, data: Record<string, unknown>): void;
/**
 * Emit event to room
 */
export declare function emitToRoom(room: string, event: string, data: Record<string, unknown>): void;
/**
 * Emit event to all connected clients
 */
export declare function emitToAll(event: string, data: Record<string, unknown>): void;
/**
 * Send real-time notification
 */
export declare function sendRealtimeNotification(userId: string, tenantId: string, notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
}): void;
/**
 * Send activity update
 */
export declare function sendActivityUpdate(tenantId: string, activity: {
    type: string;
    userId: string;
    resourceType: string;
    resourceId?: string;
    action: string;
    metadata?: Record<string, unknown>;
}): void;
/**
 * Get connected users count
 */
export declare function getConnectedUsersCount(tenantId?: string): number;
/**
 * Get connected users for tenant
 */
export declare function getConnectedUsers(tenantId: string): SocketUser[];
/**
 * Check if user is connected
 */
export declare function isUserConnected(userId: string): boolean;
/**
 * Disconnect user
 */
export declare function disconnectUser(userId: string): void;
/**
 * Create SSE endpoint handler
 */
export declare function createSSEHandler(): (req: any, res: any) => Promise<void>;
/**
 * Get Socket.IO instance
 */
export declare function getSocketIO(): SocketIOServer | null;
//# sourceMappingURL=realtime.service.d.ts.map