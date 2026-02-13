import { Request, Response } from 'express';
export declare function create(req: Request, res: Response): Promise<void>;
export declare function createBulk(req: Request, res: Response): Promise<void>;
export declare function list(req: Request, res: Response): Promise<void>;
export declare function markAsRead(req: Request, res: Response): Promise<void>;
export declare function markAllAsRead(req: Request, res: Response): Promise<void>;
export declare function getUnreadCount(req: Request, res: Response): Promise<void>;
export declare function remove(req: Request, res: Response): Promise<void>;
export declare function getPreferences(req: Request, res: Response): Promise<void>;
export declare function updatePreference(req: Request, res: Response): Promise<void>;
export declare function getStats(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=notification.controller.d.ts.map