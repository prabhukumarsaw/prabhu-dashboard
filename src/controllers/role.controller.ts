import { Request, Response } from 'express';
import * as roleService from '../services/role.service';

export async function list(req: Request, res: Response): Promise<void> {
  const roles = await roleService.listRoles(req.tenantId!);
  res.json({ success: true, data: { roles } });
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
    if (e.message?.includes('System roles')) {
      res.status(400).json({ success: false, message: e.message });
      return;
    }
    throw e;
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
