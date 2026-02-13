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
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.me = me;
exports.setupMFA = setupMFA;
exports.verifyMFA = verifyMFA;
exports.requestLoginOTP = requestLoginOTP;
exports.verifyLoginOTP = verifyLoginOTP;
exports.requestPasswordReset = requestPasswordReset;
exports.resetPassword = resetPassword;
exports.changePassword = changePassword;
const authService = __importStar(require("../services/auth.service"));
const auth_service_1 = require("../services/auth.service");
const jwt_1 = require("../lib/jwt");
const config_1 = require("../config");
async function register(req, res) {
    const { tenantId, email, username, password, firstName, lastName } = req.body;
    const tenantIdResolved = tenantId || req.tenantId;
    if (!tenantIdResolved) {
        res.status(400).json({ success: false, message: 'Tenant is required' });
        return;
    }
    try {
        const user = await authService.register({
            tenantId: tenantIdResolved,
            email,
            username,
            password,
            firstName,
            lastName,
        });
        const session = await (0, auth_service_1.createSession)(user.id, user.tenantId, req.ip, req.get('User-Agent'));
        const accessToken = (0, jwt_1.signAccessToken)({
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            sessionId: session.id,
        });
        const refreshToken = (0, jwt_1.signRefreshToken)({
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            sessionId: session.id,
        });
        res.status(201).json({
            success: true,
            data: {
                user: authService.sanitizeUser(user),
                accessToken,
                refreshToken,
                expiresIn: config_1.config.jwt.accessExpiry,
                sessionId: session.id,
            },
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Registration failed' });
    }
}
async function login(req, res) {
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
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Login failed' });
    }
}
async function refresh(req, res) {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) {
        res.status(400).json({ success: false, message: 'Refresh token required' });
        return;
    }
    const result = await authService.refreshTokens(refreshToken);
    res.json({ success: true, data: result });
}
async function logout(req, res) {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    await authService.logout(refreshToken, req.sessionId);
    res.json({ success: true, message: 'Logged out' });
}
async function me(req, res) {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const user = req.user;
    res.json({
        success: true,
        data: { user: authService.sanitizeUser(user) },
    });
}
// ---------- OTP / 2FA ----------
async function setupMFA(req, res) {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const result = await authService.setupMFA(req.user.id);
    res.json({ success: true, data: result });
}
async function verifyMFA(req, res) {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const { token } = req.body;
    const valid = await authService.verifyMFA(req.user.id, token);
    if (!valid) {
        res.status(400).json({ success: false, message: 'Invalid OTP' });
        return;
    }
    res.json({ success: true, message: 'MFA enabled' });
}
async function requestLoginOTP(req, res) {
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
async function verifyLoginOTP(req, res) {
    const { email, code, tenantId } = req.body;
    const tid = tenantId || req.tenantId;
    if (!tid || !email || !code) {
        res.status(400).json({ success: false, message: 'Email, code and tenant required' });
        return;
    }
    const result = await authService.loginWithOTP(tid, email, code, req.ip, req.get('User-Agent'));
    res.json({ success: true, data: result });
}
// ---------- Password reset ----------
async function requestPasswordReset(req, res) {
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
async function resetPassword(req, res) {
    const { email, tenantId, code, newPassword } = req.body;
    const tid = tenantId || req.tenantId;
    if (!tid || !email || !code || !newPassword) {
        res.status(400).json({ success: false, message: 'Email, tenant, code and new password required' });
        return;
    }
    try {
        await authService.resetPasswordWithOTP(tid, email, code, newPassword);
        res.json({ success: true, message: 'Password reset successfully' });
    }
    catch (e) {
        res.status(400).json({ success: false, message: e.message || 'Invalid or expired OTP' });
    }
}
async function changePassword(req, res) {
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
        await authService.changePassword(req.user.id, currentPassword, newPassword);
        res.json({ success: true, message: 'Password changed successfully' });
    }
    catch (e) {
        res.status(400).json({ success: false, message: e.message || 'Unable to change password' });
    }
}
//# sourceMappingURL=auth.controller.js.map