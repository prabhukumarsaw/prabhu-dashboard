import { Request, Response, type RequestHandler } from 'express';
export declare const uploadMiddleware: RequestHandler;
export declare function uploadFile(req: Request, res: Response): Promise<void>;
export declare function list(req: Request, res: Response): Promise<void>;
export declare function getById(req: Request, res: Response): Promise<void>;
export declare function download(req: Request, res: Response): Promise<void>;
export declare function remove(req: Request, res: Response): Promise<void>;
export declare function createShare(req: Request, res: Response): Promise<void>;
export declare function getByShareToken(req: Request, res: Response): Promise<void>;
export declare function listShares(req: Request, res: Response): Promise<void>;
export declare function revokeShare(req: Request, res: Response): Promise<void>;
export declare function getStorageUsage(req: Request, res: Response): Promise<void>;
export declare function getStats(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=file.controller.d.ts.map