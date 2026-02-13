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
const express_1 = require("express");
const middleware_1 = require("../middleware");
const notificationController = __importStar(require("../controllers/notification.controller"));
const express_validator_1 = require("express-validator");
const lib_1 = require("../lib");
const router = (0, express_1.Router)();
router.use(middleware_1.authRequired);
// Create notification (admin only)
router.post('/', (0, middleware_1.requirePermission)({ permissionCode: 'notification:create' }), [
    (0, express_validator_1.body)('userId').isUUID(),
    (0, express_validator_1.body)('type').isIn(['info', 'warning', 'error', 'success']),
    (0, express_validator_1.body)('title').notEmpty().trim(),
    (0, express_validator_1.body)('message').notEmpty().trim(),
    (0, express_validator_1.body)('actionUrl').optional().isURL(),
    (0, express_validator_1.body)('channels').optional().isArray(),
    (0, express_validator_1.body)('sendEmail').optional().isBoolean(),
    (0, express_validator_1.body)('sendPush').optional().isBoolean(),
], lib_1.validate, notificationController.create);
// Create bulk notifications
router.post('/bulk', (0, middleware_1.requirePermission)({ permissionCode: 'notification:create' }), [
    (0, express_validator_1.body)('userIds').isArray().notEmpty(),
    (0, express_validator_1.body)('userIds.*').isUUID(),
    (0, express_validator_1.body)('type').isIn(['info', 'warning', 'error', 'success']),
    (0, express_validator_1.body)('title').notEmpty().trim(),
    (0, express_validator_1.body)('message').notEmpty().trim(),
], lib_1.validate, notificationController.createBulk);
// Get user notifications
router.get('/', [
    (0, express_validator_1.query)('isRead').optional().isBoolean(),
    (0, express_validator_1.query)('type').optional().isIn(['info', 'warning', 'error', 'success']),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }),
], lib_1.validate, notificationController.list);
// Get unread count
router.get('/unread/count', notificationController.getUnreadCount);
// Mark as read
router.patch('/:id/read', [(0, express_validator_1.param)('id').isUUID()], lib_1.validate, notificationController.markAsRead);
// Mark all as read
router.patch('/read-all', notificationController.markAllAsRead);
// Delete notification
router.delete('/:id', [(0, express_validator_1.param)('id').isUUID()], lib_1.validate, notificationController.remove);
// Preferences
router.get('/preferences', notificationController.getPreferences);
router.patch('/preferences', [
    (0, express_validator_1.body)('channel').isIn(['email', 'push', 'in_app', 'sms']),
    (0, express_validator_1.body)('category').isIn(['security', 'billing', 'system', 'general']),
    (0, express_validator_1.body)('enabled').isBoolean(),
], lib_1.validate, notificationController.updatePreference);
// Statistics
router.get('/stats', (0, middleware_1.requirePermission)({ permissionCode: 'notification:read' }), [(0, express_validator_1.query)('userId').optional().isUUID()], lib_1.validate, notificationController.getStats);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map