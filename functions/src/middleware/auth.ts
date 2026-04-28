import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getFirestore } from '../config/firebase';
import { UserRole, JWTPayload, ApiResponse } from '../types';
import { AppError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    organization?: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      throw new AppError('User not found.', 404);
    }

    const userData = userDoc.data();
    if (!userData || !userData.isActive) {
      throw new AppError('Account is deactivated.', 401);
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      organization: decoded.organization
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token.', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired.', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions.', 403));
    }

    next();
  };
};

export const authorizeSelfOrAdmin = (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }

  const targetUserId = req.params.userId || req.params.id;
  
  if (req.user.role === UserRole.ADMIN || req.user.id === targetUserId) {
    return next();
  }

  next(new AppError('Insufficient permissions.', 403));
};
