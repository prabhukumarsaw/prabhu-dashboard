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
export declare function listUserSessions(userId: string, tenantId: string): Promise<{
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
}[]>;
export declare function revokeSession(sessionId: string, userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
export declare function revokeAllSessions(userId: string, tenantId: string, exceptSessionId?: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
//# sourceMappingURL=session.service.d.ts.map