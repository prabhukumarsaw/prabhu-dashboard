/**
 * Export/Import Service - Data portability and bulk operations
 * Supports: CSV, JSON, XLSX formats
 */
export type ExportFormat = 'csv' | 'json' | 'xlsx';
export type ImportFormat = 'csv' | 'json' | 'xlsx';
export type ResourceType = 'user' | 'role' | 'permission' | 'menu';
export interface ExportOptions {
    tenantId: string;
    userId: string;
    resourceType: ResourceType;
    format: ExportFormat;
    filters?: Record<string, unknown>;
    fields?: string[];
}
export interface ImportOptions {
    tenantId: string;
    userId: string;
    resourceType: ResourceType;
    format: ImportFormat;
    fileId: string;
    options?: {
        skipErrors?: boolean;
        updateExisting?: boolean;
        validateOnly?: boolean;
    };
}
/**
 * Export resources to file
 */
export declare function exportResources(options: ExportOptions): Promise<{
    jobId: string;
    fileId: string;
    fileName: string;
    downloadUrl: string;
}>;
/**
 * Import resources from file
 */
export declare function importResources(options: ImportOptions): Promise<{
    jobId: string;
    total: number;
    success: number;
    errors: {
        row: number;
        error: string;
    }[];
}>;
/**
 * Get export job status
 */
export declare function getExportJob(jobId: string, userId: string): Promise<{
    tenantId: string;
    format: string;
    error: string | null;
    id: string;
    createdAt: Date;
    userId: string;
    resourceType: string;
    fileId: string | null;
    filters: import("@prisma/client/runtime/library").JsonValue | null;
    status: string;
    completedAt: Date | null;
} | null>;
/**
 * Get import job status
 */
export declare function getImportJob(jobId: string, userId: string): Promise<{
    tenantId: string;
    format: string;
    id: string;
    createdAt: Date;
    userId: string;
    resourceType: string;
    fileId: string;
    status: string;
    completedAt: Date | null;
    totalRows: number | null;
    processedRows: number;
    successRows: number;
    errorRows: number;
    errors: import("@prisma/client/runtime/library").JsonValue | null;
} | null>;
/**
 * List export/import jobs
 */
export declare function listJobs(tenantId: string, userId: string, type: 'export' | 'import'): Promise<{
    tenantId: string;
    format: string;
    error: string | null;
    id: string;
    createdAt: Date;
    userId: string;
    resourceType: string;
    fileId: string | null;
    filters: import("@prisma/client/runtime/library").JsonValue | null;
    status: string;
    completedAt: Date | null;
}[] | {
    tenantId: string;
    format: string;
    id: string;
    createdAt: Date;
    userId: string;
    resourceType: string;
    fileId: string;
    status: string;
    completedAt: Date | null;
    totalRows: number | null;
    processedRows: number;
    successRows: number;
    errorRows: number;
    errors: import("@prisma/client/runtime/library").JsonValue | null;
}[]>;
//# sourceMappingURL=export-import.service.d.ts.map