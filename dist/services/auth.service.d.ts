export type LoginInput = {
    tenantId: string;
    email?: string;
    username?: string;
    password: string;
    ip?: string;
    userAgent?: string;
};
export type RegisterInput = {
    tenantId: string;
    email: string;
    username?: string;
    password: string;
    firstName?: string;
    lastName?: string;
};
export declare function register(data: RegisterInput): Promise<{
    tenant: {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        domain: string | null;
        logo: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    };
    userRoles: ({
        role: {
            tenantId: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            description: string | null;
            isSystem: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        roleId: string;
        scope: import("@prisma/client/runtime/library").JsonValue | null;
        expiresAt: Date | null;
    })[];
} & {
    email: string;
    tenantId: string;
    id: string;
    username: string | null;
    passwordHash: string | null;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    phone: string | null;
    locale: string | null;
    timezone: string | null;
    isActive: boolean;
    emailVerified: boolean;
    mfaEnabled: boolean;
    mfaSecret: string | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function login(input: LoginInput): Promise<{
    user: {
        [k: string]: unknown;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
    sessionId: string;
}>;
export declare function createSession(userId: string, tenantId: string, ip?: string, userAgent?: string): Promise<{
    tenantId: string;
    id: string;
    createdAt: Date;
    userId: string;
    expiresAt: Date;
    tokenHash: string | null;
    ip: string | null;
    userAgent: string | null;
    deviceInfo: import("@prisma/client/runtime/library").JsonValue | null;
    revokedAt: Date | null;
}>;
export declare function refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}>;
export declare function logout(refreshToken?: string, sessionId?: string): Promise<{
    success: boolean;
}>;
export declare function generateOTP(): string;
export declare function setupMFA(userId: string): Promise<{
    secret: string;
    qrDataUrl: string;
}>;
export declare function verifyMFA(userId: string, token: string): Promise<boolean>;
export declare function createOTPCode(userId: string, type: string): Promise<string>;
export declare function verifyOTPCode(userId: string, code: string, type: string): Promise<boolean>;
export declare function requestLoginOTP(tenantId: string, email: string): Promise<{
    userId: string;
} | null>;
export declare function loginWithOTP(tenantId: string, email: string, code: string, ip?: string, userAgent?: string): Promise<{
    user: {
        [k: string]: unknown;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
    sessionId: string;
}>;
export declare function requestPasswordReset(tenantId: string, email: string): Promise<void>;
export declare function resetPasswordWithOTP(tenantId: string, email: string, code: string, newPassword: string): Promise<void>;
export declare function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
export declare function sanitizeUser(user: {
    passwordHash?: string | null;
    mfaSecret?: string | null;
    [k: string]: unknown;
}): {
    [k: string]: unknown;
};
//# sourceMappingURL=auth.service.d.ts.map