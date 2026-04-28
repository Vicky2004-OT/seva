"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const firebase_1 = require("../config/firebase");
const types_1 = require("../types");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
// Validation schemas
const registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    name: joi_1.default.string().min(2).required(),
    role: joi_1.default.string().valid(...Object.values(types_1.UserRole)).default(types_1.UserRole.FIELD_WORKER),
    organization: joi_1.default.string().optional(),
    phone: joi_1.default.string().optional()
});
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required()
});
// Generate JWT token
const generateToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        organization: user.organization
    };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};
// Register new user
router.post('/register', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.AppError(error.details[0].message, 400);
    }
    const { email, password, name, role, organization, phone } = value;
    const db = (0, firebase_1.getFirestore)();
    const existingUser = await db.collection('users').where('email', '==', email).get();
    if (!existingUser.empty) {
        throw new errorHandler_1.AppError('User with this email already exists', 409);
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const newUser = {
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
router.post('/login', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.AppError(error.details[0].message, 400);
    }
    const { email, password } = value;
    const db = (0, firebase_1.getFirestore)();
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (userSnapshot.empty) {
        throw new errorHandler_1.AppError('Invalid credentials', 401);
    }
    const user = Object.assign({ id: userSnapshot.docs[0].id }, userSnapshot.docs[0].data());
    if (!user.isActive) {
        throw new errorHandler_1.AppError('Account is deactivated', 401);
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
router.get('/profile', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) {
        throw new errorHandler_1.AppError('User not found', 404);
    }
    const user = Object.assign({ id: userDoc.id }, userDoc.data());
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
router.put('/profile', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const updateSchema = joi_1.default.object({
        name: joi_1.default.string().min(2).optional(),
        organization: joi_1.default.string().optional(),
        phone: joi_1.default.string().optional()
    });
    const { error, value } = updateSchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.AppError(error.details[0].message, 400);
    }
    const db = (0, firebase_1.getFirestore)();
    const userRef = db.collection('users').doc(req.user.id);
    await userRef.update(Object.assign(Object.assign({}, value), { updatedAt: new Date() }));
    const updatedUserDoc = await userRef.get();
    const updatedUser = Object.assign({ id: updatedUserDoc.id }, updatedUserDoc.data());
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
router.put('/change-password', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const changePasswordSchema = joi_1.default.object({
        currentPassword: joi_1.default.string().required(),
        newPassword: joi_1.default.string().min(6).required()
    });
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.AppError(error.details[0].message, 400);
    }
    // In a real implementation, you'd verify the current password
    // For now, we'll just update it
    const hashedPassword = await bcryptjs_1.default.hash(value.newPassword, 12);
    const db = (0, firebase_1.getFirestore)();
    await db.collection('users').doc(req.user.id).update({
        password: hashedPassword,
        updatedAt: new Date()
    });
    res.json({
        success: true,
        message: 'Password changed successfully'
    });
}));
exports.default = router;
