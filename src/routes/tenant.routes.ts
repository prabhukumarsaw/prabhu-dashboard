import { Router, type Router as ExpressRouter } from 'express';
import { authRequired, requirePermission } from '../middleware';
import * as tenantController from '../controllers/tenant.controller';
import { body, param, query } from 'express-validator';
import { validate } from '../lib';

const router: ExpressRouter = Router();

router.get(
  '/',
  authRequired,
  requirePermission({ permissionCode: 'tenant:read' }),
  [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 }), query('search').optional().isString()],
  validate,
  tenantController.list
);

router.get('/slug/:slug', authRequired, [param('slug').notEmpty()], validate, tenantController.getBySlug);
router.get('/:id', authRequired, requirePermission({ permissionCode: 'tenant:read' }), [param('id').isUUID()], validate, tenantController.getById);
router.post(
  '/',
  authRequired,
  requirePermission({ permissionCode: 'tenant:create' }),
  [body('name').notEmpty().trim(), body('slug').notEmpty().trim(), body('domain').optional().trim(), body('logo').optional().trim(), body('settings').optional().isObject()],
  validate,
  tenantController.create
);
router.patch(
  '/:id',
  authRequired,
  requirePermission({ permissionCode: 'tenant:update' }),
  [param('id').isUUID(), body('name').optional().trim(), body('slug').optional().trim(), body('domain').optional().trim(), body('logo').optional().trim(), body('settings').optional().isObject(), body('isActive').optional().isBoolean()],
  validate,
  tenantController.update
);

router.post('/:tenantId/modules/:moduleId/enable', authRequired, requirePermission({ permissionCode: 'tenant:update' }), tenantController.enableModule);
router.post('/:tenantId/modules/:moduleId/disable', authRequired, requirePermission({ permissionCode: 'tenant:update' }), tenantController.disableModule);

export default router;
