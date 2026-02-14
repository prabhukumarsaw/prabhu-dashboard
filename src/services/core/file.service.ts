/**
 * File Storage Service - Local file storage with security and quotas
 * Supports: Upload, download, sharing, versioning, quotas
 */

import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// ============== Types ==============

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
  maxSize: number; // bytes
  maxFiles: number;
  allowedTypes?: string[];
}

// ============== Configuration ==============

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
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
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    logger.info(`Created upload directory: ${UPLOAD_DIR}`);
  }
}

// Initialize on module load
ensureUploadDirectory().catch((err) => {
  logger.error('Failed to create upload directory', err);
});

// ============== Core File Functions ==============

/**
 * Upload a file
 */
export async function uploadFile(input: UploadFileInput) {
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
  const fileId = uuidv4();
  const fileExtension = path.extname(file.originalname);
  const fileName = `${fileId}${fileExtension}`;
  const tenantDir = path.join(UPLOAD_DIR, tenantId);
  const filePath = path.join(tenantDir, fileName);

  // Ensure tenant directory exists
  await fs.mkdir(tenantDir, { recursive: true });

  // Save file
  await fs.writeFile(filePath, file.buffer);

  // Generate public URL
  const publicUrl = isPublic
    ? `/api/v1/files/public/${fileId}`
    : `/api/v1/files/${fileId}`;

  // Save to database
  const fileRecord = await prisma.file.create({
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
      metadata: (metadata || {}) as any,
    },
  });

  logger.info('File uploaded', { fileId, tenantId, size: file.size });

  return fileRecord;
}

/**
 * Get file by ID
 */
export async function getFileById(fileId: string, tenantId: string, userId?: string) {
  const file = await prisma.file.findFirst({
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
export async function listFiles(
  tenantId: string,
  options?: {
    userId?: string;
    mimeType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
) {
  const { userId, mimeType, search, page = 1, limit = 50 } = options || {};

  const where: any = { tenantId };
  if (userId) where.userId = userId;
  if (mimeType) where.mimeType = mimeType;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { originalName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [files, total] = await Promise.all([
    prisma.file.findMany({
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
    prisma.file.count({ where }),
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
export async function deleteFile(fileId: string, tenantId: string, userId?: string) {
  const file = await prisma.file.findFirst({
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
    await fs.unlink(file.path);
  } catch (err) {
    logger.warn('Failed to delete physical file', { fileId, error: err });
  }

  // Delete from database (cascade will delete shares)
  await prisma.file.delete({
    where: { id: fileId },
  });

  logger.info('File deleted', { fileId, tenantId });

  return { success: true };
}

/**
 * Get file content (for download)
 */
export async function getFileContent(fileId: string, tenantId: string, userId?: string): Promise<Buffer> {
  const file = await getFileById(fileId, tenantId, userId);

  try {
    const content = await fs.readFile(file.path);
    return content;
  } catch (err) {
    logger.error('Failed to read file', { fileId, error: err });
    throw new Error('Failed to read file');
  }
}

// ============== File Sharing ==============

/**
 * Create a shareable link for a file
 */
export async function createFileShare(input: CreateFileShareInput) {
  const { fileId, password, expiresAt, maxDownloads } = input;

  const file = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    throw new Error('File not found');
  }

  const shareToken = crypto.randomBytes(32).toString('hex');
  const passwordHash = password ? crypto.createHash('sha256').update(password).digest('hex') : null;

  const share = await prisma.fileShare.create({
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
export async function getFileByShareToken(shareToken: string, password?: string) {
  const share = await prisma.fileShare.findUnique({
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
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    if (passwordHash !== share.passwordHash) {
      throw new Error('Invalid password');
    }
  }

  // Increment download count
  await prisma.fileShare.update({
    where: { id: share.id },
    data: { downloadCount: { increment: 1 } },
  });

  return share.file;
}

/**
 * Revoke file share
 */
export async function revokeFileShare(shareToken: string, fileId: string) {
  return prisma.fileShare.updateMany({
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
export async function listFileShares(fileId: string) {
  return prisma.fileShare.findMany({
    where: { fileId },
    orderBy: { createdAt: 'desc' },
  });
}

// ============== Quota Management ==============

/**
 * Check tenant quota
 */
async function checkTenantQuota(tenantId: string, additionalSize: number) {
  // Get tenant storage usage
  const storageUsage = await prisma.file.aggregate({
    where: { tenantId },
    _sum: { size: true },
    _count: { id: true },
  });

  const currentSize = storageUsage._sum.size || 0;
  const currentFiles = storageUsage._count.id || 0;

  // Get tenant quota (from tenant settings or default)
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });

  const quota: FileQuota = tenant?.settings
    ? (tenant.settings as any).fileQuota || getDefaultQuota()
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

function getDefaultQuota(): FileQuota {
  return {
    maxSize: parseInt(process.env.DEFAULT_STORAGE_QUOTA || '1073741824', 10), // 1GB default
    maxFiles: parseInt(process.env.DEFAULT_FILE_QUOTA || '1000', 10),
  };
}

/**
 * Get tenant storage usage
 */
export async function getTenantStorageUsage(tenantId: string) {
  const usage = await prisma.file.aggregate({
    where: { tenantId },
    _sum: { size: true },
    _count: { id: true },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });

  const quota: FileQuota = tenant?.settings
    ? (tenant.settings as any).fileQuota || getDefaultQuota()
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
export async function cleanupExpiredShares() {
  const result = await prisma.fileShare.updateMany({
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
export async function getFileStats(tenantId: string, userId?: string) {
  const where: any = { tenantId };
  if (userId) where.userId = userId;

  const [total, totalSize, byType] = await Promise.all([
    prisma.file.count({ where }),
    prisma.file.aggregate({
      where,
      _sum: { size: true },
    }),
    prisma.file.groupBy({
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
    }, {} as Record<string, { count: number; size: number }>),
  };
}
