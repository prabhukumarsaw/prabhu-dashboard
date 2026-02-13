export type CreateUserInput = {
    tenantId: string;
    email: string;
    username?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    roleIds?: string[];
};
export type UpdateUserInput = Partial<{
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    locale: string;
    timezone: string;
    isActive: boolean;
    roleIds: string[];
}>;
export declare function createUser(data: CreateUserInput): Promise<{
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
export declare function updateUser(userId: string, tenantId: string, data: UpdateUserInput): Promise<({
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
}) | null>;
export declare function listUsers(tenantId: string, page?: number, limit?: number, search?: string): Promise<{
    users: ({
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
    })[];
    total: number;
    page: number;
    limit: number;
}>;
export declare function getUserById(userId: string, tenantId: string): Promise<({
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
}) | null>;
export declare function deleteUser(userId: string, tenantId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
//# sourceMappingURL=user.service.d.ts.map