export declare function listPermissions(moduleCode?: string): Promise<({
    module: {
        id: string;
        isActive: boolean;
        createdAt: Date;
        name: string;
        code: string;
        description: string | null;
    } | null;
} & {
    id: string;
    isActive: boolean;
    createdAt: Date;
    name: string;
    code: string;
    description: string | null;
    moduleId: string | null;
    resource: string | null;
    action: string | null;
})[]>;
export declare function getByCode(code: string): Promise<({
    module: {
        id: string;
        isActive: boolean;
        createdAt: Date;
        name: string;
        code: string;
        description: string | null;
    } | null;
} & {
    id: string;
    isActive: boolean;
    createdAt: Date;
    name: string;
    code: string;
    description: string | null;
    moduleId: string | null;
    resource: string | null;
    action: string | null;
}) | null>;
//# sourceMappingURL=permission.service.d.ts.map