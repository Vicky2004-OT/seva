import { Router, Response } from 'express';
import { getFirestore } from '../config/firebase';
import { Survey, SurveyStatus, QuestionType, ApiResponse, User, UserRole, PaginatedResponse } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createSurveySchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().optional(),
  questions: Joi.array().items(
    Joi.object({
      type: Joi.string().valid(...Object.values(QuestionType)).required(),
      title: Joi.string().min(1).required(),
      description: Joi.string().optional(),
      required: Joi.boolean().default(false),
      options: Joi.array().items(Joi.string()).optional(),
      validation: Joi.object({
        min: Joi.number().optional(),
        max: Joi.number().optional(),
        pattern: Joi.string().optional()
      }).optional(),
      order: Joi.number().required()
    })
  ).required(),
  organization: Joi.string().optional(),
  expiresAt: Joi.date().optional(),
  isOfflineCapable: Joi.boolean().default(true),
  targetAudience: Joi.array().items(Joi.string()).optional(),
  location: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    address: Joi.string().optional()
  }).optional()
});

// Create new survey
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST, UserRole.NGO), asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const { error, value } = createSurveySchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const db = getFirestore();
  
  const newSurvey: Omit<Survey, 'id' | 'responses' | 'createdAt' | 'updatedAt'> = {
    ...value,
    createdBy: req.user!.id,
    responses: [],
    status: SurveyStatus.DRAFT
  };

  const surveyRef = await db.collection('surveys').add(newSurvey);
  const surveyId = surveyRef.id;

  await surveyRef.update({ 
    id: surveyId,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const createdSurvey = await surveyRef.get();
  const surveyData = { id: createdSurvey.id, ...createdSurvey.data() } as Survey;

  res.status(201).json({
    success: true,
    data: surveyData,
    message: 'Survey created successfully'
  });
}));

// Get all surveys (with pagination and filtering)
router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const db = getFirestore();
  let query: any = db.collection('surveys');

  // Filter by organization if user is NGO
  if (req.user!.role === UserRole.NGO && req.user!.organization) {
    query = query.where('organization', '==', req.user!.organization);
  }

  // Filter by status if provided
  if (req.query.status) {
    query = query.where('status', '==', req.query.status);
  }

  // Pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const snapshot = await query.orderBy('createdAt', 'desc').limit(limit).offset(skip).get();
  const totalSnapshot = await query.count().get();

  const surveys = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Survey));

  res.json({
    success: true,
    data: surveys,
    pagination: {
      page,
      limit,
      total: totalSnapshot.data().count,
      pages: Math.ceil(totalSnapshot.data().count / limit)
    }
  } as PaginatedResponse<Survey>);
}));

// Get survey by ID
router.get('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const db = getFirestore();
  const surveyDoc = await db.collection('surveys').doc(req.params.id).get();

  if (!surveyDoc.exists) {
    throw new AppError('Survey not found', 404);
  }

  const survey = { id: surveyDoc.id, ...surveyDoc.data() } as Survey;

  // Check permissions
  if (req.user!.role === UserRole.NGO && survey.organization !== req.user!.organization) {
    throw new AppError('Access denied', 403);
  }

  res.json({
    success: true,
    data: survey
  });
}));

// Update survey
router.put('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST, UserRole.NGO), asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const db = getFirestore();
  const surveyRef = db.collection('surveys').doc(req.params.id);
  const surveyDoc = await surveyRef.get();

  if (!surveyDoc.exists) {
    throw new AppError('Survey not found', 404);
  }

  const survey = { id: surveyDoc.id, ...surveyDoc.data() } as Survey;

  // Check permissions
  if (req.user!.role === UserRole.NGO && survey.organization !== req.user!.organization) {
    throw new AppError('Access denied', 403);
  }

  if (survey.status === SurveyStatus.PUBLISHED) {
    throw new AppError('Cannot update published survey', 400);
  }

  const { error, value } = createSurveySchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  await surveyRef.update({
    ...value,
    updatedAt: new Date()
  });

  const updatedSurvey = await surveyRef.get();
  const surveyData = { id: updatedSurvey.id, ...updatedSurvey.data() } as Survey;

  res.json({
    success: true,
    data: surveyData,
    message: 'Survey updated successfully'
  });
}));

// Publish survey
router.post('/:id/publish', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST, UserRole.NGO), asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const db = getFirestore();
  const surveyRef = db.collection('surveys').doc(req.params.id);
  const surveyDoc = await surveyRef.get();

  if (!surveyDoc.exists) {
    throw new AppError('Survey not found', 404);
  }

  const survey = { id: surveyDoc.id, ...surveyDoc.data() } as Survey;

  // Check permissions
  if (req.user!.role === UserRole.NGO && survey.organization !== req.user!.organization) {
    throw new AppError('Access denied', 403);
  }

  if (survey.status !== SurveyStatus.DRAFT) {
    throw new AppError('Only draft surveys can be published', 400);
  }

  await surveyRef.update({
    status: SurveyStatus.PUBLISHED,
    publishedAt: new Date(),
    updatedAt: new Date()
  });

  res.json({
    success: true,
    message: 'Survey published successfully'
  });
}));

// Close survey
router.post('/:id/close', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST, UserRole.NGO), asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const db = getFirestore();
  const surveyRef = db.collection('surveys').doc(req.params.id);
  const surveyDoc = await surveyRef.get();

  if (!surveyDoc.exists) {
    throw new AppError('Survey not found', 404);
  }

  const survey = { id: surveyDoc.id, ...surveyDoc.data() } as Survey;

  // Check permissions
  if (req.user!.role === UserRole.NGO && survey.organization !== req.user!.organization) {
    throw new AppError('Access denied', 403);
  }

  if (survey.status !== SurveyStatus.PUBLISHED) {
    throw new AppError('Only published surveys can be closed', 400);
  }

  await surveyRef.update({
    status: SurveyStatus.CLOSED,
    updatedAt: new Date()
  });

  res.json({
    success: true,
    message: 'Survey closed successfully'
  });
}));

// Delete survey
router.delete('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST), asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const db = getFirestore();
  const surveyDoc = await db.collection('surveys').doc(req.params.id).get();

  if (!surveyDoc.exists) {
    throw new AppError('Survey not found', 404);
  }

  const survey = { id: surveyDoc.id, ...surveyDoc.data() } as Survey;

  // Check permissions
  if (req.user!.role === UserRole.ANALYST && survey.createdBy !== req.user!.id) {
    throw new AppError('Access denied', 403);
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

export default router;
