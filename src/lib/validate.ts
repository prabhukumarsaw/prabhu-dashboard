import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
    return;
  }
  res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array().map((e) => ({ field: e.type === 'field' ? (e as any).path : 'unknown', message: e.msg })),
  });
}
