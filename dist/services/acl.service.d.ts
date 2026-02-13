export type CreateACLEntryInput = {
    tenantId: string;
    subjectType: 'user' | 'role';
    subjectId: string;
    resourceType: string;
    resourceId?: string;
    permission: string;
    conditions?: object;
};
export declare function listACLEntries(tenantId: string, filters?: {
    subjectType?: string;
    subjectId?: string;
    resourceType?: string;
    resourceId?: string;
}): Promise<{
    tenantId: string;
    permission: string;
    id: string;
    createdAt: Date;
    conditions: import("@prisma/client/runtime/library").JsonValue | null;
    subjectType: string;
    subjectId: string;
    resourceType: string;
    resourceId: string | null;
}[]>;
export declare function createACLEntry(data: CreateACLEntryInput): Promise<{
    tenantId: string;
    permission: string;
    id: string;
    createdAt: Date;
    conditions: import("@prisma/client/runtime/library").JsonValue | null;
    subjectType: string;
    subjectId: string;
    resourceType: string;
    resourceId: string | null;
}>;
export declare function deleteACLEntry(id: string, tenantId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
//# sourceMappingURL=acl.service.d.ts.map