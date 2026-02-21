import { Request, Response } from 'express';
import * as userService from '../../services/core/user.service';
import * as authService from '../../services/core/auth.service';

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

export async function listAll(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const search = req.query.search as string | undefined;

  const filters = {
    email: req.query.email as string | undefined,
    username: req.query.username as string | undefined,
    phone: req.query.phone as string | undefined,
    firstName: req.query.firstName as string | undefined,
    lastName: req.query.lastName as string | undefined,
    fromDate: req.query.fromDate as string | undefined,
    toDate: req.query.toDate as string | undefined,
    status: req.query.status as string | undefined,
    tenantId: req.query.tenantId as string | undefined,
  };

  const result = await userService.listAllUsers(page, limit, search, filters);
  const users = result.users.map((u) => authService.sanitizeUser(u));

  res.json({
    success: true,
    data: {
      users,
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
      stats: result.stats
    },
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
  const {
    email, username, password, firstName, lastName, phone, roleIds,
    address, state, country, zipCode, organization, currency, locale, timezone, avatar, isActive
  } = req.body;
  try {
    const user = await userService.createUser({
      tenantId: req.tenantId!,
      email,
      username,
      password,
      firstName,
      lastName,
      phone,
      roleIds,
      address,
      state,
      country,
      zipCode,
      organization,
      currency,
      locale,
      timezone,
      avatar,
      isActive
    });
    res.status(201).json({ success: true, data: { user: authService.sanitizeUser(user) } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'User creation failed' });
  }
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
