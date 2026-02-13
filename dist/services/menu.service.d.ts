export declare function listMenusForTenant(tenantId: string): Promise<({
    parent: {
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
    } | null;
    children: {
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
} & {
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
})[]>;
export declare function listMenusForUser(userId: string, tenantId: string): Promise<{
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
}[]>;
export declare function getMenuById(menuId: string, tenantId: string): Promise<({
    parent: {
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
    } | null;
    children: {
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
} & {
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
}) | null>;
export declare function createMenu(tenantId: string, data: {
    title: string;
    path?: string;
    icon?: string;
    parentId?: string;
    moduleId?: string;
    order?: number;
    permissionCode?: string;
}): Promise<{
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
}>;
export declare function updateMenu(menuId: string, tenantId: string, data: Partial<{
    title: string;
    path: string;
    icon: string;
    parentId: string;
    order: number;
    permissionCode: string;
    isActive: boolean;
}>): Promise<{
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
}>;
export declare function deleteMenu(menuId: string, tenantId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
//# sourceMappingURL=menu.service.d.ts.map