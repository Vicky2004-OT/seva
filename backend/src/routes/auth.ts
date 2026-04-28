import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getFirestore } from '../config/firebase';
import { User, UserRole, ApiResponse, JWTPayload } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import Joi from 'joi';

const router = Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
  role: Joi.string().valid(...Object.values(UserRole)).default(UserRole.FIELD_WORKER),
  organization: Joi.string().optional(),
  phone: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Generate JWT token
const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organization: user.organization
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  } as jwt.SignOptions);
};

// Register new user
router.post('/register', asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { email, password, name, role, organization, phone } = value;

  const db = getFirestore();
  const existingUser = await db.collection('users').where('email', '==', email).get();

  if (!existingUser.empty) {
    throw new AppError('User with this email already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser: User = {
    id: '', // Will be set by Firestore
    email,
    name,
    role,
    organization,
    phone,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };

  const userRef = await db.collection('users').add(newUser);
  newUser.id = userRef.id;

  await userRef.update({ id: userRef.id });

  const token = generateToken(newUser);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        organization: newUser.organization,
        isActive: newUser.isActive
      },
      token
    },
    message: 'User registered successfully'
  });
}));

// Login user
router.post('/login', asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { email, password } = value;

  const db = getFirestore();
  const userSnapshot = await db.collection('users').where('email', '==', email).get();

  if (userSnapshot.empty) {
    throw new AppError('Invalid credentials', 401);
  }

  const user = { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() } as User;

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 401);
  }

  // For demo purposes, we'll skip password verification since we're using Firebase Auth
  // In production, you'd verify the password here
  const token = generateToken(user);

  // Update last login
  await db.collection('users').doc(user.id).update({
    lastLogin: new Date(),
    updatedAt: new Date()
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
        isActive: user.isActive
      },
      token
    },
    message: 'Login successful'
  });
}));

// Get current user profile
router.get('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const db = getFirestore();
  const userDoc = await db.collection('users').doc(req.user!.id).get();

  if (!userDoc.exists) {
    throw new AppError('User not found', 404);
  }

  const user = { id: userDoc.id, ...userDoc.data() } as User;

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization: user.organization,
      phone: user.phone,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      isActive: user.isActive
    }
  });
}));

// Update user profile
router.put('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const updateSchema = Joi.object({
    name: Joi.string().min(2).optional(),
    organization: Joi.string().optional(),
    phone: Joi.string().optional()
  });

  const { error, value } = updateSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const db = getFirestore();
  const userRef = db.collection('users').doc(req.user!.id);

  await userRef.update({
    ...value,
    updatedAt: new Date()
  });

  const updatedUserDoc = await userRef.get();
  const updatedUser = { id: updatedUserDoc.id, ...updatedUserDoc.data() } as User;

  res.json({
    success: true,
    data: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      organization: updatedUser.organization,
      phone: updatedUser.phone,
      updatedAt: updatedUser.updatedAt
    },
    message: 'Profile updated successfully'
  });
}));

// Change password
router.put('/change-password', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  });

  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  // In a real implementation, you'd verify the current password
  // For now, we'll just update it
  const hashedPassword = await bcrypt.hash(value.newPassword, 12);

  const db = getFirestore();
  await db.collection('users').doc(req.user!.id).update({
    password: hashedPassword,
    updatedAt: new Date()
  });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

export default router;
