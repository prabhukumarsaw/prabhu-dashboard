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
  const tokenPayload = { ...payload, type: 'access' as const };
  const secret = String(config.jwt.secret);
  const expiresIn = String(config.jwt.accessExpiry);
  const issuer = String(config.jwt.issuer);
  return jwt.sign(tokenPayload, secret, { expiresIn, issuer } as jwt.SignOptions);
}

export function signRefreshToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp' | 'iss'>): string {
  const tokenPayload = { ...payload, type: 'refresh' as const };
  const secret = String(config.jwt.secret);
  const expiresIn = String(config.jwt.refreshExpiry);
  const issuer = String(config.jwt.issuer);
  return jwt.sign(tokenPayload, secret, { expiresIn, issuer } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, String(config.jwt.secret), {
    issuer: String(config.jwt.issuer),
  }) as TokenPayload;
  return decoded;
}
