import { Router } from 'express';
import authRoutes from './core/auth.routes';
import userRoutes from './core/user.routes';
import roleRoutes from './core/role.routes';
import sessionRoutes from './core/session.routes';
import tenantRoutes from './core/tenant.routes';
import menuRoutes from './core/menu.routes';
import permissionRoutes from './core/permission.routes';
import policyRoutes from './core/policy.routes';
import aclRoutes from './core/acl.routes';
import notificationRoutes from './core/notification.routes';
import fileRoutes from './core/file.routes';
import searchRoutes from './core/search.routes';
import exportImportRoutes from './core/export-import.routes';
import realtimeRoutes from './core/realtime.routes';
import blogRoutes from './module/blogs/blogs.routes';

const router = Router();

// -------------------- core routes --------------------
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/sessions', sessionRoutes);
router.use('/tenants', tenantRoutes);
router.use('/menus', menuRoutes);
router.use('/permissions', permissionRoutes);
router.use('/policies', policyRoutes);
router.use('/acl', aclRoutes);
router.use('/notifications', notificationRoutes);
router.use('/files', fileRoutes);
router.use('/search', searchRoutes);
router.use('/export-import', exportImportRoutes);
router.use('/realtime', realtimeRoutes);

// -------------------- end core routes --------------------

// -------------------- blog routes --------------------
router.use('/blogs', blogRoutes);
// -------------------- end blog routes --------------------

export default router;
