"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const types_1 = require("../types");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
// Get all users (admin only)
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    let query = db.collection('users');
    // Filter by role if provided
    if (req.query.role) {
        query = query.where('role', '==', req.query.role);
    }
    // Filter by organization if provided
    if (req.query.organization) {
        query = query.where('organization', '==', req.query.organization);
    }
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const snapshot = await query.orderBy('createdAt', 'desc').limit(limit).offset(skip).get();
    const totalSnapshot = await query.count().get();
    const users = snapshot.docs.map((doc) => {
        const userData = Object.assign({ id: doc.id }, doc.data());
        // Remove sensitive data
        const _a = userData, { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
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
    });
}));
// Get user by ID
router.get('/:id', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    const userDoc = await db.collection('users').doc(req.params.id).get();
    if (!userDoc.exists) {
        throw new errorHandler_1.AppError('User not found', 404);
    }
    const user = Object.assign({ id: userDoc.id }, userDoc.data());
    // Check permissions (admin can see any user, others can only see themselves)
    if (req.user.role !== types_1.UserRole.ADMIN && req.user.id !== req.params.id) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    // Remove sensitive data
    const _a = user, { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
    res.json({
        success: true,
        data: userWithoutPassword
    });
}));
// Update user (admin can update any user, others can only update themselves)
router.put('/:id', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    const userRef = db.collection('users').doc(req.params.id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new errorHandler_1.AppError('User not found', 404);
    }
    // Check permissions
    if (req.user.role !== types_1.UserRole.ADMIN && req.user.id !== req.params.id) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    const updateSchema = joi_1.default.object({
        name: joi_1.default.string().min(2).optional(),
        organization: joi_1.default.string().optional(),
        phone: joi_1.default.string().optional(),
        role: joi_1.default.string().valid(...Object.values(types_1.UserRole)).optional(),
        isActive: joi_1.default.boolean().optional()
    });
    const { error, value } = updateSchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.AppError(error.details[0].message, 400);
    }
    // Only admin can change role and isActive status
    if (req.user.role !== types_1.UserRole.ADMIN) {
        delete value.role;
        delete value.isActive;
    }
    await userRef.update(Object.assign(Object.assign({}, value), { updatedAt: new Date() }));
    const updatedUserDoc = await userRef.get();
    const updatedUser = Object.assign({ id: updatedUserDoc.id }, updatedUserDoc.data());
    // Remove sensitive data
    const _a = updatedUser, { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
    res.json({
        success: true,
        data: userWithoutPassword,
        message: 'User updated successfully'
    });
}));
// Deactivate user (admin only)
router.post('/:id/deactivate', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    const userRef = db.collection('users').doc(req.params.id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new errorHandler_1.AppError('User not found', 404);
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
router.post('/:id/activate', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    const userRef = db.collection('users').doc(req.params.id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new errorHandler_1.AppError('User not found', 404);
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
exports.default = router;
