"use strict";
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
// Validation schemas
const createSurveySchema = joi_1.default.object({
    title: joi_1.default.string().min(3).required(),
    description: joi_1.default.string().optional(),
    questions: joi_1.default.array().items(joi_1.default.object({
        type: joi_1.default.string().valid(...Object.values(types_1.QuestionType)).required(),
        title: joi_1.default.string().min(1).required(),
        description: joi_1.default.string().optional(),
        required: joi_1.default.boolean().default(false),
        options: joi_1.default.array().items(joi_1.default.string()).optional(),
        validation: joi_1.default.object({
            min: joi_1.default.number().optional(),
            max: joi_1.default.number().optional(),
            pattern: joi_1.default.string().optional()
        }).optional(),
        order: joi_1.default.number().required()
    })).required(),
    organization: joi_1.default.string().optional(),
    expiresAt: joi_1.default.date().optional(),
    isOfflineCapable: joi_1.default.boolean().default(true),
    targetAudience: joi_1.default.array().items(joi_1.default.string()).optional(),
    location: joi_1.default.object({
        latitude: joi_1.default.number().required(),
        longitude: joi_1.default.number().required(),
        address: joi_1.default.string().optional()
    }).optional()
});
// Create new survey
router.post('/', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.ANALYST, types_1.UserRole.NGO), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { error, value } = createSurveySchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.AppError(error.details[0].message, 400);
    }
    const db = (0, firebase_1.getFirestore)();
    const newSurvey = Object.assign(Object.assign({}, value), { createdBy: req.user.id, responses: [], status: types_1.SurveyStatus.DRAFT });
    const surveyRef = await db.collection('surveys').add(newSurvey);
    const surveyId = surveyRef.id;
    await surveyRef.update({
        id: surveyId,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    const createdSurvey = await surveyRef.get();
    const surveyData = Object.assign({ id: createdSurvey.id }, createdSurvey.data());
    res.status(201).json({
        success: true,
        data: surveyData,
        message: 'Survey created successfully'
    });
}));
// Get all surveys (with pagination and filtering)
router.get('/', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    let query = db.collection('surveys');
    // Filter by organization if user is NGO
    if (req.user.role === types_1.UserRole.NGO && req.user.organization) {
        query = query.where('organization', '==', req.user.organization);
    }
    // Filter by status if provided
    if (req.query.status) {
        query = query.where('status', '==', req.query.status);
    }
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const snapshot = await query.orderBy('createdAt', 'desc').limit(limit).offset(skip).get();
    const totalSnapshot = await query.count().get();
    const surveys = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    res.json({
        success: true,
        data: surveys,
        pagination: {
            page,
            limit,
            total: totalSnapshot.data().count,
            pages: Math.ceil(totalSnapshot.data().count / limit)
        }
    });
}));
// Get survey by ID
router.get('/:id', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    const surveyDoc = await db.collection('surveys').doc(req.params.id).get();
    if (!surveyDoc.exists) {
        throw new errorHandler_1.AppError('Survey not found', 404);
    }
    const survey = Object.assign({ id: surveyDoc.id }, surveyDoc.data());
    // Check permissions
    if (req.user.role === types_1.UserRole.NGO && survey.organization !== req.user.organization) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    res.json({
        success: true,
        data: survey
    });
}));
// Update survey
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.ANALYST, types_1.UserRole.NGO), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    const surveyRef = db.collection('surveys').doc(req.params.id);
    const surveyDoc = await surveyRef.get();
    if (!surveyDoc.exists) {
        throw new errorHandler_1.AppError('Survey not found', 404);
    }
    const survey = Object.assign({ id: surveyDoc.id }, surveyDoc.data());
    // Check permissions
    if (req.user.role === types_1.UserRole.NGO && survey.organization !== req.user.organization) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    if (survey.status === types_1.SurveyStatus.PUBLISHED) {
        throw new errorHandler_1.AppError('Cannot update published survey', 400);
    }
    const { error, value } = createSurveySchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.AppError(error.details[0].message, 400);
    }
    await surveyRef.update(Object.assign(Object.assign({}, value), { updatedAt: new Date() }));
    const updatedSurvey = await surveyRef.get();
    const surveyData = Object.assign({ id: updatedSurvey.id }, updatedSurvey.data());
    res.json({
        success: true,
        data: surveyData,
        message: 'Survey updated successfully'
    });
}));
// Publish survey
router.post('/:id/publish', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.ANALYST, types_1.UserRole.NGO), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    const surveyRef = db.collection('surveys').doc(req.params.id);
    const surveyDoc = await surveyRef.get();
    if (!surveyDoc.exists) {
        throw new errorHandler_1.AppError('Survey not found', 404);
    }
    const survey = Object.assign({ id: surveyDoc.id }, surveyDoc.data());
    // Check permissions
    if (req.user.role === types_1.UserRole.NGO && survey.organization !== req.user.organization) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    if (survey.status !== types_1.SurveyStatus.DRAFT) {
        throw new errorHandler_1.AppError('Only draft surveys can be published', 400);
    }
    await surveyRef.update({
        status: types_1.SurveyStatus.PUBLISHED,
        publishedAt: new Date(),
        updatedAt: new Date()
    });
    res.json({
        success: true,
        message: 'Survey published successfully'
    });
}));
// Close survey
router.post('/:id/close', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.ANALYST, types_1.UserRole.NGO), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    const surveyRef = db.collection('surveys').doc(req.params.id);
    const surveyDoc = await surveyRef.get();
    if (!surveyDoc.exists) {
        throw new errorHandler_1.AppError('Survey not found', 404);
    }
    const survey = Object.assign({ id: surveyDoc.id }, surveyDoc.data());
    // Check permissions
    if (req.user.role === types_1.UserRole.NGO && survey.organization !== req.user.organization) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    if (survey.status !== types_1.SurveyStatus.PUBLISHED) {
        throw new errorHandler_1.AppError('Only published surveys can be closed', 400);
    }
    await surveyRef.update({
        status: types_1.SurveyStatus.CLOSED,
        updatedAt: new Date()
    });
    res.json({
        success: true,
        message: 'Survey closed successfully'
    });
}));
// Delete survey
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.ANALYST), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    const surveyDoc = await db.collection('surveys').doc(req.params.id).get();
    if (!surveyDoc.exists) {
        throw new errorHandler_1.AppError('Survey not found', 404);
    }
    const survey = Object.assign({ id: surveyDoc.id }, surveyDoc.data());
    // Check permissions
    if (req.user.role === types_1.UserRole.ANALYST && survey.createdBy !== req.user.id) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    // Delete survey and all related responses
    await db.collection('surveys').doc(req.params.id).delete();
    // Delete responses
    const responsesSnapshot = await db.collection('responses').where('surveyId', '==', req.params.id).get();
    const deletePromises = responsesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    res.json({
        success: true,
        message: 'Survey deleted successfully'
    });
}));
exports.default = router;
