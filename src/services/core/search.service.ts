/**
 * Advanced Search Service - Full-text search and filtering
 * Supports: PostgreSQL full-text search, advanced filters, saved searches
 */

import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

// ============== Types ==============

export type ResourceType = 'user' | 'role' | 'permission' | 'file' | 'menu' | 'policy' | 'tenant';

export interface SearchFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'contains' | 'startsWith' | 'endsWith' | 'between';
  value: unknown;
}

export interface SearchOptions {
  tenantId: string;
  resourceType: ResourceType;
  query?: string; // Full-text search query
  filters?: SearchFilter[];
  dateRange?: {
    field: string;
    start: Date;
    end: Date;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SavedSearchInput {
  tenantId: string;
  userId: string;
  name: string;
  resourceType: ResourceType;
  query: Record<string, unknown>; // Search criteria
  isPublic?: boolean;
}

// ============== Core Search Functions ==============

/**
 * Perform advanced search across resources
 */
export async function searchResources(options: SearchOptions) {
  const {
    tenantId,
    resourceType,
    query,
    filters = [],
    dateRange,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 50,
  } = options;

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
export async function globalSearch(
  tenantId: string,
  query: string,
  resourceTypes?: ResourceType[],
  limit: number = 20
) {
  const types = resourceTypes || ['user', 'role', 'permission', 'file', 'menu', 'policy'];

  const results = await Promise.all(
    types.map(async (type) => {
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
      } catch (err) {
        logger.error(`Search failed for ${type}`, err);
        return {
          type,
          items: [],
          total: 0,
        };
      }
    })
  );

  return {
    results,
    total: results.reduce((sum, r) => sum + r.total, 0),
  };
}

// ============== Resource-Specific Search Implementations ==============

async function searchUsers(
  tenantId: string,
  query?: string,
  filters: SearchFilter[] = [],
  dateRange?: { field: string; start: Date; end: Date },
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  skip: number = 0,
  limit: number = 50
) {
  const where: any = { tenantId };

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
    prisma.user.findMany({
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
    prisma.user.count({ where }),
  ]);

  return { items, total, page: Math.floor(skip / limit) + 1, limit };
}

async function searchRoles(
  tenantId: string,
  query?: string,
  filters: SearchFilter[] = [],
  dateRange?: { field: string; start: Date; end: Date },
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  skip: number = 0,
  limit: number = 50
) {
  const where: any = { tenantId };

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
    prisma.role.findMany({
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
    prisma.role.count({ where }),
  ]);

  return { items, total, page: Math.floor(skip / limit) + 1, limit };
}

async function searchPermissions(
  tenantId: string,
  query?: string,
  filters: SearchFilter[] = [],
  dateRange?: { field: string; start: Date; end: Date },
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  skip: number = 0,
  limit: number = 50
) {
  const where: any = {};

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
    prisma.permission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.permission.count({ where }),
  ]);

  return { items, total, page: Math.floor(skip / limit) + 1, limit };
}

async function searchFiles(
  tenantId: string,
  query?: string,
  filters: SearchFilter[] = [],
  dateRange?: { field: string; start: Date; end: Date },
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  skip: number = 0,
  limit: number = 50
) {
  const where: any = { tenantId };

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
    prisma.file.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.file.count({ where }),
  ]);

  return { items, total, page: Math.floor(skip / limit) + 1, limit };
}

async function searchMenus(
  tenantId: string,
  query?: string,
  filters: SearchFilter[] = [],
  dateRange?: { field: string; start: Date; end: Date },
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  skip: number = 0,
  limit: number = 50
) {
  const where: any = { tenantId };

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
    prisma.menu.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.menu.count({ where }),
  ]);

  return { items, total, page: Math.floor(skip / limit) + 1, limit };
}

async function searchPolicies(
  tenantId: string,
  query?: string,
  filters: SearchFilter[] = [],
  dateRange?: { field: string; start: Date; end: Date },
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  skip: number = 0,
  limit: number = 50
) {
  const where: any = { tenantId };

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
    prisma.policy.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        rules: true,
      },
    }),
    prisma.policy.count({ where }),
  ]);

  return { items, total, page: Math.floor(skip / limit) + 1, limit };
}

async function searchTenants(
  tenantId: string,
  query?: string,
  filters: SearchFilter[] = [],
  dateRange?: { field: string; start: Date; end: Date },
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  skip: number = 0,
  limit: number = 50
) {
  const where: any = {};

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
    prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.tenant.count({ where }),
  ]);

  return { items, total, page: Math.floor(skip / limit) + 1, limit };
}

// ============== Filter Application ==============

function applyFilters(where: any, filters: SearchFilter[]) {
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
export async function saveSearch(input: SavedSearchInput) {
  const { tenantId, userId, name, resourceType, query, isPublic = false } = input;

  return prisma.savedSearch.create({
    data: {
      tenantId,
      userId,
      name,
      resourceType,
      query: query as any,
      isPublic,
    },
  });
}

/**
 * Get saved searches
 */
export async function getSavedSearches(
  tenantId: string,
  userId?: string,
  resourceType?: ResourceType
) {
  const where: any = { tenantId };
  if (userId) {
    where.OR = [{ userId }, { isPublic: true }];
  } else {
    where.isPublic = true;
  }
  if (resourceType) {
    where.resourceType = resourceType;
  }

  return prisma.savedSearch.findMany({
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
export async function deleteSavedSearch(searchId: string, userId: string) {
  return prisma.savedSearch.deleteMany({
    where: {
      id: searchId,
      userId,
    },
  });
}

/**
 * Get search suggestions (popular searches)
 */
export async function getSearchSuggestions(
  tenantId: string,
  resourceType: ResourceType,
  query: string,
  limit: number = 10
) {
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

  return results.items.map((item: any) => {
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
