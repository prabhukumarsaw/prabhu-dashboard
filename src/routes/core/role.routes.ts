import { Router, type Router as ExpressRouter } from 'express';
import { authRequired, requirePermission } from '../../middleware';
import * as roleController from '../../controllers/core/role.controller';
import { body, param, query } from 'express-validator';
import { validate } from '../../lib';

const router: ExpressRouter = Router();

router.use(authRequired);

// List roles with searching and pagination
router.get(
  '/',
  requirePermission({ permissionCode: 'role:read' }),
  [
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('includeStats').optional().isBoolean(),
  ],
  validate,
  roleController.list
);

// Get single role
router.get('/:id', requirePermission({ permissionCode: 'role:read' }), [param('id').isUUID()], validate, roleController.getById);

// Create role
router.post(
  '/',
  requirePermission({ permissionCode: 'role:create' }),
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('code').notEmpty().withMessage('Code is required').trim(),
    body('description').optional().trim(),
    body('permissionIds').optional().isArray(),
    body('menuIds').optional().isArray(),
  ],
  validate,
  roleController.create
);

// Update role profile
router.patch(
  '/:id',
  requirePermission({ permissionCode: 'role:update' }),
  [
    param('id').isUUID(),
    body('name').optional().trim(),
    body('code').optional().trim(),
    body('description').optional().trim(),
    body('isActive').optional().isBoolean(),
    body('permissionIds').optional().isArray(),
    body('menuIds').optional().isArray(),
  ],
  validate,
  roleController.update
);

// Explicit status toggle (suspend/activate)
router.patch(
  '/:id/toggle-status',
  requirePermission({ permissionCode: 'role:update' }),
  [param('id').isUUID(), body('isActive').isBoolean().withMessage('isActive must be a boolean')],
  validate,
  roleController.toggleStatus
);

// Soft or Hard delete role (depending on service logic)
router.delete('/:id', requirePermission({ permissionCode: 'role:delete' }), [param('id').isUUID()], validate, roleController.remove);

export default router;
