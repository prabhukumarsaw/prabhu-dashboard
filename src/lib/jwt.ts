import jwt from 'jsonwebtoken';
import { config } from '../config';

export type TokenPayload = {
  sub: string;
  email: string;
  tenantId: string;
  sessionId?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
  iss?: string;
};

export function signAccessToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp' | 'iss'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiry, issuer: config.jwt.issuer }
  );
}

export function signRefreshToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp' | 'iss'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiry, issuer: config.jwt.issuer }
  );
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, config.jwt.secret, {
    issuer: config.jwt.issuer,
  }) as TokenPayload;
  return decoded;
}
