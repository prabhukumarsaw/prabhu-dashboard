import { Request, Response, type RequestHandler } from 'express';
import * as fileService from '../../services/core/file.service';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10) },
});

export const uploadMiddleware: RequestHandler = upload.single('file');

export async function uploadFile(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'File is required' });
    return;
  }

  const tenantId = req.tenantId!;
  const userId = (req.user as any)?.id;
  const { isPublic, metadata } = req.body;

  try {
    const file = await fileService.uploadFile({
      tenantId,
      userId,
      file: req.file,
      isPublic: isPublic === 'true' || isPublic === true,
      metadata: metadata ? JSON.parse(metadata) : undefined,
    });

    res.status(201).json({ success: true, data: file });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId!;
  const { userId, mimeType, search, page, limit } = req.query;

  try {
    const result = await fileService.listFiles(tenantId, {
      userId: userId as string,
      mimeType: mimeType as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const tenantId = req.tenantId!;
  const userId = (req.user as any)?.id;

  try {
    const file = await fileService.getFileById(id, tenantId, userId);
    res.json({ success: true, data: file });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
}

export async function download(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const tenantId = req.tenantId!;
  const userId = (req.user as any)?.id;

  try {
    const file = await fileService.getFileById(id, tenantId, userId);
    const content = await fileService.getFileContent(id, tenantId, userId);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.send(content);
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const tenantId = req.tenantId!;
  const userId = (req.user as any)?.id;

  try {
    await fileService.deleteFile(id, tenantId, userId);
    res.json({ success: true, message: 'File deleted' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function createShare(req: Request, res: Response): Promise<void> {
  const { fileId } = req.params;
  const { password, expiresAt, maxDownloads } = req.body;

  try {
    const share = await fileService.createFileShare({
      fileId,
      password,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      maxDownloads: maxDownloads ? parseInt(maxDownloads, 10) : undefined,
    });

    res.status(201).json({ success: true, data: share });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getByShareToken(req: Request, res: Response): Promise<void> {
  const { token } = req.params;
  const { password } = req.query;

  try {
    const file = await fileService.getFileByShareToken(token, password as string);
    const content = await fileService.getFileContent(file.id, file.tenantId);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.send(content);
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
}

export async function listShares(req: Request, res: Response): Promise<void> {
  const { fileId } = req.params;

  try {
    const shares = await fileService.listFileShares(fileId);
    res.json({ success: true, data: shares });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function revokeShare(req: Request, res: Response): Promise<void> {
  const { fileId, token } = req.params;

  try {
    await fileService.revokeFileShare(token, fileId);
    res.json({ success: true, message: 'Share revoked' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getStorageUsage(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId!;

  try {
    const usage = await fileService.getTenantStorageUsage(tenantId);
    res.json({ success: true, data: usage });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getStats(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId!;
  const userId = (req.query.userId as string) || (req.user as any)?.id;

  try {
    const stats = await fileService.getFileStats(tenantId, userId);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}
