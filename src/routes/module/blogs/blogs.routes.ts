import { Router, type Router as ExpressRouter } from 'express';
import * as blogController from '../../../controllers/module/blogs/blogs.controller';
import { body } from 'express-validator';
import { validate } from '../../../lib';
import { authRequired, requirePermission } from '../../../middleware';

const router: ExpressRouter = Router();

// All blog routes require authentication
router.use(authRequired);

router.get(
  '/',
  requirePermission({ permissionCode: 'blog:read' }),
  blogController.list
);

router.get(
  '/:id',
  requirePermission({ permissionCode: 'blog:read' }),
  blogController.getById
);

router.post(
  '/',
  requirePermission({ permissionCode: 'blog:create' }),
  [
    body('title').isString().trim(),
    body('content').isString().trim(),
  ],
  validate,
  blogController.create
);

router.patch(
  '/:id',
  requirePermission({ permissionCode: 'blog:update' }),
  [
    body('title').optional().isString().trim(),
    body('content').optional().isString().trim(),
  ],
  validate,
  blogController.update
);

router.delete(
  '/:id',
  requirePermission({ permissionCode: 'blog:delete' }),
  blogController.remove
);

export default router;
