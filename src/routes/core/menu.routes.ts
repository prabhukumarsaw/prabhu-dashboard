import { Router, type Router as ExpressRouter } from 'express';
import { authRequired, requirePermission } from '../../middleware';
import * as menuController from '../../controllers/core/menu.controller';
import { body, param } from 'express-validator';
import { validate } from '../../lib';

const router: ExpressRouter = Router();

router.use(authRequired);

router.get('/', requirePermission({ permissionCode: 'menu:read' }), menuController.list);
router.get('/me', menuController.myMenus);
router.get('/:id', requirePermission({ permissionCode: 'menu:read' }), [param('id').isUUID()], validate, menuController.getById);
router.post(
  '/',
  requirePermission({ permissionCode: 'menu:create' }),
  [body('title').notEmpty().trim(), body('path').optional({ nullable: true }).trim(), body('icon').optional({ nullable: true }).trim(), body('parentId').optional({ nullable: true }).isUUID(), body('moduleId').optional({ nullable: true }).isUUID(), body('order').optional({ nullable: true }).isInt(), body('permissionCode').optional({ nullable: true }).trim()],
  validate,
  menuController.create
);
router.patch(
  '/:id',
  requirePermission({ permissionCode: 'menu:update' }),
  [param('id').isUUID(), body('title').optional().trim(), body('path').optional({ nullable: true }).trim(), body('icon').optional({ nullable: true }).trim(), body('parentId').optional({ nullable: true }).isUUID(), body('order').optional({ nullable: true }).isInt(), body('permissionCode').optional({ nullable: true }).trim(), body('isActive').optional().isBoolean()],
  validate,
  menuController.update
);
router.delete('/:id', requirePermission({ permissionCode: 'menu:delete' }), [param('id').isUUID()], validate, menuController.remove);

export default router;
