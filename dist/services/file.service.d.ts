/**
 * File Storage Service - Local file storage with security and quotas
 * Supports: Upload, download, sharing, versioning, quotas
 */
export interface UploadFileInput {
    tenantId: string;
    userId?: string;
    file: Express.Multer.File;
    isPublic?: boolean;
    metadata?: Record<string, unknown>;
}
export interface CreateFileShareInput {
    fileId: string;
    password?: string;
    expiresAt?: Date;
    maxDownloads?: number;
}
export interface FileQuota {
    maxSize: number;
    maxFiles: number;
    allowedTypes?: string[];
}
/**
 * Upload a file
 */
export declare function uploadFile(input: UploadFileInput): Promise<{
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
}>;
/**
 * Get file by ID
 */
export declare function getFileById(fileId: string, tenantId: string, userId?: string): Promise<{
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
}>;
/**
 * List files
 */
export declare function listFiles(tenantId: string, options?: {
    userId?: string;
    mimeType?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<{
    files: ({
        user: {
            email: string;
            id: string;
            firstName: string | null;
            lastName: string | null;
        } | null;
    } & {
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
    })[];
    total: number;
    page: number;
    limit: number;
}>;
/**
 * Delete file
 */
export declare function deleteFile(fileId: string, tenantId: string, userId?: string): Promise<{
    success: boolean;
}>;
/**
 * Get file content (for download)
 */
export declare function getFileContent(fileId: string, tenantId: string, userId?: string): Promise<Buffer>;
/**
 * Create a shareable link for a file
 */
export declare function createFileShare(input: CreateFileShareInput): Promise<{
    shareUrl: string;
    id: string;
    passwordHash: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date | null;
    fileId: string;
    maxDownloads: number | null;
    shareToken: string;
    downloadCount: number;
}>;
/**
 * Get file by share token
 */
export declare function getFileByShareToken(shareToken: string, password?: string): Promise<{
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
}>;
/**
 * Revoke file share
 */
export declare function revokeFileShare(shareToken: string, fileId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
/**
 * List file shares
 */
export declare function listFileShares(fileId: string): Promise<{
    id: string;
    passwordHash: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date | null;
    fileId: string;
    maxDownloads: number | null;
    shareToken: string;
    downloadCount: number;
}[]>;
/**
 * Get tenant storage usage
 */
export declare function getTenantStorageUsage(tenantId: string): Promise<{
    used: number;
    files: number;
    quota: number;
    maxFiles: number;
    percentage: number;
}>;
/**
 * Clean up expired file shares
 */
export declare function cleanupExpiredShares(): Promise<number>;
/**
 * Get file statistics
 */
export declare function getFileStats(tenantId: string, userId?: string): Promise<{
    total: number;
    totalSize: number;
    byType: Record<string, {
        count: number;
        size: number;
    }>;
}>;
//# sourceMappingURL=file.service.d.ts.map