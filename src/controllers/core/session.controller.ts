import { Request, Response } from 'express';
import * as sessionService from '../../services/core/session.service';

export async function list(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const user = req.user as any;
  const sessions = await sessionService.listUserSessions(user.id, user.tenantId);
  res.json({ success: true, data: { sessions } });
}

export async function revoke(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const { id } = req.params;
  const user = req.user as any;
  await sessionService.revokeSession(id, user.id);
  res.json({ success: true, message: 'Session revoked' });
}

export async function revokeAll(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const user = req.user as any;
  await sessionService.revokeAllSessions(user.id, user.tenantId, req.sessionId);
  res.json({ success: true, message: 'All other sessions revoked' });
}
