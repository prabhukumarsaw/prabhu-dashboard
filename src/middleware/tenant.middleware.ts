import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { config } from '../config';

/**
 * Resolve tenant from:
 * 1. Header X-Tenant-Id or x-tenant-id
 * 2. Subdomain (if domain mapped)
 * 3. req.tenantId (set by auth)
 * 4. DEFAULT_TENANT_ID / first tenant
 */
export async function resolveTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
  const headerTenant = req.headers['x-tenant-id'] as string | undefined;
  const slug = (headerTenant || req.headers['x-tenant-slug']) as string | undefined;

  if (req.tenantId) {
    // Already set by auth
    next();
    return;
  }

  try {
    if (slug) {
      const tenant = await prisma.tenant.findFirst({
        where: { slug, isActive: true },
      });
      if (tenant) {
        req.tenantId = tenant.id;
        next();
        return;
      }
    }

    if (headerTenant) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: headerTenant, isActive: true },
      });
      if (tenant) {
        req.tenantId = tenant.id;
        next();
        return;
      }
    }

    // Default tenant for unauthenticated or fallback
    const defaultTenant = await prisma.tenant.findFirst({
      where: { slug: config.defaultTenantId, isActive: true },
    });
    if (defaultTenant) {
      req.tenantId = defaultTenant.id;
    }
  } catch (e) {
    // continue without tenant
  }
  next();
}
