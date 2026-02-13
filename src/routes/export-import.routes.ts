import { Router, type Router as ExpressRouter } from 'express';
import { authRequired, requirePermission } from '../middleware';
import * as exportImportController from '../controllers/export-import.controller';
import { body, param, query } from 'express-validator';
import { validate } from '../lib';

const router: ExpressRouter = Router();

router.use(authRequired);

// Export
router.post(
  '/export',
  requirePermission({ permissionCode: 'export:create' }),
  [
    body('resourceType').isIn(['user', 'role', 'permission', 'menu']),
    body('format').isIn(['csv', 'json', 'xlsx']),
    body('filters').optional().isObject(),
    body('fields').optional().isArray(),
  ],
  validate,
  exportImportController.exportResources
);

router.get(
  '/export/:jobId',
  [param('jobId').isUUID()],
  validate,
  exportImportController.getExportJob
);

// Import
router.post(
  '/import',
  requirePermission({ permissionCode: 'import:create' }),
  [
    body('resourceType').isIn(['user', 'role', 'permission', 'menu']),
    body('format').isIn(['csv', 'json', 'xlsx']),
    body('fileId').isUUID(),
    body('options').optional().isObject(),
  ],
  validate,
  exportImportController.importResources
);

router.get(
  '/import/:jobId',
  [param('jobId').isUUID()],
  validate,
  exportImportController.getImportJob
);

// List jobs
router.get(
  '/jobs',
  [query('type').isIn(['export', 'import'])],
  validate,
  exportImportController.listJobs
);

export default router;
