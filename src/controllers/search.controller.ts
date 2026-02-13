import { Request, Response } from 'express';
import * as searchService from '../services/search.service';

export async function search(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId!;
  const { resourceType, query, filters, dateRange, sortBy, sortOrder, page, limit } = req.body;

  if (!resourceType) {
    res.status(400).json({ success: false, message: 'resourceType is required' });
    return;
  }

  try {
    const result = await searchService.searchResources({
      tenantId,
      resourceType,
      query,
      filters,
      dateRange: dateRange
        ? {
            field: dateRange.field,
            start: new Date(dateRange.start),
            end: new Date(dateRange.end),
          }
        : undefined,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function globalSearch(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId!;
  const { query, resourceTypes, limit } = req.query;

  if (!query) {
    res.status(400).json({ success: false, message: 'query is required' });
    return;
  }

  try {
    const result = await searchService.globalSearch(
      tenantId,
      query as string,
      resourceTypes ? (resourceTypes as string).split(',') as any : undefined,
      limit ? parseInt(limit as string, 10) : undefined
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function saveSearch(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId!;
  const userId = (req.user as any)?.id;
  const { name, resourceType, query, isPublic } = req.body;

  if (!name || !resourceType || !query) {
    res.status(400).json({ success: false, message: 'name, resourceType, and query are required' });
    return;
  }

  try {
    const savedSearch = await searchService.saveSearch({
      tenantId,
      userId,
      name,
      resourceType,
      query,
      isPublic,
    });

    res.status(201).json({ success: true, data: savedSearch });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getSavedSearches(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId!;
  const userId = (req.user as any)?.id;
  const { resourceType } = req.query;

  try {
    const searches = await searchService.getSavedSearches(tenantId, userId, resourceType as any);
    res.json({ success: true, data: searches });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function deleteSavedSearch(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = (req.user as any)?.id;

  try {
    await searchService.deleteSavedSearch(id, userId);
    res.json({ success: true, message: 'Saved search deleted' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getSuggestions(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId!;
  const { resourceType, query, limit } = req.query;

  if (!resourceType || !query) {
    res.status(400).json({ success: false, message: 'resourceType and query are required' });
    return;
  }

  try {
    const suggestions = await searchService.getSearchSuggestions(
      tenantId,
      resourceType as any,
      query as string,
      limit ? parseInt(limit as string, 10) : undefined
    );

    res.json({ success: true, data: suggestions });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}
