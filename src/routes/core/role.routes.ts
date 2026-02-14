import { Router, type Router as ExpressRouter } from 'express';
import { authRequired, requirePermission } from '../../middleware';
import * as roleController from '../../controllers/core/role.controller';
import { body, param } from 'express-validator';
import { validate } from '../../lib';

const router: ExpressRouter = Router();

router.use(authRequired);

router.get('/', requirePermission({ permissionCode: 'role:read' }), roleController.list);
router.get('/:id', requirePermission({ permissionCode: 'role:read' }), [param('id').isUUID()], validate, roleController.getById);
router.post(
  '/',
  requirePermission({ permissionCode: 'role:create' }),
  [
    body('name').notEmpty().trim(),
    body('code').notEmpty().trim(),
    body('description').optional().trim(),
    body('permissionIds').optional().isArray(),
    body('menuIds').optional().isArray(),
  ],
  validate,
  roleController.create
);
router.patch(
  '/:id',
  requirePermission({ permissionCode: 'role:update' }),
  [param('id').isUUID(), body('name').optional().trim(), body('code').optional().trim(), body('description').optional().trim(), body('isActive').optional().isBoolean(), body('permissionIds').optional().isArray(), body('menuIds').optional().isArray()],
  validate,
  roleController.update
);
router.delete('/:id', requirePermission({ permissionCode: 'role:delete' }), [param('id').isUUID()], validate, roleController.remove);

export default router;
