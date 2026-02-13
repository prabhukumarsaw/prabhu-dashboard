"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
exports.requireAnyPermission = requireAnyPermission;
const iam_service_1 = require("../services/iam.service");
const prisma_1 = require("../lib/prisma");
/**
 * Middleware: require IAM access (RBAC/ABAC/PBAC/ACL).
 * Use after authRequired so req.user is set.
 */
function requirePermission(options) {
    const { permissionCode, permissionResource, permissionAction, resourceType, resourceIdParam, action } = options;
    return async function iamCheck(req, res, next) {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const user = req.user;
        const tenantId = req.tenantId || user.tenantId;
        const roleIds = user.userRoles?.map((ur) => ur.role.id) || [];
        const resourceId = resourceIdParam && req.params[resourceIdParam] ? req.params[resourceIdParam] : undefined;
        const attributes = await (0, iam_service_1.getUserAttributes)(user.id);
        let effectivePermissionCode = permissionCode;
        // If no explicit permission code, resolve dynamically from resource+action
        if (!effectivePermissionCode && permissionResource && permissionAction) {
            const perm = await prisma_1.prisma.permission.findFirst({
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
        const allowed = await (0, iam_service_1.canAccess)({
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
function requireAnyPermission(permissionCodes) {
    return async function iamCheck(req, res, next) {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const user = req.user;
        const tenantId = req.tenantId || user.tenantId;
        const roleIds = user.userRoles?.map((ur) => ur.role.id) || [];
        const attributes = await (0, iam_service_1.getUserAttributes)(user.id);
        for (const code of permissionCodes) {
            const allowed = await (0, iam_service_1.canAccess)({
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
//# sourceMappingURL=iam.middleware.js.map