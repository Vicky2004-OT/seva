import { Request, Response, NextFunction } from 'express';
import { UserRole, ApiResponse } from '../types';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
        organization?: string;
    };
}
export declare const authenticate: (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: UserRole[]) => (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => void;
export declare const authorizeSelfOrAdmin: (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => void;
