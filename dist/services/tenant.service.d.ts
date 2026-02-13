import { Prisma } from '@prisma/client';
export declare function listTenants(page?: number, limit?: number, search?: string): Promise<{
    tenants: {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        domain: string | null;
        logo: string | null;
        settings: Prisma.JsonValue | null;
    }[];
    total: number;
    page: number;
    limit: number;
}>;
export declare function getTenantById(id: string): Promise<({
    modules: ({
        module: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            name: string;
            code: string;
            description: string | null;
        };
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        moduleId: string;
        isEnabled: boolean;
        config: Prisma.JsonValue | null;
    })[];
} & {
    id: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    slug: string;
    domain: string | null;
    logo: string | null;
    settings: Prisma.JsonValue | null;
}) | null>;
export declare function getTenantBySlug(slug: string): Promise<{
    id: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    slug: string;
    domain: string | null;
    logo: string | null;
    settings: Prisma.JsonValue | null;
} | null>;
export declare function createTenant(data: {
    name: string;
    slug: string;
    domain?: string;
    logo?: string;
    settings?: object;
}): Promise<{
    id: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    slug: string;
    domain: string | null;
    logo: string | null;
    settings: Prisma.JsonValue | null;
}>;
export declare function updateTenant(id: string, data: Partial<{
    name: string;
    slug: string;
    domain: string;
    logo: string;
    settings: object;
    isActive: boolean;
}>): Promise<{
    id: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    slug: string;
    domain: string | null;
    logo: string | null;
    settings: Prisma.JsonValue | null;
}>;
export declare function enableModule(tenantId: string, moduleId: string, config?: object): Promise<{
    tenantId: string;
    id: string;
    createdAt: Date;
    moduleId: string;
    isEnabled: boolean;
    config: Prisma.JsonValue | null;
}>;
export declare function disableModule(tenantId: string, moduleId: string): Promise<Prisma.BatchPayload>;
//# sourceMappingURL=tenant.service.d.ts.map