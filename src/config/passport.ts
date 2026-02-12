import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { prisma } from '../lib/prisma';
import { verifyPassword } from '../lib/password';
import { config } from './index';

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.secret,
  issuer: config.jwt.issuer,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub, tenantId: payload.tenantId },
        include: { tenant: true, userRoles: { include: { role: true } } },
      });
      if (user && user.isActive) return done(null, user);
      return done(null, false);
    } catch (e) {
      return done(e, false);
    }
  })
);

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', passReqToCallback: true },
    async (req, email, password, done) => {
      const tenantId = (req.body?.tenantId || req.query?.tenantId) as string;
      if (!tenantId) return done(null, false, { message: 'Tenant required' });
      try {
        const user = await prisma.user.findFirst({
          where: { tenantId, email, passwordHash: { not: null } },
          include: { tenant: true, userRoles: { include: { role: true } } },
        });
        if (!user || !user.passwordHash) return done(null, false, { message: 'Invalid credentials' });
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return done(null, false, { message: 'Invalid credentials' });
        if (!user.isActive) return done(null, false, { message: 'Account disabled' });
        return done(null, user);
      } catch (e) {
        return done(e, false);
      }
    }
  )
);

if (config.google.clientId && config.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackURL,
        scope: ['profile', 'email'],
        passReqToCallback: true,
      },
      async (req, _accessToken, _refreshToken, profile, done) => {
        const tenantId = (req?.query?.state as string) || config.defaultTenantId;
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google'), undefined);

          let oauth = await prisma.oAuthAccount.findUnique({
            where: { provider_providerId: { provider: 'google', providerId: profile.id } },
            include: { user: { include: { tenant: true, userRoles: { include: { role: true } } } } },
          });

          if (oauth) {
            return done(null, oauth.user);
          }

          let user = await prisma.user.findFirst({
            where: { tenantId, email },
            include: { tenant: true, userRoles: { include: { role: true } } },
          });

          if (!user) {
            user = await prisma.user.create({
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
          } else {
            await prisma.oAuthAccount.create({
              data: { userId: user.id, provider: 'google', providerId: profile.id },
            });
          }

          return done(null, user);
        } catch (e) {
          return done(e, undefined);
        }
      }
    )
  );
}

if (config.facebook.appId && config.facebook.appSecret) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: config.facebook.appId,
        clientSecret: config.facebook.appSecret,
        callbackURL: config.facebook.callbackURL,
        profileFields: ['id', 'emails', 'name', 'picture'],
        passReqToCallback: true,
      },
      async (req, _accessToken, _refreshToken, profile, done) => {
        const tenantId = (req?.query?.state as string) || config.defaultTenantId;
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Facebook'), undefined);

          let oauth = await prisma.oAuthAccount.findUnique({
            where: { provider_providerId: { provider: 'facebook', providerId: profile.id } },
            include: { user: { include: { tenant: true, userRoles: { include: { role: true } } } } },
          });

          if (oauth) return done(null, oauth.user);

          let user = await prisma.user.findFirst({
            where: { tenantId, email },
            include: { tenant: true, userRoles: { include: { role: true } } },
          });

          if (!user) {
            user = await prisma.user.create({
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
          } else {
            await prisma.oAuthAccount.create({
              data: { userId: user.id, provider: 'facebook', providerId: profile.id },
            });
          }

          return done(null, user);
        } catch (e) {
          return done(e, undefined);
        }
      }
    )
  );
}

export default passport;
