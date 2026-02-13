import { Request, Response } from 'express';
export declare function register(req: Request, res: Response): Promise<void>;
export declare function login(req: Request, res: Response): Promise<void>;
export declare function refresh(req: Request, res: Response): Promise<void>;
export declare function logout(req: Request, res: Response): Promise<void>;
export declare function me(req: Request, res: Response): Promise<void>;
export declare function setupMFA(req: Request, res: Response): Promise<void>;
export declare function verifyMFA(req: Request, res: Response): Promise<void>;
export declare function requestLoginOTP(req: Request, res: Response): Promise<void>;
export declare function verifyLoginOTP(req: Request, res: Response): Promise<void>;
export declare function requestPasswordReset(req: Request, res: Response): Promise<void>;
export declare function resetPassword(req: Request, res: Response): Promise<void>;
export declare function changePassword(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map