/**
 * Advanced Search Service - Full-text search and filtering
 * Supports: PostgreSQL full-text search, advanced filters, saved searches
 */
export type ResourceType = 'user' | 'role' | 'permission' | 'file' | 'menu' | 'policy' | 'tenant';
export interface SearchFilter {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'contains' | 'startsWith' | 'endsWith' | 'between';
    value: unknown;
}
export interface SearchOptions {
    tenantId: string;
    resourceType: ResourceType;
    query?: string;
    filters?: SearchFilter[];
    dateRange?: {
        field: string;
        start: Date;
        end: Date;
    };
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
export interface SavedSearchInput {
    tenantId: string;
    userId: string;
    name: string;
    resourceType: ResourceType;
    query: Record<string, unknown>;
    isPublic?: boolean;
}
/**
 * Perform advanced search across resources
 */
export declare function searchResources(options: SearchOptions): Promise<{
    items: ({
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
} | {
    items: ({
        rolePermissions: ({
            permission: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                name: string;
                code: string;
                description: string | null;
                moduleId: string | null;
                resource: string | null;
                action: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            roleId: string;
            permissionId: string;
            conditions: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    } & {
        tenantId: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        description: string | null;
        isSystem: boolean;
    })[];
    total: number;
    page: number;
    limit: number;
} | {
    items: {
        id: string;
        isActive: boolean;
        createdAt: Date;
        name: string;
        code: string;
        description: string | null;
        moduleId: string | null;
        resource: string | null;
        action: string | null;
    }[];
    total: number;
    page: number;
    limit: number;
} | {
    items: {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        userId: string | null;
        path: string;
        url: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isPublic: boolean;
        originalName: string;
        mimeType: string;
        size: number;
        storageType: string;
    }[];
    total: number;
    page: number;
    limit: number;
} | {
    items: {
        tenantId: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        moduleId: string | null;
        permissionCode: string | null;
        path: string | null;
        parentId: string | null;
        title: string;
        icon: string | null;
        order: number;
    }[];
    total: number;
    page: number;
    limit: number;
} | {
    items: ({
        rules: {
            id: string;
            createdAt: Date;
            attributeId: string | null;
            value: import("@prisma/client/runtime/library").JsonValue;
            policyId: string;
            operator: string;
        }[];
    } & {
        tenantId: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        description: string | null;
        effect: string;
        priority: number;
    })[];
    total: number;
    page: number;
    limit: number;
} | {
    items: {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        domain: string | null;
        logo: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    }[];
    total: number;
    page: number;
    limit: number;
}>;
/**
 * Global search across all resource types
 */
export declare function globalSearch(tenantId: string, query: string, resourceTypes?: ResourceType[], limit?: number): Promise<{
    results: {
        type: ResourceType;
        items: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
            domain: string | null;
            logo: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
        }[] | {
            tenantId: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            moduleId: string | null;
            permissionCode: string | null;
            path: string | null;
            parentId: string | null;
            title: string;
            icon: string | null;
            order: number;
        }[] | ({
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
        })[] | ({
            rolePermissions: ({
                permission: {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    name: string;
                    code: string;
                    description: string | null;
                    moduleId: string | null;
                    resource: string | null;
                    action: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                roleId: string;
                permissionId: string;
                conditions: import("@prisma/client/runtime/library").JsonValue | null;
            })[];
        } & {
            tenantId: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            description: string | null;
            isSystem: boolean;
        })[] | {
            id: string;
            isActive: boolean;
            createdAt: Date;
            name: string;
            code: string;
            description: string | null;
            moduleId: string | null;
            resource: string | null;
            action: string | null;
        }[] | {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            userId: string | null;
            path: string;
            url: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            isPublic: boolean;
            originalName: string;
            mimeType: string;
            size: number;
            storageType: string;
        }[] | ({
            rules: {
                id: string;
                createdAt: Date;
                attributeId: string | null;
                value: import("@prisma/client/runtime/library").JsonValue;
                policyId: string;
                operator: string;
            }[];
        } & {
            tenantId: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            description: string | null;
            effect: string;
            priority: number;
        })[];
        total: number;
    }[];
    total: number;
}>;
/**
 * Save a search
 */
export declare function saveSearch(input: SavedSearchInput): Promise<{
    tenantId: string;
    query: import("@prisma/client/runtime/library").JsonValue;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    userId: string;
    resourceType: string;
    isPublic: boolean;
}>;
/**
 * Get saved searches
 */
export declare function getSavedSearches(tenantId: string, userId?: string, resourceType?: ResourceType): Promise<({
    user: {
        email: string;
        id: string;
        firstName: string | null;
        lastName: string | null;
    };
} & {
    tenantId: string;
    query: import("@prisma/client/runtime/library").JsonValue;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    userId: string;
    resourceType: string;
    isPublic: boolean;
})[]>;
/**
 * Delete saved search
 */
export declare function deleteSavedSearch(searchId: string, userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
/**
 * Get search suggestions (popular searches)
 */
export declare function getSearchSuggestions(tenantId: string, resourceType: ResourceType, query: string, limit?: number): Promise<{
    id: any;
    text: any;
}[]>;
//# sourceMappingURL=search.service.d.ts.map