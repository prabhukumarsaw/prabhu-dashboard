"use strict";
/**
 * File Storage Service - Local file storage with security and quotas
 * Supports: Upload, download, sharing, versioning, quotas
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = uploadFile;
exports.getFileById = getFileById;
exports.listFiles = listFiles;
exports.deleteFile = deleteFile;
exports.getFileContent = getFileContent;
exports.createFileShare = createFileShare;
exports.getFileByShareToken = getFileByShareToken;
exports.revokeFileShare = revokeFileShare;
exports.listFileShares = listFileShares;
exports.getTenantStorageUsage = getTenantStorageUsage;
exports.cleanupExpiredShares = cleanupExpiredShares;
exports.getFileStats = getFileStats;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../lib/logger");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
// ============== Configuration ==============
const UPLOAD_DIR = process.env.UPLOAD_DIR || path_1.default.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '104857600', 10); // 100MB default
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'application/zip',
];
// ============== Initialization ==============
async function ensureUploadDirectory() {
    try {
        await promises_1.default.access(UPLOAD_DIR);
    }
    catch {
        await promises_1.default.mkdir(UPLOAD_DIR, { recursive: true });
        logger_1.logger.info(`Created upload directory: ${UPLOAD_DIR}`);
    }
}
// Initialize on module load
ensureUploadDirectory().catch((err) => {
    logger_1.logger.error('Failed to create upload directory', err);
});
// ============== Core File Functions ==============
/**
 * Upload a file
 */
async function uploadFile(input) {
    const { tenantId, userId, file, isPublic = false, metadata } = input;
    // Validate file
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new Error(`File type ${file.mimetype} is not allowed`);
    }
    // Check tenant quota
    await checkTenantQuota(tenantId, file.size);
    // Generate unique filename
    const fileId = (0, uuid_1.v4)();
    const fileExtension = path_1.default.extname(file.originalname);
    const fileName = `${fileId}${fileExtension}`;
    const tenantDir = path_1.default.join(UPLOAD_DIR, tenantId);
    const filePath = path_1.default.join(tenantDir, fileName);
    // Ensure tenant directory exists
    await promises_1.default.mkdir(tenantDir, { recursive: true });
    // Save file
    await promises_1.default.writeFile(filePath, file.buffer);
    // Generate public URL
    const publicUrl = isPublic
        ? `/api/v1/files/public/${fileId}`
        : `/api/v1/files/${fileId}`;
    // Save to database
    const fileRecord = await prisma_1.prisma.file.create({
        data: {
            id: fileId,
            tenantId,
            userId,
            name: fileName,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: filePath,
            url: publicUrl,
            storageType: 'local',
            isPublic,
            metadata: (metadata || {}),
        },
    });
    logger_1.logger.info('File uploaded', { fileId, tenantId, size: file.size });
    return fileRecord;
}
/**
 * Get file by ID
 */
async function getFileById(fileId, tenantId, userId) {
    const file = await prisma_1.prisma.file.findFirst({
        where: {
            id: fileId,
            tenantId,
            OR: [
                { isPublic: true },
                { userId },
            ],
        },
    });
    if (!file) {
        throw new Error('File not found');
    }
    return file;
}
/**
 * List files
 */
async function listFiles(tenantId, options) {
    const { userId, mimeType, search, page = 1, limit = 50 } = options || {};
    const where = { tenantId };
    if (userId)
        where.userId = userId;
    if (mimeType)
        where.mimeType = mimeType;
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { originalName: { contains: search, mode: 'insensitive' } },
        ];
    }
    const [files, total] = await Promise.all([
        prisma_1.prisma.file.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        }),
        prisma_1.prisma.file.count({ where }),
    ]);
    return {
        files,
        total,
        page,
        limit,
    };
}
/**
 * Delete file
 */
async function deleteFile(fileId, tenantId, userId) {
    const file = await prisma_1.prisma.file.findFirst({
        where: {
            id: fileId,
            tenantId,
            OR: userId ? [{ userId }, { isPublic: true }] : [{ tenantId }],
        },
    });
    if (!file) {
        throw new Error('File not found');
    }
    // Delete physical file
    try {
        await promises_1.default.unlink(file.path);
    }
    catch (err) {
        logger_1.logger.warn('Failed to delete physical file', { fileId, error: err });
    }
    // Delete from database (cascade will delete shares)
    await prisma_1.prisma.file.delete({
        where: { id: fileId },
    });
    logger_1.logger.info('File deleted', { fileId, tenantId });
    return { success: true };
}
/**
 * Get file content (for download)
 */
async function getFileContent(fileId, tenantId, userId) {
    const file = await getFileById(fileId, tenantId, userId);
    try {
        const content = await promises_1.default.readFile(file.path);
        return content;
    }
    catch (err) {
        logger_1.logger.error('Failed to read file', { fileId, error: err });
        throw new Error('Failed to read file');
    }
}
// ============== File Sharing ==============
/**
 * Create a shareable link for a file
 */
async function createFileShare(input) {
    const { fileId, password, expiresAt, maxDownloads } = input;
    const file = await prisma_1.prisma.file.findUnique({
        where: { id: fileId },
    });
    if (!file) {
        throw new Error('File not found');
    }
    const shareToken = crypto_1.default.randomBytes(32).toString('hex');
    const passwordHash = password ? crypto_1.default.createHash('sha256').update(password).digest('hex') : null;
    const share = await prisma_1.prisma.fileShare.create({
        data: {
            fileId,
            shareToken,
            passwordHash,
            expiresAt,
            maxDownloads,
        },
    });
    return {
        ...share,
        shareUrl: `/api/v1/files/share/${shareToken}`,
    };
}
/**
 * Get file by share token
 */
async function getFileByShareToken(shareToken, password) {
    const share = await prisma_1.prisma.fileShare.findUnique({
        where: { shareToken },
        include: { file: true },
    });
    if (!share || !share.isActive) {
        throw new Error('Share link not found or inactive');
    }
    if (share.expiresAt && new Date() > share.expiresAt) {
        throw new Error('Share link has expired');
    }
    if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
        throw new Error('Maximum downloads reached');
    }
    if (share.passwordHash) {
        if (!password) {
            throw new Error('Password required');
        }
        const passwordHash = crypto_1.default.createHash('sha256').update(password).digest('hex');
        if (passwordHash !== share.passwordHash) {
            throw new Error('Invalid password');
        }
    }
    // Increment download count
    await prisma_1.prisma.fileShare.update({
        where: { id: share.id },
        data: { downloadCount: { increment: 1 } },
    });
    return share.file;
}
/**
 * Revoke file share
 */
async function revokeFileShare(shareToken, fileId) {
    return prisma_1.prisma.fileShare.updateMany({
        where: {
            shareToken,
            fileId,
        },
        data: {
            isActive: false,
        },
    });
}
/**
 * List file shares
 */
async function listFileShares(fileId) {
    return prisma_1.prisma.fileShare.findMany({
        where: { fileId },
        orderBy: { createdAt: 'desc' },
    });
}
// ============== Quota Management ==============
/**
 * Check tenant quota
 */
async function checkTenantQuota(tenantId, additionalSize) {
    // Get tenant storage usage
    const storageUsage = await prisma_1.prisma.file.aggregate({
        where: { tenantId },
        _sum: { size: true },
        _count: { id: true },
    });
    const currentSize = storageUsage._sum.size || 0;
    const currentFiles = storageUsage._count.id || 0;
    // Get tenant quota (from tenant settings or default)
    const tenant = await prisma_1.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true },
    });
    const quota = tenant?.settings
        ? tenant.settings.fileQuota || getDefaultQuota()
        : getDefaultQuota();
    if (currentSize + additionalSize > quota.maxSize) {
        throw new Error(`Storage quota exceeded. Current: ${currentSize / 1024 / 1024}MB, Max: ${quota.maxSize / 1024 / 1024}MB`);
    }
    if (currentFiles >= quota.maxFiles) {
        throw new Error(`File count quota exceeded. Current: ${currentFiles}, Max: ${quota.maxFiles}`);
    }
    if (quota.allowedTypes && quota.allowedTypes.length > 0) {
        // Check will be done at upload time
    }
}
function getDefaultQuota() {
    return {
        maxSize: parseInt(process.env.DEFAULT_STORAGE_QUOTA || '1073741824', 10), // 1GB default
        maxFiles: parseInt(process.env.DEFAULT_FILE_QUOTA || '1000', 10),
    };
}
/**
 * Get tenant storage usage
 */
async function getTenantStorageUsage(tenantId) {
    const usage = await prisma_1.prisma.file.aggregate({
        where: { tenantId },
        _sum: { size: true },
        _count: { id: true },
    });
    const tenant = await prisma_1.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true },
    });
    const quota = tenant?.settings
        ? tenant.settings.fileQuota || getDefaultQuota()
        : getDefaultQuota();
    return {
        used: usage._sum.size || 0,
        files: usage._count.id || 0,
        quota: quota.maxSize,
        maxFiles: quota.maxFiles,
        percentage: ((usage._sum.size || 0) / quota.maxSize) * 100,
    };
}
// ============== Utility Functions ==============
/**
 * Clean up expired file shares
 */
async function cleanupExpiredShares() {
    const result = await prisma_1.prisma.fileShare.updateMany({
        where: {
            expiresAt: {
                lte: new Date(),
            },
            isActive: true,
        },
        data: {
            isActive: false,
        },
    });
    return result.count;
}
/**
 * Get file statistics
 */
async function getFileStats(tenantId, userId) {
    const where = { tenantId };
    if (userId)
        where.userId = userId;
    const [total, totalSize, byType] = await Promise.all([
        prisma_1.prisma.file.count({ where }),
        prisma_1.prisma.file.aggregate({
            where,
            _sum: { size: true },
        }),
        prisma_1.prisma.file.groupBy({
            by: ['mimeType'],
            where,
            _count: true,
            _sum: { size: true },
        }),
    ]);
    return {
        total,
        totalSize: totalSize._sum.size || 0,
        byType: byType.reduce((acc, item) => {
            acc[item.mimeType] = {
                count: item._count,
                size: item._sum.size || 0,
            };
            return acc;
        }, {}),
    };
}
//# sourceMappingURL=file.service.js.map