import { Router, type Router as ExpressRouter } from 'express';
import { authRequired, requirePermission } from '../../middleware';
import * as notificationController from '../../controllers/core/notification.controller';
import { body, param, query } from 'express-validator';
import { validate } from '../../lib';

const router: ExpressRouter = Router();

router.use(authRequired);

// Create notification (admin only)
router.post(
  '/',
  requirePermission({ permissionCode: 'notification:create' }),
  [
    body('userId').isUUID(),
    body('type').isIn(['info', 'warning', 'error', 'success']),
    body('title').notEmpty().trim(),
    body('message').notEmpty().trim(),
    body('actionUrl').optional().isURL(),
    body('channels').optional().isArray(),
    body('sendEmail').optional().isBoolean(),
    body('sendPush').optional().isBoolean(),
  ],
  validate,
  notificationController.create
);

// Create bulk notifications
router.post(
  '/bulk',
  requirePermission({ permissionCode: 'notification:create' }),
  [
    body('userIds').isArray().notEmpty(),
    body('userIds.*').isUUID(),
    body('type').isIn(['info', 'warning', 'error', 'success']),
    body('title').notEmpty().trim(),
    body('message').notEmpty().trim(),
  ],
  validate,
  notificationController.createBulk
);

// Get user notifications
router.get(
  '/',
  [
    query('isRead').optional().isBoolean(),
    query('type').optional().isIn(['info', 'warning', 'error', 'success']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validate,
  notificationController.list
);

// Get unread count
router.get('/unread/count', notificationController.getUnreadCount);

// Mark as read
router.patch('/:id/read', [param('id').isUUID()], validate, notificationController.markAsRead);

// Mark all as read
router.patch('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', [param('id').isUUID()], validate, notificationController.remove);

// Preferences
router.get('/preferences', notificationController.getPreferences);
router.patch(
  '/preferences',
  [
    body('channel').isIn(['email', 'push', 'in_app', 'sms']),
    body('category').isIn(['security', 'billing', 'system', 'general']),
    body('enabled').isBoolean(),
  ],
  validate,
  notificationController.updatePreference
);

// Statistics
router.get(
  '/stats',
  requirePermission({ permissionCode: 'notification:read' }),
  [query('userId').optional().isUUID()],
  validate,
  notificationController.getStats
);

export default router;
