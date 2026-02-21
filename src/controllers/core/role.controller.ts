import { Request, Response } from 'express';
import * as roleService from '../../services/core/role.service';

export async function list(req: Request, res: Response): Promise<void> {
  const { search, page, limit, includeStats } = req.query;
  const result = await roleService.listRoles(req.tenantId!, {
    search: search as string,
    page: page ? parseInt(page as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    includeStats: includeStats === 'true',
  });
  res.json({ success: true, data: result });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const role = await roleService.getRoleById(req.params.id, req.tenantId!);
  if (!role) {
    res.status(404).json({ success: false, message: 'Role not found' });
    return;
  }
  res.json({ success: true, data: { role } });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { name, code, description, permissionIds, menuIds } = req.body;
  const role = await roleService.createRole(req.tenantId!, {
    name,
    code,
    description,
    permissionIds,
    menuIds,
  });
  res.status(201).json({ success: true, data: { role } });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const role = await roleService.updateRole(id, req.tenantId!, req.body);
    res.json({ success: true, data: { role } });
  } catch (e: any) {
    if (e.message?.includes('System roles') || e.message?.includes('System role code')) {
      res.status(400).json({ success: false, message: e.message });
      return;
    }
    throw e;
  }
}

export async function toggleStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { isActive } = req.body;
  try {
    const role = await roleService.toggleRoleStatus(id, req.tenantId!, isActive);
    res.json({ success: true, data: { role } });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    await roleService.deleteRole(req.params.id, req.tenantId!);
    res.json({ success: true, message: 'Role deleted' });
  } catch (e: any) {
    if (e.message?.includes('System roles')) {
      res.status(400).json({ success: false, message: e.message });
      return;
    }
    throw e;
  }
}
