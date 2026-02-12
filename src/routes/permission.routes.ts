import { Router } from 'express';
import { authRequired, requirePermission } from '../middleware';
import * as permissionController from '../controllers/permission.controller';
import { query } from 'express-validator';
import { validate } from '../lib';

const router = Router();

router.use(authRequired);
router.get('/', requirePermission({ permissionCode: 'permission:read' }), [query('module').optional().isString()], validate, permissionController.list);

export default router;
