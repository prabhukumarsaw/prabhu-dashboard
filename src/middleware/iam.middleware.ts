import { Request, Response, NextFunction } from 'express';
import { canAccess, getUserAttributes } from '../services/core/iam.service';
import { prisma } from '../lib/prisma';

type IAMOptions = {
  // Direct permission code (e.g. "user:read")
  permissionCode?: string;
  // Dynamic mapping based on resource/action (e.g. resource="user", action="read")
  permissionResource?: string;
  permissionAction?: string;
  // ACL resource metadata
  resourceType?: string;
  resourceIdParam?: string; // req.params key for resource id
  action?: string;
};

/**
 * Middleware: require IAM access (RBAC/ABAC/PBAC/ACL).
 * Use after authRequired so req.user is set.
 */
export function requirePermission(options: IAMOptions) {
  const { permissionCode, permissionResource, permissionAction, resourceType, resourceIdParam, action } = options;

  return async function iamCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const user = req.user as any;
    const tenantId = req.tenantId || user.tenantId;
    const roleIds = user.userRoles?.map((ur: any) => ur.role.id) || [];
    const resourceId = resourceIdParam && req.params[resourceIdParam] ? req.params[resourceIdParam] : undefined;
    const attributes = await getUserAttributes(user.id);

    let effectivePermissionCode = permissionCode;

    // If no explicit permission code, resolve dynamically from resource+action
    if (!effectivePermissionCode && permissionResource && permissionAction) {
      const perm = await prisma.permission.findFirst({
        where: {
          resource: permissionResource,
          action: permissionAction,
          isActive: true,
        },
      });
      if (!perm) {
        res.status(403).json({ success: false, message: 'Permission mapping not found for resource/action' });
        return;
      }
      effectivePermissionCode = perm.code;
    }

    const allowed = await canAccess({
      userId: user.id,
      tenantId,
      roleIds,
      attributes,
      permissionCode: effectivePermissionCode,
      resourceType,
      resourceId,
      action,
    });

    if (!allowed) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

/** Require one of the given permission codes (OR) */
export function requireAnyPermission(permissionCodes: string[]) {
  return async function iamCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const user = req.user as any;
    const tenantId = req.tenantId || user.tenantId;
    const roleIds = user.userRoles?.map((ur: any) => ur.role.id) || [];
    const attributes = await getUserAttributes(user.id);

    for (const code of permissionCodes) {
      const allowed = await canAccess({
        userId: user.id,
        tenantId,
        roleIds,
        attributes,
        permissionCode: code,
      });
      if (allowed) {
        next();
        return;
      }
    }

    res.status(403).json({ success: false, message: 'Insufficient permissions' });
  };
}
