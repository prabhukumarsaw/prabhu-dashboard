"use strict";
/**
 * Real-time Service - WebSocket and Server-Sent Events
 * Supports: Real-time notifications, live activity feed, collaborative features
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocketIO = initializeSocketIO;
exports.emitToUser = emitToUser;
exports.emitToTenant = emitToTenant;
exports.emitToRoom = emitToRoom;
exports.emitToAll = emitToAll;
exports.sendRealtimeNotification = sendRealtimeNotification;
exports.sendActivityUpdate = sendActivityUpdate;
exports.getConnectedUsersCount = getConnectedUsersCount;
exports.getConnectedUsers = getConnectedUsers;
exports.isUserConnected = isUserConnected;
exports.disconnectUser = disconnectUser;
exports.createSSEHandler = createSSEHandler;
exports.getSocketIO = getSocketIO;
const socket_io_1 = require("socket.io");
const logger_1 = require("../lib/logger");
const jwt_1 = require("../lib/jwt");
// ============== Socket.IO Server ==============
let io = null;
const connectedUsers = new Map(); // socketId -> user
const userSockets = new Map(); // userId -> Set<socketId>
/**
 * Initialize Socket.IO server
 */
function initializeSocketIO(httpServer) {
    io = new socket_io_1.Server(httpServer, {
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
            const payload = (0, jwt_1.verifyToken)(token);
            if (payload.type !== 'access') {
                return next(new Error('Invalid token type'));
            }
            // Attach user info to socket
            socket.userId = payload.sub;
            socket.tenantId = payload.tenantId;
            socket.sessionId = payload.sessionId;
            next();
        }
        catch (error) {
            next(new Error('Invalid token'));
        }
    });
    // Connection handler
    io.on('connection', handleConnection);
    logger_1.logger.info('Socket.IO server initialized');
    return io;
}
/**
 * Handle new socket connection
 */
function handleConnection(socket) {
    const userId = socket.userId;
    const tenantId = socket.tenantId;
    const socketId = socket.id;
    // Store connection
    connectedUsers.set(socketId, { userId, tenantId, socketId });
    if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socketId);
    // Join tenant room
    socket.join(`tenant:${tenantId}`);
    socket.join(`user:${userId}`);
    logger_1.logger.info('User connected', { userId, tenantId, socketId });
    // Handle disconnection
    socket.on('disconnect', () => {
        handleDisconnection(socketId, userId);
    });
    // Handle custom events
    socket.on('subscribe', (room) => {
        socket.join(room);
        logger_1.logger.debug('User subscribed to room', { userId, room });
    });
    socket.on('unsubscribe', (room) => {
        socket.leave(room);
        logger_1.logger.debug('User unsubscribed from room', { userId, room });
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
function handleDisconnection(socketId, userId) {
    connectedUsers.delete(socketId);
    const sockets = userSockets.get(userId);
    if (sockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
            userSockets.delete(userId);
        }
    }
    logger_1.logger.info('User disconnected', { userId, socketId });
}
// ============== Event Broadcasting ==============
/**
 * Emit event to specific user
 */
function emitToUser(userId, event, data) {
    if (!io) {
        logger_1.logger.warn('Socket.IO not initialized');
        return;
    }
    io.to(`user:${userId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
    });
    logger_1.logger.debug('Event emitted to user', { userId, event });
}
/**
 * Emit event to tenant
 */
function emitToTenant(tenantId, event, data) {
    if (!io) {
        logger_1.logger.warn('Socket.IO not initialized');
        return;
    }
    io.to(`tenant:${tenantId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
    });
    logger_1.logger.debug('Event emitted to tenant', { tenantId, event });
}
/**
 * Emit event to room
 */
function emitToRoom(room, event, data) {
    if (!io) {
        logger_1.logger.warn('Socket.IO not initialized');
        return;
    }
    io.to(room).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
    });
    logger_1.logger.debug('Event emitted to room', { room, event });
}
/**
 * Emit event to all connected clients
 */
function emitToAll(event, data) {
    if (!io) {
        logger_1.logger.warn('Socket.IO not initialized');
        return;
    }
    io.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
    });
    logger_1.logger.debug('Event emitted to all', { event });
}
// ============== Notification Helpers ==============
/**
 * Send real-time notification
 */
function sendRealtimeNotification(userId, tenantId, notification) {
    emitToUser(userId, 'notification', {
        ...notification,
        tenantId,
    });
}
/**
 * Send activity update
 */
function sendActivityUpdate(tenantId, activity) {
    emitToTenant(tenantId, 'activity', activity);
}
// ============== Connection Management ==============
/**
 * Get connected users count
 */
function getConnectedUsersCount(tenantId) {
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
function getConnectedUsers(tenantId) {
    const users = [];
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
function isUserConnected(userId) {
    return userSockets.has(userId) && userSockets.get(userId).size > 0;
}
/**
 * Disconnect user
 */
function disconnectUser(userId) {
    const sockets = userSockets.get(userId);
    if (!sockets)
        return;
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
function createSSEHandler() {
    return async (req, res) => {
        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        const userId = req.user?.id;
        const tenantId = req.tenantId;
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
        const notificationListener = (data) => {
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
function getSocketIO() {
    return io;
}
//# sourceMappingURL=realtime.service.js.map