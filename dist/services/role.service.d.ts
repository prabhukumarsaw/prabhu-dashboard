export declare function listRoles(tenantId: string): Promise<({
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
    roleMenus: ({
        menu: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        roleId: string;
        menuId: string;
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
})[]>;
export declare function getRoleById(roleId: string, tenantId: string): Promise<({
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
    roleMenus: ({
        menu: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        roleId: string;
        menuId: string;
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
}) | null>;
export declare function createRole(tenantId: string, data: {
    name: string;
    code: string;
    description?: string;
    permissionIds?: string[];
    menuIds?: string[];
}): Promise<{
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
    roleMenus: ({
        menu: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        roleId: string;
        menuId: string;
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
}>;
export declare function updateRole(roleId: string, tenantId: string, data: Partial<{
    name: string;
    code: string;
    description: string;
    isActive: boolean;
    permissionIds: string[];
    menuIds: string[];
}>): Promise<{
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
    roleMenus: ({
        menu: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        roleId: string;
        menuId: string;
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
}>;
export declare function deleteRole(roleId: string, tenantId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
//# sourceMappingURL=role.service.d.ts.map