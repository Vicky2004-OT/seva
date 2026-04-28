import { Router, Response } from 'express';
import { getFirestore } from '../config/firebase';
import { User, UserRole, ApiResponse, PaginatedResponse } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import Joi from 'joi';

const router = Router();

// Get all users (admin only)
router.get('/', authenticate, authorize(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const db = getFirestore();
  
  let query: any = db.collection('users');
  
  // Filter by role if provided
  if (req.query.role) {
    query = query.where('role', '==', req.query.role);
  }
  
  // Filter by organization if provided
  if (req.query.organization) {
    query = query.where('organization', '==', req.query.organization);
  }
  
  // Pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  const snapshot = await query.orderBy('createdAt', 'desc').limit(limit).offset(skip).get();
  const totalSnapshot = await query.count().get();
  
  const users = snapshot.docs.map((doc: any) => {
    const userData = { id: doc.id, ...doc.data() } as User;
    // Remove sensitive data
    const { password, ...userWithoutPassword } = userData as any;
    return userWithoutPassword;
  });
  
  res.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total: totalSnapshot.data().count,
      pages: Math.ceil(totalSnapshot.data().count / limit)
    }
  } as PaginatedResponse<User>);
}));

// Get user by ID
router.get('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const db = getFirestore();
  const userDoc = await db.collection('users').doc(req.params.id).get();
  
  if (!userDoc.exists) {
    throw new AppError('User not found', 404);
  }
  
  const user = { id: userDoc.id, ...userDoc.data() } as User;
  
  // Check permissions (admin can see any user, others can only see themselves)
  if (req.user!.role !== UserRole.ADMIN && req.user!.id !== req.params.id) {
    throw new AppError('Access denied', 403);
  }
  
  // Remove sensitive data
  const { password, ...userWithoutPassword } = user as any;
  
  res.json({
    success: true,
    data: userWithoutPassword
  });
}));

// Update user (admin can update any user, others can only update themselves)
router.put('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const db = getFirestore();
  const userRef = db.collection('users').doc(req.params.id);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    throw new AppError('User not found', 404);
  }
  
  // Check permissions
  if (req.user!.role !== UserRole.ADMIN && req.user!.id !== req.params.id) {
    throw new AppError('Access denied', 403);
  }
  
  const updateSchema = Joi.object({
    name: Joi.string().min(2).optional(),
    organization: Joi.string().optional(),
    phone: Joi.string().optional(),
    role: Joi.string().valid(...Object.values(UserRole)).optional(),
    isActive: Joi.boolean().optional()
  });
  
  const { error, value } = updateSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }
  
  // Only admin can change role and isActive status
  if (req.user!.role !== UserRole.ADMIN) {
    delete value.role;
    delete value.isActive;
  }
  
  await userRef.update({
    ...value,
    updatedAt: new Date()
  });
  
  const updatedUserDoc = await userRef.get();
  const updatedUser = { id: updatedUserDoc.id, ...updatedUserDoc.data() } as User;
  
  // Remove sensitive data
  const { password, ...userWithoutPassword } = updatedUser as any;
  
  res.json({
    success: true,
    data: userWithoutPassword,
    message: 'User updated successfully'
  });
}));

// Deactivate user (admin only)
router.post('/:id/deactivate', authenticate, authorize(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const db = getFirestore();
  const userRef = db.collection('users').doc(req.params.id);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    throw new AppError('User not found', 404);
  }
  
  await userRef.update({
    isActive: false,
    updatedAt: new Date()
  });
  
  res.json({
    success: true,
    message: 'User deactivated successfully'
  });
}));

// Activate user (admin only)
router.post('/:id/activate', authenticate, authorize(UserRole.ADMIN), asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const db = getFirestore();
  const userRef = db.collection('users').doc(req.params.id);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    throw new AppError('User not found', 404);
  }
  
  await userRef.update({
    isActive: true,
    updatedAt: new Date()
  });
  
  res.json({
    success: true,
    message: 'User activated successfully'
  });
}));

export default router;
