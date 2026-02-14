import { Router, type Router as ExpressRouter } from 'express';
import { authRequired, requirePermission } from '../../middleware';
import * as permissionController from '../../controllers/core/permission.controller';
import { query } from 'express-validator';
import { validate } from '../../lib';

const router: ExpressRouter = Router();

router.use(authRequired);
router.get('/', requirePermission({ permissionCode: 'permission:read' }), [query('module').optional().isString()], validate, permissionController.list);

export default router;
