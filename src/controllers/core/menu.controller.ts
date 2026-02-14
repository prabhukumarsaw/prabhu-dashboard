import { Request, Response } from 'express';
import * as menuService from '../../services/core/menu.service';

export async function list(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId!;
  const menus = await menuService.listMenusForTenant(tenantId);
  res.json({ success: true, data: { menus } });
}

export async function myMenus(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const user = req.user as any;
  const menus = await menuService.listMenusForUser(user.id, user.tenantId);
  res.json({ success: true, data: { menus } });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const menu = await menuService.getMenuById(req.params.id, req.tenantId!);
  if (!menu) {
    res.status(404).json({ success: false, message: 'Menu not found' });
    return;
  }
  res.json({ success: true, data: { menu } });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { title, path, icon, parentId, moduleId, order, permissionCode } = req.body;
  const menu = await menuService.createMenu(req.tenantId!, {
    title,
    path,
    icon,
    parentId,
    moduleId,
    order,
    permissionCode,
  });
  res.status(201).json({ success: true, data: { menu } });
}

export async function update(req: Request, res: Response): Promise<void> {
  const menu = await menuService.updateMenu(req.params.id, req.tenantId!, req.body);
  res.json({ success: true, data: { menu } });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await menuService.deleteMenu(req.params.id, req.tenantId!);
  res.json({ success: true, message: 'Menu deleted' });
}
