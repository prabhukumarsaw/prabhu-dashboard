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
export declare function signAccessToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp' | 'iss'>): string;
export declare function signRefreshToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp' | 'iss'>): string;
export declare function verifyToken(token: string): TokenPayload;
//# sourceMappingURL=jwt.d.ts.map