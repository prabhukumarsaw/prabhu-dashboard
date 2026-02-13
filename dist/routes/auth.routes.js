"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("../config/passport"));
const middleware_1 = require("../middleware");
const authController = __importStar(require("../controllers/auth.controller"));
const express_validator_1 = require("express-validator");
const lib_1 = require("../lib");
const router = (0, express_1.Router)();
router.post('/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
    (0, express_validator_1.body)('tenantId').optional().isString(),
    (0, express_validator_1.body)('username').optional().isString().trim(),
    (0, express_validator_1.body)('firstName').optional().trim(),
    (0, express_validator_1.body)('lastName').optional().trim(),
], lib_1.validate, authController.register);
router.post('/login', [
    (0, express_validator_1.body)('email').optional().isEmail(),
    (0, express_validator_1.body)('username').optional().isString(),
    (0, express_validator_1.body)('password').notEmpty(),
    (0, express_validator_1.body)('tenantId').optional().isString(),
], lib_1.validate, authController.login);
router.post('/refresh', [(0, express_validator_1.body)('refreshToken').optional().isString()], lib_1.validate, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', middleware_1.authRequired, authController.me);
// OAuth - Google
router.get('/google', (req, res, next) => {
    const state = req.query.tenantId || req.headers['x-tenant-id'] || '';
    passport_1.default.authenticate('google', {
        scope: ['profile', 'email'],
        state: state,
    })(req, res, next);
});
router.get('/google/callback', passport_1.default.authenticate('google', { session: false }), async (req, res) => {
    const user = req.user;
    if (!user)
        return res.redirect('/login?error=oauth');
    const authService = await Promise.resolve().then(() => __importStar(require('../services/auth.service')));
    const jwt = await Promise.resolve().then(() => __importStar(require('../lib/jwt')));
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
});
// OAuth - Facebook
router.get('/facebook', (req, res, next) => {
    const state = req.query.tenantId || req.headers['x-tenant-id'] || '';
    passport_1.default.authenticate('facebook', {
        state: state,
    })(req, res, next);
});
router.get('/facebook/callback', passport_1.default.authenticate('facebook', { session: false }), async (req, res) => {
    const user = req.user;
    if (!user)
        return res.redirect('/login?error=oauth');
    const authService = await Promise.resolve().then(() => __importStar(require('../services/auth.service')));
    const jwt = await Promise.resolve().then(() => __importStar(require('../lib/jwt')));
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
});
// OTP
router.post('/otp/request', [(0, express_validator_1.body)('email').isEmail(), (0, express_validator_1.body)('tenantId').optional().isString()], lib_1.validate, authController.requestLoginOTP);
router.post('/otp/verify', [
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('code').isLength({ min: 4, max: 8 }),
    (0, express_validator_1.body)('tenantId').optional().isString(),
], lib_1.validate, authController.verifyLoginOTP);
// MFA (2FA) - requires auth
router.get('/mfa/setup', middleware_1.authRequired, authController.setupMFA);
router.post('/mfa/verify', middleware_1.authRequired, [(0, express_validator_1.body)('token').isLength({ min: 6, max: 6 })], lib_1.validate, authController.verifyMFA);
// Password reset
router.post('/password/forgot', [(0, express_validator_1.body)('email').isEmail(), (0, express_validator_1.body)('tenantId').optional().isString()], lib_1.validate, authController.requestPasswordReset);
router.post('/password/reset', [
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('tenantId').optional().isString(),
    (0, express_validator_1.body)('code').isLength({ min: 4, max: 8 }),
    (0, express_validator_1.body)('newPassword').isLength({ min: 8 }),
], lib_1.validate, authController.resetPassword);
router.post('/password/change', middleware_1.authRequired, [(0, express_validator_1.body)('currentPassword').isLength({ min: 8 }), (0, express_validator_1.body)('newPassword').isLength({ min: 8 })], lib_1.validate, authController.changePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map