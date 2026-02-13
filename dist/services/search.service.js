"use strict";
/**
 * Advanced Search Service - Full-text search and filtering
 * Supports: PostgreSQL full-text search, advanced filters, saved searches
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchResources = searchResources;
exports.globalSearch = globalSearch;
exports.saveSearch = saveSearch;
exports.getSavedSearches = getSavedSearches;
exports.deleteSavedSearch = deleteSavedSearch;
exports.getSearchSuggestions = getSearchSuggestions;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../lib/logger");
// ============== Core Search Functions ==============
/**
 * Perform advanced search across resources
 */
async function searchResources(options) {
    const { tenantId, resourceType, query, filters = [], dateRange, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 50, } = options;
    const skip = (page - 1) * limit;
    switch (resourceType) {
        case 'user':
            return searchUsers(tenantId, query, filters, dateRange, sortBy, sortOrder, skip, limit);
        case 'role':
            return searchRoles(tenantId, query, filters, dateRange, sortBy, sortOrder, skip, limit);
        case 'permission':
            return searchPermissions(tenantId, query, filters, dateRange, sortBy, sortOrder, skip, limit);
        case 'file':
            return searchFiles(tenantId, query, filters, dateRange, sortBy, sortOrder, skip, limit);
        case 'menu':
            return searchMenus(tenantId, query, filters, dateRange, sortBy, sortOrder, skip, limit);
        case 'policy':
            return searchPolicies(tenantId, query, filters, dateRange, sortBy, sortOrder, skip, limit);
        case 'tenant':
            return searchTenants(tenantId, query, filters, dateRange, sortBy, sortOrder, skip, limit);
        default:
            throw new Error(`Unsupported resource type: ${resourceType}`);
    }
}
/**
 * Global search across all resource types
 */
async function globalSearch(tenantId, query, resourceTypes, limit = 20) {
    const types = resourceTypes || ['user', 'role', 'permission', 'file', 'menu', 'policy'];
    const results = await Promise.all(types.map(async (type) => {
        try {
            const result = await searchResources({
                tenantId,
                resourceType: type,
                query,
                limit: Math.ceil(limit / types.length),
                page: 1,
            });
            return {
                type,
                items: result.items,
                total: result.total,
            };
        }
        catch (err) {
            logger_1.logger.error(`Search failed for ${type}`, err);
            return {
                type,
                items: [],
                total: 0,
            };
        }
    }));
    return {
        results,
        total: results.reduce((sum, r) => sum + r.total, 0),
    };
}
// ============== Resource-Specific Search Implementations ==============
async function searchUsers(tenantId, query, filters = [], dateRange, sortBy = 'createdAt', sortOrder = 'desc', skip = 0, limit = 50) {
    const where = { tenantId };
    // Full-text search
    if (query) {
        where.OR = [
            { email: { contains: query, mode: 'insensitive' } },
            { username: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
        ];
    }
    // Apply filters
    applyFilters(where, filters);
    // Apply date range
    if (dateRange) {
        where[dateRange.field] = {
            gte: dateRange.start,
            lte: dateRange.end,
        };
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            include: {
                userRoles: {
                    include: { role: true },
                },
            },
        }),
        prisma_1.prisma.user.count({ where }),
    ]);
    return { items, total, page: Math.floor(skip / limit) + 1, limit };
}
async function searchRoles(tenantId, query, filters = [], dateRange, sortBy = 'createdAt', sortOrder = 'desc', skip = 0, limit = 50) {
    const where = { tenantId };
    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
        ];
    }
    applyFilters(where, filters);
    if (dateRange) {
        where[dateRange.field] = {
            gte: dateRange.start,
            lte: dateRange.end,
        };
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.role.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            include: {
                rolePermissions: {
                    include: { permission: true },
                },
            },
        }),
        prisma_1.prisma.role.count({ where }),
    ]);
    return { items, total, page: Math.floor(skip / limit) + 1, limit };
}
async function searchPermissions(tenantId, query, filters = [], dateRange, sortBy = 'createdAt', sortOrder = 'desc', skip = 0, limit = 50) {
    const where = {};
    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
        ];
    }
    applyFilters(where, filters);
    if (dateRange) {
        where[dateRange.field] = {
            gte: dateRange.start,
            lte: dateRange.end,
        };
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.permission.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
        }),
        prisma_1.prisma.permission.count({ where }),
    ]);
    return { items, total, page: Math.floor(skip / limit) + 1, limit };
}
async function searchFiles(tenantId, query, filters = [], dateRange, sortBy = 'createdAt', sortOrder = 'desc', skip = 0, limit = 50) {
    const where = { tenantId };
    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { originalName: { contains: query, mode: 'insensitive' } },
        ];
    }
    applyFilters(where, filters);
    if (dateRange) {
        where[dateRange.field] = {
            gte: dateRange.start,
            lte: dateRange.end,
        };
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.file.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
        }),
        prisma_1.prisma.file.count({ where }),
    ]);
    return { items, total, page: Math.floor(skip / limit) + 1, limit };
}
async function searchMenus(tenantId, query, filters = [], dateRange, sortBy = 'createdAt', sortOrder = 'desc', skip = 0, limit = 50) {
    const where = { tenantId };
    if (query) {
        where.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { path: { contains: query, mode: 'insensitive' } },
        ];
    }
    applyFilters(where, filters);
    if (dateRange) {
        where[dateRange.field] = {
            gte: dateRange.start,
            lte: dateRange.end,
        };
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.menu.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
        }),
        prisma_1.prisma.menu.count({ where }),
    ]);
    return { items, total, page: Math.floor(skip / limit) + 1, limit };
}
async function searchPolicies(tenantId, query, filters = [], dateRange, sortBy = 'createdAt', sortOrder = 'desc', skip = 0, limit = 50) {
    const where = { tenantId };
    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
        ];
    }
    applyFilters(where, filters);
    if (dateRange) {
        where[dateRange.field] = {
            gte: dateRange.start,
            lte: dateRange.end,
        };
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.policy.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            include: {
                rules: true,
            },
        }),
        prisma_1.prisma.policy.count({ where }),
    ]);
    return { items, total, page: Math.floor(skip / limit) + 1, limit };
}
async function searchTenants(tenantId, query, filters = [], dateRange, sortBy = 'createdAt', sortOrder = 'desc', skip = 0, limit = 50) {
    const where = {};
    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { slug: { contains: query, mode: 'insensitive' } },
            { domain: { contains: query, mode: 'insensitive' } },
        ];
    }
    applyFilters(where, filters);
    if (dateRange) {
        where[dateRange.field] = {
            gte: dateRange.start,
            lte: dateRange.end,
        };
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.tenant.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
        }),
        prisma_1.prisma.tenant.count({ where }),
    ]);
    return { items, total, page: Math.floor(skip / limit) + 1, limit };
}
// ============== Filter Application ==============
function applyFilters(where, filters) {
    filters.forEach((filter) => {
        const { field, operator, value } = filter;
        switch (operator) {
            case 'eq':
                where[field] = value;
                break;
            case 'ne':
                where[field] = { not: value };
                break;
            case 'gt':
                where[field] = { gt: value };
                break;
            case 'gte':
                where[field] = { gte: value };
                break;
            case 'lt':
                where[field] = { lt: value };
                break;
            case 'lte':
                where[field] = { lte: value };
                break;
            case 'in':
                where[field] = { in: Array.isArray(value) ? value : [value] };
                break;
            case 'notIn':
                where[field] = { notIn: Array.isArray(value) ? value : [value] };
                break;
            case 'contains':
                where[field] = { contains: value, mode: 'insensitive' };
                break;
            case 'startsWith':
                where[field] = { startsWith: value, mode: 'insensitive' };
                break;
            case 'endsWith':
                where[field] = { endsWith: value, mode: 'insensitive' };
                break;
            case 'between':
                if (Array.isArray(value) && value.length === 2) {
                    where[field] = { gte: value[0], lte: value[1] };
                }
                break;
        }
    });
}
// ============== Saved Searches ==============
/**
 * Save a search
 */
async function saveSearch(input) {
    const { tenantId, userId, name, resourceType, query, isPublic = false } = input;
    return prisma_1.prisma.savedSearch.create({
        data: {
            tenantId,
            userId,
            name,
            resourceType,
            query: query,
            isPublic,
        },
    });
}
/**
 * Get saved searches
 */
async function getSavedSearches(tenantId, userId, resourceType) {
    const where = { tenantId };
    if (userId) {
        where.OR = [{ userId }, { isPublic: true }];
    }
    else {
        where.isPublic = true;
    }
    if (resourceType) {
        where.resourceType = resourceType;
    }
    return prisma_1.prisma.savedSearch.findMany({
        where,
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
    });
}
/**
 * Delete saved search
 */
async function deleteSavedSearch(searchId, userId) {
    return prisma_1.prisma.savedSearch.deleteMany({
        where: {
            id: searchId,
            userId,
        },
    });
}
/**
 * Get search suggestions (popular searches)
 */
async function getSearchSuggestions(tenantId, resourceType, query, limit = 10) {
    // This is a simplified implementation
    // In production, you might want to use a search index like Elasticsearch
    // or track popular searches in a separate table
    const results = await searchResources({
        tenantId,
        resourceType,
        query,
        limit,
        page: 1,
    });
    return results.items.map((item) => {
        // Extract relevant fields for suggestions
        if (resourceType === 'user') {
            return { id: item.id, text: item.email || item.username };
        }
        if (resourceType === 'role') {
            return { id: item.id, text: item.name || item.code };
        }
        return { id: item.id, text: item.name || item.title || item.code };
    });
}
//# sourceMappingURL=search.service.js.map