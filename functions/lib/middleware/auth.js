"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeSelfOrAdmin = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const firebase_1 = require("../config/firebase");
const types_1 = require("../types");
const errorHandler_1 = require("./errorHandler");
const authenticate = async (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            throw new errorHandler_1.AppError('Access denied. No token provided.', 401);
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const db = (0, firebase_1.getFirestore)();
        const userDoc = await db.collection('users').doc(decoded.userId).get();
        if (!userDoc.exists) {
            throw new errorHandler_1.AppError('User not found.', 404);
        }
        const userData = userDoc.data();
        if (!userData || !userData.isActive) {
            throw new errorHandler_1.AppError('Account is deactivated.', 401);
        }
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            organization: decoded.organization
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new errorHandler_1.AppError('Invalid token.', 401));
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            next(new errorHandler_1.AppError('Token expired.', 401));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('Authentication required.', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorHandler_1.AppError('Insufficient permissions.', 403));
        }
        next();
    };
};
exports.authorize = authorize;
const authorizeSelfOrAdmin = (req, res, next) => {
    if (!req.user) {
        return next(new errorHandler_1.AppError('Authentication required.', 401));
    }
    const targetUserId = req.params.userId || req.params.id;
    if (req.user.role === types_1.UserRole.ADMIN || req.user.id === targetUserId) {
        return next();
    }
    next(new errorHandler_1.AppError('Insufficient permissions.', 403));
};
exports.authorizeSelfOrAdmin = authorizeSelfOrAdmin;
