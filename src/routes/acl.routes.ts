import { Router } from 'express';
import { authRequired, requirePermission } from '../middleware';
import * as aclController from '../controllers/acl.controller';
import { body, param, query } from 'express-validator';
import { validate } from '../lib';

const router = Router();

router.use(authRequired);

router.get(
  '/',
  requirePermission({ permissionCode: 'acl:read' }),
  [query('subjectType').optional().isString(), query('subjectId').optional().isString(), query('resourceType').optional().isString(), query('resourceId').optional().isString()],
  validate,
  aclController.list
);
router.post(
  '/',
  requirePermission({ permissionCode: 'acl:create' }),
  [
    body('subjectType').isIn(['user', 'role']),
    body('subjectId').notEmpty(),
    body('resourceType').notEmpty(),
    body('resourceId').optional().trim(),
    body('permission').notEmpty(),
    body('conditions').optional().isObject(),
  ],
  validate,
  aclController.create
);
router.delete('/:id', requirePermission({ permissionCode: 'acl:delete' }), [param('id').isUUID()], validate, aclController.remove);

export default router;
