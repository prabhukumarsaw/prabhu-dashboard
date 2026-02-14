import { Router, type Router as ExpressRouter } from 'express';
import { authRequired, requirePermission } from '../../middleware';
import * as fileController from '../../controllers/core/file.controller';
import { param, query } from 'express-validator';
import { validate } from '../../lib';

const router: ExpressRouter = Router();

router.use(authRequired);

// Upload file
router.post(
  '/',
  requirePermission({ permissionCode: 'file:create' }),
  fileController.uploadMiddleware,
  fileController.uploadFile
);

// List files
router.get(
  '/',
  [
    query('userId').optional().isUUID(),
    query('mimeType').optional().isString(),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  fileController.list
);

// Get file info
router.get('/:id', [param('id').isUUID()], validate, fileController.getById);

// Download file
router.get('/:id/download', [param('id').isUUID()], validate, fileController.download);

// Delete file
router.delete(
  '/:id',
  requirePermission({ permissionCode: 'file:delete' }),
  [param('id').isUUID()],
  validate,
  fileController.remove
);

// File sharing
router.post(
  '/:fileId/share',
  [param('fileId').isUUID(), query('password').optional().isString(), query('expiresAt').optional().isISO8601()],
  validate,
  fileController.createShare
);

router.get('/share/:token', fileController.getByShareToken);

router.get('/:fileId/shares', [param('fileId').isUUID()], validate, fileController.listShares);

router.delete('/:fileId/share/:token', [param('fileId').isUUID(), param('token').isString()], validate, fileController.revokeShare);

// Storage usage
router.get('/storage/usage', fileController.getStorageUsage);

// Statistics
router.get(
  '/stats',
  requirePermission({ permissionCode: 'file:read' }),
  [query('userId').optional().isUUID()],
  validate,
  fileController.getStats
);

export default router;
