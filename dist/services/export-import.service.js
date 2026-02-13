"use strict";
/**
 * Export/Import Service - Data portability and bulk operations
 * Supports: CSV, JSON, XLSX formats
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportResources = exportResources;
exports.importResources = importResources;
exports.getExportJob = getExportJob;
exports.getImportJob = getImportJob;
exports.listJobs = listJobs;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../lib/logger");
const json2csv_1 = require("json2csv");
const fileService = __importStar(require("./file.service"));
// ============== Export Functions ==============
/**
 * Export resources to file
 */
async function exportResources(options) {
    const { tenantId, userId, resourceType, format, filters = {}, fields } = options;
    // Create export job
    const job = await prisma_1.prisma.exportJob.create({
        data: {
            tenantId,
            userId,
            resourceType,
            format,
            filters: filters,
            status: 'processing',
        },
    });
    try {
        // Fetch data based on resource type
        const data = await fetchResourceData(tenantId, resourceType, filters);
        // Transform data
        const transformedData = transformData(data, resourceType, fields);
        // Generate file based on format
        let fileBuffer;
        let mimeType;
        let fileName;
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
            },
            isPublic: false,
            metadata: {
                exportJobId: job.id,
                resourceType,
                format,
            },
        });
        // Update job
        await prisma_1.prisma.exportJob.update({
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
    }
    catch (error) {
        logger_1.logger.error('Export failed', { jobId: job.id, error });
        await prisma_1.prisma.exportJob.update({
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
async function fetchResourceData(tenantId, resourceType, filters) {
    switch (resourceType) {
        case 'user':
            return prisma_1.prisma.user.findMany({
                where: { tenantId, ...filters },
                include: {
                    userRoles: {
                        include: { role: true },
                    },
                },
            });
        case 'role':
            return prisma_1.prisma.role.findMany({
                where: { tenantId, ...filters },
                include: {
                    rolePermissions: {
                        include: { permission: true },
                    },
                },
            });
        case 'permission':
            return prisma_1.prisma.permission.findMany({
                where: filters,
            });
        case 'menu':
            return prisma_1.prisma.menu.findMany({
                where: { tenantId, ...filters },
            });
        default:
            throw new Error(`Unsupported resource type: ${resourceType}`);
    }
}
/**
 * Transform data for export
 */
function transformData(data, resourceType, fields) {
    return data.map((item) => {
        const transformed = {};
        switch (resourceType) {
            case 'user':
                const userFields = fields || ['id', 'email', 'username', 'firstName', 'lastName', 'phone', 'isActive', 'createdAt'];
                userFields.forEach((field) => {
                    if (field === 'roles' && item.userRoles) {
                        transformed.roles = item.userRoles.map((ur) => ur.role.name).join(', ');
                    }
                    else {
                        transformed[field] = item[field] || '';
                    }
                });
                break;
            case 'role':
                const roleFields = fields || ['id', 'name', 'code', 'description', 'isActive', 'createdAt'];
                roleFields.forEach((field) => {
                    if (field === 'permissions' && item.rolePermissions) {
                        transformed.permissions = item.rolePermissions.map((rp) => rp.permission.code).join(', ');
                    }
                    else {
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
async function exportToCSV(data, resourceType) {
    const fields = Object.keys(data[0] || {});
    const csv = (0, json2csv_1.parse)(data, { fields });
    return {
        buffer: Buffer.from(csv, 'utf-8'),
        mimeType: 'text/csv',
        fileName: `${resourceType}_export_${Date.now()}.csv`,
    };
}
/**
 * Export to JSON
 */
async function exportToJSON(data, resourceType) {
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
async function exportToXLSX(data, resourceType) {
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
async function importResources(options) {
    const { tenantId, userId, resourceType, format, fileId, options: importOptions = {} } = options;
    // Create import job
    const job = await prisma_1.prisma.importJob.create({
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
        await prisma_1.prisma.importJob.update({
            where: { id: job.id },
            data: {
                status: 'completed',
                totalRows: data.length,
                processedRows: result.processed,
                successRows: result.success,
                errorRows: result.errors.length,
                errors: result.errors,
                completedAt: new Date(),
            },
        });
        return {
            jobId: job.id,
            total: data.length,
            success: result.success,
            errors: result.errors,
        };
    }
    catch (error) {
        logger_1.logger.error('Import failed', { jobId: job.id, error });
        await prisma_1.prisma.importJob.update({
            where: { id: job.id },
            data: {
                status: 'failed',
                errors: [{ message: error.message }],
                completedAt: new Date(),
            },
        });
        throw error;
    }
}
/**
 * Parse import file
 */
async function parseImportFile(fileContent, format) {
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
function parseCSV(content) {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length === 0)
        return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
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
async function processImportData(tenantId, resourceType, data, options) {
    const errors = [];
    let success = 0;
    for (let i = 0; i < data.length; i++) {
        try {
            if (options.validateOnly) {
                validateRow(resourceType, data[i]);
                success++;
            }
            else {
                await importRow(tenantId, resourceType, data[i], options.updateExisting);
                success++;
            }
        }
        catch (error) {
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
function validateRow(resourceType, row) {
    switch (resourceType) {
        case 'user':
            if (!row.email)
                throw new Error('Email is required');
            break;
        case 'role':
            if (!row.name || !row.code)
                throw new Error('Name and code are required');
            break;
        case 'permission':
            if (!row.name || !row.code)
                throw new Error('Name and code are required');
            break;
        case 'menu':
            if (!row.title)
                throw new Error('Title is required');
            break;
    }
}
/**
 * Import a single row
 */
async function importRow(tenantId, resourceType, row, updateExisting = false) {
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
async function importUser(tenantId, row, updateExisting) {
    const email = row.email;
    const existing = await prisma_1.prisma.user.findFirst({
        where: { tenantId, email },
    });
    if (existing && !updateExisting) {
        throw new Error(`User with email ${email} already exists`);
    }
    const data = {
        tenantId,
        email,
        username: row.username,
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone,
        isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
    };
    if (existing && updateExisting) {
        await prisma_1.prisma.user.update({
            where: { id: existing.id },
            data,
        });
    }
    else {
        await prisma_1.prisma.user.create({ data });
    }
}
async function importRole(tenantId, row, updateExisting) {
    const code = row.code;
    const existing = await prisma_1.prisma.role.findFirst({
        where: { tenantId, code },
    });
    if (existing && !updateExisting) {
        throw new Error(`Role with code ${code} already exists`);
    }
    const data = {
        tenantId,
        name: row.name,
        code,
        description: row.description,
        isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
    };
    if (existing && updateExisting) {
        await prisma_1.prisma.role.update({
            where: { id: existing.id },
            data,
        });
    }
    else {
        await prisma_1.prisma.role.create({ data });
    }
}
async function importPermission(row, updateExisting) {
    const code = row.code;
    const existing = await prisma_1.prisma.permission.findUnique({
        where: { code },
    });
    if (existing && !updateExisting) {
        throw new Error(`Permission with code ${code} already exists`);
    }
    const data = {
        name: row.name,
        code,
        resource: row.resource,
        action: row.action,
        description: row.description,
        isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
    };
    if (existing && updateExisting) {
        await prisma_1.prisma.permission.update({
            where: { id: existing.id },
            data,
        });
    }
    else {
        await prisma_1.prisma.permission.create({ data });
    }
}
async function importMenu(tenantId, row, updateExisting) {
    const title = row.title;
    const existing = await prisma_1.prisma.menu.findFirst({
        where: { tenantId, title },
    });
    if (existing && !updateExisting) {
        throw new Error(`Menu with title ${title} already exists`);
    }
    const data = {
        tenantId,
        title,
        path: row.path,
        icon: row.icon,
        order: row.order ? parseInt(row.order, 10) : 0,
        isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
    };
    if (existing && updateExisting) {
        await prisma_1.prisma.menu.update({
            where: { id: existing.id },
            data,
        });
    }
    else {
        await prisma_1.prisma.menu.create({ data });
    }
}
// ============== Job Management ==============
/**
 * Get export job status
 */
async function getExportJob(jobId, userId) {
    return prisma_1.prisma.exportJob.findFirst({
        where: { id: jobId, userId },
    });
}
/**
 * Get import job status
 */
async function getImportJob(jobId, userId) {
    return prisma_1.prisma.importJob.findFirst({
        where: { id: jobId, userId },
    });
}
/**
 * List export/import jobs
 */
async function listJobs(tenantId, userId, type) {
    if (type === 'export') {
        return prisma_1.prisma.exportJob.findMany({
            where: { tenantId, userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    else {
        return prisma_1.prisma.importJob.findMany({
            where: { tenantId, userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
}
//# sourceMappingURL=export-import.service.js.map