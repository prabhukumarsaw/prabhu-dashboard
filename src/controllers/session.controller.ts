import { Request, Response } from 'express';
import * as sessionService from '../services/session.service';

export async function list(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const sessions = await sessionService.listUserSessions(req.user.id, req.user.tenantId);
  res.json({ success: true, data: { sessions } });
}

export async function revoke(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const { id } = req.params;
  await sessionService.revokeSession(id, req.user.id);
  res.json({ success: true, message: 'Session revoked' });
}

export async function revokeAll(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  await sessionService.revokeAllSessions(req.user.id, req.user.tenantId, req.sessionId);
  res.json({ success: true, message: 'All other sessions revoked' });
}
