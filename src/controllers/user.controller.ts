import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import * as authService from '../services/auth.service';

export async function list(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId!;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const search = req.query.search as string | undefined;
  const result = await userService.listUsers(tenantId, page, limit, search);
  const users = result.users.map((u) => authService.sanitizeUser(u));
  res.json({
    success: true,
    data: { users, total: result.total, page: result.page, limit: result.limit },
  });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = await userService.getUserById(id, req.tenantId!);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({ success: true, data: { user: authService.sanitizeUser(user) } });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { email, username, password, firstName, lastName, phone, roleIds } = req.body;
  const user = await userService.createUser({
    tenantId: req.tenantId!,
    email,
    username,
    password,
    firstName,
    lastName,
    phone,
    roleIds,
  });
  res.status(201).json({ success: true, data: { user: authService.sanitizeUser(user) } });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = await userService.updateUser(id, req.tenantId!, req.body);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({ success: true, data: { user: authService.sanitizeUser(user) } });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  await userService.deleteUser(id, req.tenantId!);
  res.json({ success: true, message: 'User deleted' });
}
