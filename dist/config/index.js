"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5177', 10),
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    jwt: {
        secret: process.env.JWT_SECRET || 'change-me-in-production',
        accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
        issuer: process.env.JWT_ISSUER || 'iam-saas',
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
    },
    facebook: {
        appId: process.env.FACEBOOK_APP_ID || '',
        appSecret: process.env.FACEBOOK_APP_SECRET || '',
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || '',
    },
    otp: {
        issuer: process.env.OTP_ISSUER || 'IAM-SaaS',
        window: parseInt(process.env.OTP_WINDOW || '1', 10),
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
    defaultTenantId: process.env.DEFAULT_TENANT_ID || 'default',
};
//# sourceMappingURL=index.js.map