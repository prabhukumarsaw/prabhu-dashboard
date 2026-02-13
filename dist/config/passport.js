"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_jwt_1 = require("passport-jwt");
const passport_local_1 = require("passport-local");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_facebook_1 = require("passport-facebook");
const prisma_1 = require("../lib/prisma");
const password_1 = require("../lib/password");
const index_1 = require("./index");
const jwtOptions = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: index_1.config.jwt.secret,
    issuer: index_1.config.jwt.issuer,
};
passport_1.default.use(new passport_jwt_1.Strategy(jwtOptions, async (payload, done) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.sub, tenantId: payload.tenantId },
            include: { tenant: true, userRoles: { include: { role: true } } },
        });
        if (user && user.isActive)
            return done(null, user);
        return done(null, false);
    }
    catch (e) {
        return done(e, false);
    }
}));
passport_1.default.use(new passport_local_1.Strategy({ usernameField: 'email', passwordField: 'password', passReqToCallback: true }, async (req, email, password, done) => {
    const tenantId = (req.body?.tenantId || req.query?.tenantId);
    if (!tenantId)
        return done(null, false, { message: 'Tenant required' });
    try {
        const user = await prisma_1.prisma.user.findFirst({
            where: { tenantId, email, passwordHash: { not: null } },
            include: { tenant: true, userRoles: { include: { role: true } } },
        });
        if (!user || !user.passwordHash)
            return done(null, false, { message: 'Invalid credentials' });
        const valid = await (0, password_1.verifyPassword)(password, user.passwordHash);
        if (!valid)
            return done(null, false, { message: 'Invalid credentials' });
        if (!user.isActive)
            return done(null, false, { message: 'Account disabled' });
        return done(null, user);
    }
    catch (e) {
        return done(e, false);
    }
}));
if (index_1.config.google.clientId && index_1.config.google.clientSecret) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: index_1.config.google.clientId,
        clientSecret: index_1.config.google.clientSecret,
        callbackURL: index_1.config.google.callbackURL,
        scope: ['profile', 'email'],
        passReqToCallback: true,
    }, async (req, _accessToken, _refreshToken, profile, done) => {
        const tenantId = req?.query?.state || index_1.config.defaultTenantId;
        try {
            const email = profile.emails?.[0]?.value;
            if (!email)
                return done(new Error('No email from Google'), undefined);
            let oauth = await prisma_1.prisma.oAuthAccount.findUnique({
                where: { provider_providerId: { provider: 'google', providerId: profile.id } },
                include: { user: { include: { tenant: true, userRoles: { include: { role: true } } } } },
            });
            if (oauth) {
                return done(null, oauth.user);
            }
            let user = await prisma_1.prisma.user.findFirst({
                where: { tenantId, email },
                include: { tenant: true, userRoles: { include: { role: true } } },
            });
            if (!user) {
                user = await prisma_1.prisma.user.create({
                    data: {
                        tenantId,
                        email,
                        firstName: profile.name?.givenName,
                        lastName: profile.name?.familyName,
                        avatar: profile.photos?.[0]?.value,
                        emailVerified: true,
                        oAuthAccounts: {
                            create: {
                                provider: 'google',
                                providerId: profile.id,
                            },
                        },
                    },
                    include: { tenant: true, userRoles: { include: { role: true } } },
                });
            }
            else {
                await prisma_1.prisma.oAuthAccount.create({
                    data: { userId: user.id, provider: 'google', providerId: profile.id },
                });
            }
            return done(null, user);
        }
        catch (e) {
            return done(e, undefined);
        }
    }));
}
if (index_1.config.facebook.appId && index_1.config.facebook.appSecret) {
    passport_1.default.use(new passport_facebook_1.Strategy({
        clientID: index_1.config.facebook.appId,
        clientSecret: index_1.config.facebook.appSecret,
        callbackURL: index_1.config.facebook.callbackURL,
        profileFields: ['id', 'emails', 'name', 'picture'],
        passReqToCallback: true,
    }, async (req, _accessToken, _refreshToken, profile, done) => {
        const tenantId = req?.query?.state || index_1.config.defaultTenantId;
        try {
            const email = profile.emails?.[0]?.value;
            if (!email)
                return done(new Error('No email from Facebook'), undefined);
            let oauth = await prisma_1.prisma.oAuthAccount.findUnique({
                where: { provider_providerId: { provider: 'facebook', providerId: profile.id } },
                include: { user: { include: { tenant: true, userRoles: { include: { role: true } } } } },
            });
            if (oauth)
                return done(null, oauth.user);
            let user = await prisma_1.prisma.user.findFirst({
                where: { tenantId, email },
                include: { tenant: true, userRoles: { include: { role: true } } },
            });
            if (!user) {
                user = await prisma_1.prisma.user.create({
                    data: {
                        tenantId,
                        email,
                        firstName: profile.name?.givenName,
                        lastName: profile.name?.familyName,
                        avatar: profile.photos?.[0]?.value,
                        emailVerified: true,
                        oAuthAccounts: {
                            create: {
                                provider: 'facebook',
                                providerId: profile.id,
                            },
                        },
                    },
                    include: { tenant: true, userRoles: { include: { role: true } } },
                });
            }
            else {
                await prisma_1.prisma.oAuthAccount.create({
                    data: { userId: user.id, provider: 'facebook', providerId: profile.id },
                });
            }
            return done(null, user);
        }
        catch (e) {
            return done(e, undefined);
        }
    }));
}
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map