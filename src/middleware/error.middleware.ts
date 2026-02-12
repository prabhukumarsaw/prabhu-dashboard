import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
}

export function errorHandler(
  err: Error & { statusCode?: number },
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.statusCode ?? 500;
  logger.error({ err, path: req.path, method: req.method });
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
