export type AccessContext = {
    userId: string;
    tenantId: string;
    roleIds: string[];
    attributes: Record<string, unknown>;
    resourceType?: string;
    resourceId?: string;
    action?: string;
};
export declare function checkRBAC(userId: string, tenantId: string, permissionCode: string): Promise<boolean>;
export declare function getUserAttributes(userId: string): Promise<Record<string, unknown>>;
export declare function evaluateABACCondition(userAttrs: Record<string, unknown>, attributeName: string, operator: string, expectedValue: unknown): boolean;
export declare function checkPBAC(ctx: AccessContext): Promise<'ALLOW' | 'DENY' | null>;
export declare function checkACL(subjectType: 'user' | 'role', subjectId: string, tenantId: string, resourceType: string, resourceId: string | null, permission: string): Promise<boolean>;
export declare function canAccess(ctx: AccessContext & {
    permissionCode?: string;
}): Promise<boolean>;
//# sourceMappingURL=iam.service.d.ts.map