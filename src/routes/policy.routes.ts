import { Router } from 'express';
import { authRequired, requirePermission } from '../middleware';
import * as policyController from '../controllers/policy.controller';
import { body, param } from 'express-validator';
import { validate } from '../lib';

const router = Router();

router.use(authRequired);

router.get('/', requirePermission({ permissionCode: 'policy:read' }), policyController.list);
router.get('/:id', requirePermission({ permissionCode: 'policy:read' }), [param('id').isUUID()], validate, policyController.getById);
router.post(
  '/',
  requirePermission({ permissionCode: 'policy:create' }),
  [body('name').notEmpty().trim(), body('code').notEmpty().trim(), body('effect').isIn(['ALLOW', 'DENY']), body('priority').optional().isInt(), body('description').optional().trim(), body('rules').optional().isArray()],
  validate,
  policyController.create
);
router.patch(
  '/:id',
  requirePermission({ permissionCode: 'policy:update' }),
  [param('id').isUUID(), body('name').optional().trim(), body('code').optional().trim(), body('effect').optional().isIn(['ALLOW', 'DENY']), body('priority').optional().isInt(), body('isActive').optional().isBoolean()],
  validate,
  policyController.update
);
router.delete('/:id', requirePermission({ permissionCode: 'policy:delete' }), [param('id').isUUID()], validate, policyController.remove);

export default router;
