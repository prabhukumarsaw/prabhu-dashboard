import { Request, Response } from 'express';
import * as exportImportService from '../../services/core/export-import.service';

export async function exportResources(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId!;
  const userId = (req.user as any)?.id;
  const { resourceType, format, filters, fields } = req.body;

  if (!resourceType || !format) {
    res.status(400).json({ success: false, message: 'resourceType and format are required' });
    return;
  }

  try {
    const result = await exportImportService.exportResources({
      tenantId,
      userId,
      resourceType,
      format,
      filters,
      fields,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function importResources(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId!;
  const userId = (req.user as any)?.id;
  const { resourceType, format, fileId, options } = req.body;

  if (!resourceType || !format || !fileId) {
    res.status(400).json({ success: false, message: 'resourceType, format, and fileId are required' });
    return;
  }

  try {
    const result = await exportImportService.importResources({
      tenantId,
      userId,
      resourceType,
      format,
      fileId,
      options,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getExportJob(req: Request, res: Response): Promise<void> {
  const { jobId } = req.params;
  const userId = (req.user as any)?.id;

  try {
    const job = await exportImportService.getExportJob(jobId, userId);
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }
    res.json({ success: true, data: job });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getImportJob(req: Request, res: Response): Promise<void> {
  const { jobId } = req.params;
  const userId = (req.user as any)?.id;

  try {
    const job = await exportImportService.getImportJob(jobId, userId);
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }
    res.json({ success: true, data: job });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function listJobs(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId!;
  const userId = (req.user as any)?.id;
  const { type } = req.query;

  if (!type || (type !== 'export' && type !== 'import')) {
    res.status(400).json({ success: false, message: 'type must be "export" or "import"' });
    return;
  }

  try {
    const jobs = await exportImportService.listJobs(tenantId, userId, type as 'export' | 'import');
    res.json({ success: true, data: jobs });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}
