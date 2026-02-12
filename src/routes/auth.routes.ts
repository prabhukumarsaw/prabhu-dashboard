import { Router } from 'express';
import passport from '../config/passport';
import { authRequired } from '../middleware';
import * as authController from '../controllers/auth.controller';
import { body } from 'express-validator';
import { validate } from '../lib';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
    body('tenantId').optional().isString(),
    body('username').optional().isString().trim(),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').optional().isEmail(),
    body('username').optional().isString(),
    body('password').notEmpty(),
    body('tenantId').optional().isString(),
  ],
  validate,
  authController.login
);

router.post(
  '/refresh',
  [body('refreshToken').optional().isString()],
  validate,
  authController.refresh
);

router.post('/logout', authController.logout);
router.get('/me', authRequired, authController.me);

// OAuth - Google
router.get(
  '/google',
  (req, res, next) => {
    const state = (req.query.tenantId as string) || req.headers['x-tenant-id'] || '';
    (passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: state as string | undefined,
    }) as any)(req, res, next);
  }
);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    const user = req.user as { id: string; email: string; tenantId: string };
    if (!user) return res.redirect('/login?error=oauth');
    const authService = await import('../services/auth.service');
    const jwt = await import('../lib/jwt');
    const session = await authService.createSession(user.id, user.tenantId, req.ip, req.get('User-Agent'));
    const accessToken = jwt.signAccessToken({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      sessionId: session.id,
    });
    const refreshToken = jwt.signRefreshToken({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      sessionId: session.id,
    });
    res.redirect(`/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  }
);

// OAuth - Facebook
router.get(
  '/facebook',
  (req, res, next) => {
    const state = (req.query.tenantId as string) || req.headers['x-tenant-id'] || '';
    (passport.authenticate('facebook', {
      state: state as string | undefined,
    }) as any)(req, res, next);
  }
);
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  async (req, res) => {
    const user = req.user as { id: string; email: string; tenantId: string };
    if (!user) return res.redirect('/login?error=oauth');
    const authService = await import('../services/auth.service');
    const jwt = await import('../lib/jwt');
    const session = await authService.createSession(user.id, user.tenantId, req.ip, req.get('User-Agent'));
    const accessToken = jwt.signAccessToken({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      sessionId: session.id,
    });
    const refreshToken = jwt.signRefreshToken({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      sessionId: session.id,
    });
    res.redirect(`/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  }
);

// OTP
router.post(
  '/otp/request',
  [body('email').isEmail(), body('tenantId').optional().isString()],
  validate,
  authController.requestLoginOTP
);
router.post(
  '/otp/verify',
  [
    body('email').isEmail(),
    body('code').isLength({ min: 4, max: 8 }),
    body('tenantId').optional().isString(),
  ],
  validate,
  authController.verifyLoginOTP
);

// MFA (2FA) - requires auth
router.get('/mfa/setup', authRequired, authController.setupMFA);
router.post(
  '/mfa/verify',
  authRequired,
  [body('token').isLength({ min: 6, max: 6 })],
  validate,
  authController.verifyMFA
);

// Password reset
router.post(
  '/password/forgot',
  [body('email').isEmail(), body('tenantId').optional().isString()],
  validate,
  authController.requestPasswordReset
);

router.post(
  '/password/reset',
  [
    body('email').isEmail(),
    body('tenantId').optional().isString(),
    body('code').isLength({ min: 4, max: 8 }),
    body('newPassword').isLength({ min: 8 }),
  ],
  validate,
  authController.resetPassword
);

router.post(
  '/password/change',
  authRequired,
  [body('currentPassword').isLength({ min: 8 }), body('newPassword').isLength({ min: 8 })],
  validate,
  authController.changePassword
);

export default router;
