/**
 * Real-time Service - WebSocket and Server-Sent Events
 * Supports: Real-time notifications, live activity feed, collaborative features
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../lib/jwt';

// ============== Types ==============

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

// ============== Socket.IO Server ==============

let io: SocketIOServer | null = null;
const connectedUsers = new Map<string, SocketUser>(); // socketId -> user
const userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>

/**
 * Initialize Socket.IO server
 */
export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
    path: '/socket.io',
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyToken(token);
      if (payload.type !== 'access') {
        return next(new Error('Invalid token type'));
      }

      // Attach user info to socket
      (socket as any).userId = payload.sub;
      (socket as any).tenantId = payload.tenantId;
      (socket as any).sessionId = payload.sessionId;

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', handleConnection);

  logger.info('Socket.IO server initialized');
  return io;
}

/**
 * Handle new socket connection
 */
function handleConnection(socket: Socket) {
  const userId = (socket as any).userId;
  const tenantId = (socket as any).tenantId;
  const socketId = socket.id;

  // Store connection
  connectedUsers.set(socketId, { userId, tenantId, socketId });

  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(socketId);

  // Join tenant room
  socket.join(`tenant:${tenantId}`);
  socket.join(`user:${userId}`);

  logger.info('User connected', { userId, tenantId, socketId });

  // Handle disconnection
  socket.on('disconnect', () => {
    handleDisconnection(socketId, userId);
  });

  // Handle custom events
  socket.on('subscribe', (room: string) => {
    socket.join(room);
    logger.debug('User subscribed to room', { userId, room });
  });

  socket.on('unsubscribe', (room: string) => {
    socket.leave(room);
    logger.debug('User unsubscribed from room', { userId, room });
  });

  // Send initial connection confirmation
  socket.emit('connected', {
    socketId,
    userId,
    tenantId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle socket disconnection
 */
function handleDisconnection(socketId: string, userId: string) {
  connectedUsers.delete(socketId);
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      userSockets.delete(userId);
    }
  }
  logger.info('User disconnected', { userId, socketId });
}

// ============== Event Broadcasting ==============

/**
 * Emit event to specific user
 */
export function emitToUser(userId: string, event: string, data: Record<string, unknown>) {
  if (!io) {
    logger.warn('Socket.IO not initialized');
    return;
  }

  io.to(`user:${userId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });

  logger.debug('Event emitted to user', { userId, event });
}

/**
 * Emit event to tenant
 */
export function emitToTenant(tenantId: string, event: string, data: Record<string, unknown>) {
  if (!io) {
    logger.warn('Socket.IO not initialized');
    return;
  }

  io.to(`tenant:${tenantId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });

  logger.debug('Event emitted to tenant', { tenantId, event });
}

/**
 * Emit event to room
 */
export function emitToRoom(room: string, event: string, data: Record<string, unknown>) {
  if (!io) {
    logger.warn('Socket.IO not initialized');
    return;
  }

  io.to(room).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });

  logger.debug('Event emitted to room', { room, event });
}

/**
 * Emit event to all connected clients
 */
export function emitToAll(event: string, data: Record<string, unknown>) {
  if (!io) {
    logger.warn('Socket.IO not initialized');
    return;
  }

  io.emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });

  logger.debug('Event emitted to all', { event });
}

// ============== Notification Helpers ==============

/**
 * Send real-time notification
 */
export function sendRealtimeNotification(
  userId: string,
  tenantId: string,
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
  }
) {
  emitToUser(userId, 'notification', {
    ...notification,
    tenantId,
  });
}

/**
 * Send activity update
 */
export function sendActivityUpdate(
  tenantId: string,
  activity: {
    type: string;
    userId: string;
    resourceType: string;
    resourceId?: string;
    action: string;
    metadata?: Record<string, unknown>;
  }
) {
  emitToTenant(tenantId, 'activity', activity);
}

// ============== Connection Management ==============

/**
 * Get connected users count
 */
export function getConnectedUsersCount(tenantId?: string): number {
  if (!tenantId) {
    return connectedUsers.size;
  }

  let count = 0;
  connectedUsers.forEach((user) => {
    if (user.tenantId === tenantId) {
      count++;
    }
  });
  return count;
}

/**
 * Get connected users for tenant
 */
export function getConnectedUsers(tenantId: string): SocketUser[] {
  const users: SocketUser[] = [];
  connectedUsers.forEach((user) => {
    if (user.tenantId === tenantId) {
      users.push(user);
    }
  });
  return users;
}

/**
 * Check if user is connected
 */
export function isUserConnected(userId: string): boolean {
  return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
}

/**
 * Disconnect user
 */
export function disconnectUser(userId: string) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  sockets.forEach((socketId) => {
    const socket = io?.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect();
    }
  });

  userSockets.delete(userId);
}

// ============== Server-Sent Events (SSE) ==============

/**
 * Create SSE endpoint handler
 */
export function createSSEHandler() {
  return async (req: any, res: any) => {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const userId = (req as any).user?.id;
    const tenantId = (req as any).tenantId;

    if (!userId || !tenantId) {
      res.status(401).end();
      return;
    }

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write(`: keepalive\n\n`);
    }, 30000);

    // Listen for notifications
    const notificationListener = (data: any) => {
      if (data.userId === userId || data.tenantId === tenantId) {
        res.write(`data: ${JSON.stringify({ type: 'notification', data })}\n\n`);
      }
    };

    // Cleanup on close
    req.on('close', () => {
      clearInterval(keepAlive);
      res.end();
    });

    // Store connection for later use (in a real implementation)
    // This is a simplified version
  };
}

// ============== Utility Functions ==============

/**
 * Get Socket.IO instance
 */
export function getSocketIO(): SocketIOServer | null {
  return io;
}
