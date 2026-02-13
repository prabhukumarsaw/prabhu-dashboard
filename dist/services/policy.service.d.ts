export declare function listPolicies(tenantId: string): Promise<({
    rules: ({
        attribute: {
            type: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            name: string;
            description: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        attributeId: string | null;
        value: import("@prisma/client/runtime/library").JsonValue;
        policyId: string;
        operator: string;
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
    effect: string;
    priority: number;
})[]>;
export declare function getPolicyById(policyId: string, tenantId: string): Promise<({
    rules: ({
        attribute: {
            type: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            name: string;
            description: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        attributeId: string | null;
        value: import("@prisma/client/runtime/library").JsonValue;
        policyId: string;
        operator: string;
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
    effect: string;
    priority: number;
}) | null>;
export declare function createPolicy(tenantId: string, data: {
    name: string;
    code: string;
    description?: string;
    effect: 'ALLOW' | 'DENY';
    priority?: number;
    rules?: {
        attributeId: string;
        operator: string;
        value: object;
    }[];
}): Promise<{
    rules: ({
        attribute: {
            type: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            name: string;
            description: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        attributeId: string | null;
        value: import("@prisma/client/runtime/library").JsonValue;
        policyId: string;
        operator: string;
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
    effect: string;
    priority: number;
}>;
export declare function updatePolicy(policyId: string, tenantId: string, data: Partial<{
    name: string;
    code: string;
    description: string;
    effect: string;
    priority: number;
    isActive: boolean;
}>): Promise<{
    rules: ({
        attribute: {
            type: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            name: string;
            description: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        attributeId: string | null;
        value: import("@prisma/client/runtime/library").JsonValue;
        policyId: string;
        operator: string;
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
    effect: string;
    priority: number;
}>;
export declare function deletePolicy(policyId: string, tenantId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
//# sourceMappingURL=policy.service.d.ts.map