import { Request, Response } from 'express';
import * as tenantService from '../../services/core/tenant.service';

export async function list(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const search = req.query.search as string | undefined;
  const result = await tenantService.listTenants(page, limit, search);
  res.json({ success: true, data: result });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const tenant = await tenantService.getTenantById(req.params.id);
  if (!tenant) {
    res.status(404).json({ success: false, message: 'Tenant not found' });
    return;
  }
  res.json({ success: true, data: { tenant } });
}

export async function getBySlug(req: Request, res: Response): Promise<void> {
  const tenant = await tenantService.getTenantBySlug(req.params.slug);
  if (!tenant) {
    res.status(404).json({ success: false, message: 'Tenant not found' });
    return;
  }
  res.json({ success: true, data: { tenant } });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { name, slug, domain, logo, settings } = req.body;
  const tenant = await tenantService.createTenant({ name, slug, domain, logo, settings });
  res.status(201).json({ success: true, data: { tenant } });
}

export async function update(req: Request, res: Response): Promise<void> {
  const tenant = await tenantService.updateTenant(req.params.id, req.body);
  res.json({ success: true, data: { tenant } });
}

export async function enableModule(req: Request, res: Response): Promise<void> {
  const { tenantId, moduleId } = req.params;
  const config = req.body.config;
  const result = await tenantService.enableModule(tenantId, moduleId, config);
  res.json({ success: true, data: result });
}

export async function disableModule(req: Request, res: Response): Promise<void> {
  const { tenantId, moduleId } = req.params;
  await tenantService.disableModule(tenantId, moduleId);
  res.json({ success: true, message: 'Module disabled' });
}
