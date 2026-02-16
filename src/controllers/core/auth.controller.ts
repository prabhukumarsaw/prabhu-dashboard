import { Request, Response } from 'express';
import * as authService from '../../services/core/auth.service';
import * as userService from '../../services/core/user.service';
import { createSession } from '../../services/core/auth.service';
import { signAccessToken, signRefreshToken } from '../../lib/jwt';
import { config } from '../../config';

export async function register(req: Request, res: Response): Promise<void> {
  const { tenantId, email, username, password, firstName, lastName } = req.body;
  const tid = tenantId || req.tenantId;

  try {
    const user = await authService.register({
      tenantId: tid!,
      email,
      username,
      password,
      firstName,
      lastName,
    });

    const session = await createSession(user.id, user.tenantId, req.ip, req.get('User-Agent'));

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      sessionId: session.id,
    };

    res.status(201).json({
      success: true,
      data: {
        user: authService.sanitizeUser(user),
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload),
        expiresIn: config.jwt.accessExpiry,
        sessionId: session.id,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Registration failed' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, username, password, tenantId } = req.body;
  const tenantIdResolved = tenantId || req.tenantId;
  if (!tenantIdResolved) {
    res.status(400).json({ success: false, message: 'Tenant is required' });
    return;
  }
  try {
    const result = await authService.login({
      tenantId: tenantIdResolved,
      email,
      username,
      password,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Login failed' });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (!refreshToken) {
    res.status(400).json({ success: false, message: 'Refresh token required' });
    return;
  }
  try {
    const result = await authService.refreshTokens(refreshToken);
    res.json({ success: true, data: result });
  } catch (error: any) {
    const status = error.message.includes('expired') || error.message.includes('Invalid') ? 401 : 400;
    res.status(status).json({ success: false, message: error.message || 'Refresh failed' });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  await authService.logout(refreshToken, req.sessionId);
  res.json({ success: true, message: 'Logged out' });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const user = req.user as any;
  res.json({
    success: true,
    data: { user: authService.sanitizeUser(user) },
  });
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  try {
    const userId = (req.user as any).id;
    const tenantId = req.tenantId!;
    const user = await userService.updateUser(userId, tenantId, req.body);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: { user: authService.sanitizeUser(user) } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Profile update failed' });
  }
}

// ---------- OTP / 2FA ----------
export async function setupMFA(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const result = await authService.setupMFA((req.user as any).id);
  res.json({ success: true, data: result });
}

export async function verifyMFA(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const { token } = req.body;
  const valid = await authService.verifyMFA((req.user as any).id, token);
  if (!valid) {
    res.status(400).json({ success: false, message: 'Invalid OTP' });
    return;
  }
  res.json({ success: true, message: 'MFA enabled' });
}

export async function requestLoginOTP(req: Request, res: Response): Promise<void> {
  const { email, tenantId } = req.body;
  const tid = tenantId || req.tenantId;
  if (!tid || !email) {
    res.status(400).json({ success: false, message: 'Email and tenant required' });
    return;
  }
  const result = await authService.requestLoginOTP(tid, email);
  if (!result) {
    res.status(400).json({ success: false, message: 'User not found or inactive' });
    return;
  }
  res.json({ success: true, message: 'OTP sent to email', data: { expiresIn: 600 } });
}

export async function verifyLoginOTP(req: Request, res: Response): Promise<void> {
  const { email, code, tenantId } = req.body;
  const tid = tenantId || req.tenantId;
  if (!tid || !email || !code) {
    res.status(400).json({ success: false, message: 'Email, code and tenant required' });
    return;
  }
  try {
    const result = await authService.loginWithOTP(
      tid,
      email,
      code,
      req.ip,
      req.get('User-Agent')
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message || 'OTP verification failed' });
  }
}

// ---------- Password reset ----------

export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
  const { email, tenantId } = req.body;
  const tid = tenantId || req.tenantId;
  if (!tid || !email) {
    res.status(400).json({ success: false, message: 'Email and tenant required' });
    return;
  }
  await authService.requestPasswordReset(tid, email);
  // Always return success to avoid user enumeration
  res.json({ success: true, message: 'If the account exists, a reset OTP has been sent' });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, tenantId, code, newPassword } = req.body;
  const tid = tenantId || req.tenantId;
  if (!tid || !email || !code || !newPassword) {
    res.status(400).json({ success: false, message: 'Email, tenant, code and new password required' });
    return;
  }
  try {
    await authService.resetPasswordWithOTP(tid, email, code, newPassword);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message || 'Invalid or expired OTP' });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ success: false, message: 'Current and new password are required' });
    return;
  }
  try {
    await authService.changePassword((req.user as any).id, currentPassword, newPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message || 'Unable to change password' });
  }
}

export async function listSessions(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  try {
    const sessions = await authService.listSessions((req.user as any).id);
    res.json({ success: true, data: sessions });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to list sessions' });
  }
}
