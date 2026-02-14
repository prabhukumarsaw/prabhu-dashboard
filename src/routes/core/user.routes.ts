import { Router, type Router as ExpressRouter } from 'express';
import { authRequired, requirePermission } from '../../middleware';
import * as userController from '../../controllers/core/user.controller';
import { body, param, query } from 'express-validator';
import { validate } from '../../lib';

const router: ExpressRouter = Router();

router.use(authRequired);

router.get(
  '/',
  requirePermission({ permissionCode: 'user:read' }),
  [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 }), query('search').optional().isString()],
  validate,
  userController.list
);

router.get(
  '/:id',
  requirePermission({ permissionCode: 'user:read' }),
  [param('id').isUUID()],
  validate,
  userController.getById
);

router.post(
  '/',
  requirePermission({ permissionCode: 'user:create' }),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 8 }),
    body('username').optional().trim(),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('phone').optional().trim(),
    body('roleIds').optional().isArray(),
    body('roleIds.*').optional().isUUID(),
  ],
  validate,
  userController.create
);

router.patch(
  '/:id',
  requirePermission({ permissionCode: 'user:update' }),
  [
    param('id').isUUID(),
    body('email').optional().isEmail(),
    body('password').optional().isLength({ min: 8 }),
    body('username').optional().trim(),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('phone').optional().trim(),
    body('isActive').optional().isBoolean(),
    body('roleIds').optional().isArray(),
  ],
  validate,
  userController.update
);

router.delete(
  '/:id',
  requirePermission({ permissionCode: 'user:delete' }),
  [param('id').isUUID()],
  validate,
  userController.remove
);

export default router;
