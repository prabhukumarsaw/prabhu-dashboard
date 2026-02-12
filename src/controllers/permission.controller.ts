import { Request, Response } from 'express';
import * as permissionService from '../services/permission.service';

export async function list(req: Request, res: Response): Promise<void> {
  const moduleCode = req.query.module as string | undefined;
  const permissions = await permissionService.listPermissions(moduleCode);
  res.json({ success: true, data: { permissions } });
}
