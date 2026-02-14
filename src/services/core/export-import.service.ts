/**
 * Export/Import Service - Data portability and bulk operations
 * Supports: CSV, JSON, XLSX formats
 */

import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { parse } from 'json2csv';
import { v4 as uuidv4 } from 'uuid';
import * as fileService from './file.service';

// ============== Types ==============

export type ExportFormat = 'csv' | 'json' | 'xlsx';

export type ImportFormat = 'csv' | 'json' | 'xlsx';

export type ResourceType = 'user' | 'role' | 'permission' | 'menu';

export interface ExportOptions {
  tenantId: string;
  userId: string;
  resourceType: ResourceType;
  format: ExportFormat;
  filters?: Record<string, unknown>;
  fields?: string[]; // Specific fields to export
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

// ============== Export Functions ==============

/**
 * Export resources to file
 */
export async function exportResources(options: ExportOptions) {
  const { tenantId, userId, resourceType, format, filters = {}, fields } = options;

  // Create export job
  const job = await prisma.exportJob.create({
    data: {
      tenantId,
      userId,
      resourceType,
      format,
      filters: filters as any,
      status: 'processing',
    },
  });

  try {
    // Fetch data based on resource type
    const data = await fetchResourceData(tenantId, resourceType, filters);

    // Transform data
    const transformedData = transformData(data, resourceType, fields);

    // Generate file based on format
    let fileBuffer: Buffer;
    let mimeType: string;
    let fileName: string;

    switch (format) {
      case 'csv':
        ({ buffer: fileBuffer, mimeType, fileName } = await exportToCSV(transformedData, resourceType));
        break;
      case 'json':
        ({ buffer: fileBuffer, mimeType, fileName } = await exportToJSON(transformedData, resourceType));
        break;
      case 'xlsx':
        ({ buffer: fileBuffer, mimeType, fileName } = await exportToXLSX(transformedData, resourceType));
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    // Upload file
    const file = await fileService.uploadFile({
      tenantId,
      userId,
      file: {
        buffer: fileBuffer,
        originalname: fileName,
        mimetype: mimeType,
        size: fileBuffer.length,
        fieldname: 'export',
        encoding: '7bit',
      } as Express.Multer.File,
      isPublic: false,
      metadata: {
        exportJobId: job.id,
        resourceType,
        format,
      },
    });

    // Update job
    await prisma.exportJob.update({
      where: { id: job.id },
      data: {
        status: 'completed',
        fileId: file.id,
        completedAt: new Date(),
      },
    });

    return {
      jobId: job.id,
      fileId: file.id,
      fileName,
      downloadUrl: file.url,
    };
  } catch (error: any) {
    logger.error('Export failed', { jobId: job.id, error });
    await prisma.exportJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

/**
 * Fetch resource data
 */
async function fetchResourceData(tenantId: string, resourceType: ResourceType, filters: Record<string, unknown>) {
  switch (resourceType) {
    case 'user':
      return prisma.user.findMany({
        where: { tenantId, ...filters },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });
    case 'role':
      return prisma.role.findMany({
        where: { tenantId, ...filters },
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      });
    case 'permission':
      return prisma.permission.findMany({
        where: filters,
      });
    case 'menu':
      return prisma.menu.findMany({
        where: { tenantId, ...filters },
      });
    default:
      throw new Error(`Unsupported resource type: ${resourceType}`);
  }
}

/**
 * Transform data for export
 */
function transformData(data: any[], resourceType: ResourceType, fields?: string[]): Record<string, unknown>[] {
  return data.map((item) => {
    const transformed: Record<string, unknown> = {};

    switch (resourceType) {
      case 'user':
        const userFields = fields || ['id', 'email', 'username', 'firstName', 'lastName', 'phone', 'isActive', 'createdAt'];
        userFields.forEach((field) => {
          if (field === 'roles' && item.userRoles) {
            transformed.roles = item.userRoles.map((ur: any) => ur.role.name).join(', ');
          } else {
            transformed[field] = item[field] || '';
          }
        });
        break;
      case 'role':
        const roleFields = fields || ['id', 'name', 'code', 'description', 'isActive', 'createdAt'];
        roleFields.forEach((field) => {
          if (field === 'permissions' && item.rolePermissions) {
            transformed.permissions = item.rolePermissions.map((rp: any) => rp.permission.code).join(', ');
          } else {
            transformed[field] = item[field] || '';
          }
        });
        break;
      case 'permission':
        const permFields = fields || ['id', 'name', 'code', 'resource', 'action', 'description', 'isActive'];
        permFields.forEach((field) => {
          transformed[field] = item[field] || '';
        });
        break;
      case 'menu':
        const menuFields = fields || ['id', 'title', 'path', 'icon', 'order', 'isActive', 'createdAt'];
        menuFields.forEach((field) => {
          transformed[field] = item[field] || '';
        });
        break;
    }

    return transformed;
  });
}

/**
 * Export to CSV
 */
async function exportToCSV(data: Record<string, unknown>[], resourceType: ResourceType) {
  const fields = Object.keys(data[0] || {});
  const csv = parse(data, { fields });

  return {
    buffer: Buffer.from(csv, 'utf-8'),
    mimeType: 'text/csv',
    fileName: `${resourceType}_export_${Date.now()}.csv`,
  };
}

/**
 * Export to JSON
 */
async function exportToJSON(data: Record<string, unknown>[], resourceType: ResourceType) {
  const json = JSON.stringify(data, null, 2);

  return {
    buffer: Buffer.from(json, 'utf-8'),
    mimeType: 'application/json',
    fileName: `${resourceType}_export_${Date.now()}.json`,
  };
}

/**
 * Export to XLSX (simplified - in production use exceljs or xlsx library)
 */
async function exportToXLSX(data: Record<string, unknown>[], resourceType: ResourceType) {
  // For now, export as CSV (install exceljs for proper XLSX support)
  // npm install exceljs
  const csv = await exportToCSV(data, resourceType);
  return {
    buffer: csv.buffer,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileName: `${resourceType}_export_${Date.now()}.xlsx`,
  };
}

// ============== Import Functions ==============

/**
 * Import resources from file
 */
export async function importResources(options: ImportOptions) {
  const { tenantId, userId, resourceType, format, fileId, options: importOptions = {} } = options;

  // Create import job
  const job = await prisma.importJob.create({
    data: {
      tenantId,
      userId,
      resourceType,
      format,
      fileId,
      status: 'processing',
    },
  });

  try {
    // Get file
    const file = await fileService.getFileById(fileId, tenantId, userId);
    const fileContent = await fileService.getFileContent(fileId, tenantId, userId);

    // Parse file based on format
    const data = await parseImportFile(fileContent, format);

    // Validate and import data
    const result = await processImportData(tenantId, resourceType, data, importOptions);

    // Update job
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: 'completed',
        totalRows: data.length,
        processedRows: result.processed,
        successRows: result.success,
        errorRows: result.errors.length,
        errors: result.errors as any,
        completedAt: new Date(),
      },
    });

    return {
      jobId: job.id,
      total: data.length,
      success: result.success,
      errors: result.errors,
    };
  } catch (error: any) {
    logger.error('Import failed', { jobId: job.id, error });
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        errors: [{ message: error.message }] as any,
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

/**
 * Parse import file
 */
async function parseImportFile(fileContent: Buffer, format: ImportFormat): Promise<Record<string, unknown>[]> {
  const content = fileContent.toString('utf-8');

  switch (format) {
    case 'json':
      return JSON.parse(content);
    case 'csv':
      return parseCSV(content);
    case 'xlsx':
      // In production, use xlsx library to parse
      return parseCSV(content);
    default:
      throw new Error(`Unsupported import format: ${format}`);
  }
}

/**
 * Parse CSV content
 */
function parseCSV(content: string): Record<string, unknown>[] {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const data: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    data.push(row);
  }

  return data;
}

/**
 * Process import data
 */
async function processImportData(
  tenantId: string,
  resourceType: ResourceType,
  data: Record<string, unknown>[],
  options: { skipErrors?: boolean; updateExisting?: boolean; validateOnly?: boolean }
): Promise<{ processed: number; success: number; errors: Array<{ row: number; error: string }> }> {
  const errors: Array<{ row: number; error: string }> = [];
  let success = 0;

  for (let i = 0; i < data.length; i++) {
    try {
      if (options.validateOnly) {
        validateRow(resourceType, data[i]);
        success++;
      } else {
        await importRow(tenantId, resourceType, data[i], options.updateExisting);
        success++;
      }
    } catch (error: any) {
      errors.push({ row: i + 1, error: error.message });
      if (!options.skipErrors) {
        throw error;
      }
    }
  }

  return {
    processed: data.length,
    success,
    errors,
  };
}

/**
 * Validate a row
 */
function validateRow(resourceType: ResourceType, row: Record<string, unknown>) {
  switch (resourceType) {
    case 'user':
      if (!row.email) throw new Error('Email is required');
      break;
    case 'role':
      if (!row.name || !row.code) throw new Error('Name and code are required');
      break;
    case 'permission':
      if (!row.name || !row.code) throw new Error('Name and code are required');
      break;
    case 'menu':
      if (!row.title) throw new Error('Title is required');
      break;
  }
}

/**
 * Import a single row
 */
async function importRow(
  tenantId: string,
  resourceType: ResourceType,
  row: Record<string, unknown>,
  updateExisting: boolean = false
) {
  switch (resourceType) {
    case 'user':
      await importUser(tenantId, row, updateExisting);
      break;
    case 'role':
      await importRole(tenantId, row, updateExisting);
      break;
    case 'permission':
      await importPermission(row, updateExisting);
      break;
    case 'menu':
      await importMenu(tenantId, row, updateExisting);
      break;
  }
}

async function importUser(tenantId: string, row: Record<string, unknown>, updateExisting: boolean) {
  const email = row.email as string;
  const existing = await prisma.user.findFirst({
    where: { tenantId, email },
  });

  if (existing && !updateExisting) {
    throw new Error(`User with email ${email} already exists`);
  }

  const data: any = {
    tenantId,
    email,
    username: row.username as string,
    firstName: row.firstName as string,
    lastName: row.lastName as string,
    phone: row.phone as string,
    isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
  };

  if (existing && updateExisting) {
    await prisma.user.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.user.create({ data });
  }
}

async function importRole(tenantId: string, row: Record<string, unknown>, updateExisting: boolean) {
  const code = row.code as string;
  const existing = await prisma.role.findFirst({
    where: { tenantId, code },
  });

  if (existing && !updateExisting) {
    throw new Error(`Role with code ${code} already exists`);
  }

  const data: any = {
    tenantId,
    name: row.name as string,
    code,
    description: row.description as string,
    isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
  };

  if (existing && updateExisting) {
    await prisma.role.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.role.create({ data });
  }
}

async function importPermission(row: Record<string, unknown>, updateExisting: boolean) {
  const code = row.code as string;
  const existing = await prisma.permission.findUnique({
    where: { code },
  });

  if (existing && !updateExisting) {
    throw new Error(`Permission with code ${code} already exists`);
  }

  const data: any = {
    name: row.name as string,
    code,
    resource: row.resource as string,
    action: row.action as string,
    description: row.description as string,
    isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
  };

  if (existing && updateExisting) {
    await prisma.permission.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.permission.create({ data });
  }
}

async function importMenu(tenantId: string, row: Record<string, unknown>, updateExisting: boolean) {
  const title = row.title as string;
  const existing = await prisma.menu.findFirst({
    where: { tenantId, title },
  });

  if (existing && !updateExisting) {
    throw new Error(`Menu with title ${title} already exists`);
  }

  const data: any = {
    tenantId,
    title,
    path: row.path as string,
    icon: row.icon as string,
    order: row.order ? parseInt(row.order as string, 10) : 0,
    isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
  };

  if (existing && updateExisting) {
    await prisma.menu.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.menu.create({ data });
  }
}

// ============== Job Management ==============

/**
 * Get export job status
 */
export async function getExportJob(jobId: string, userId: string) {
  return prisma.exportJob.findFirst({
    where: { id: jobId, userId },
  });
}

/**
 * Get import job status
 */
export async function getImportJob(jobId: string, userId: string) {
  return prisma.importJob.findFirst({
    where: { id: jobId, userId },
  });
}

/**
 * List export/import jobs
 */
export async function listJobs(tenantId: string, userId: string, type: 'export' | 'import') {
  if (type === 'export') {
    return prisma.exportJob.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } else {
    return prisma.importJob.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
