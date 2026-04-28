import { Router, Response } from 'express';
import { getFirestore } from '../config/firebase';
import { ApiResponse, InsightType } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';
import axios from 'axios';
import Joi from 'joi';

const router = Router();

// Validation schemas
const querySchema = Joi.object({
  query: Joi.string().required(),
  surveyId: Joi.string().optional(),
  context: Joi.string().optional()
});

const generateInsightSchema = Joi.object({
  surveyId: Joi.string().required(),
  type: Joi.string().valid(...Object.values(InsightType)).required(),
  parameters: Joi.object().optional()
});

// OpenRouter.ai API integration
const callOpenRouterAI = async (prompt: string, context?: string) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AppError('OpenRouter API key not configured', 500);
  }

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'anthropic/claude-3-haiku',
      messages: [
        {
          role: 'system',
          content: context || 'You are an AI assistant helping analyze humanitarian survey data. Provide insights and analysis based on the given data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    throw new AppError('Failed to generate AI response', 500);
  }
};

// Natural language query
router.post('/query', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST), asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const { error, value } = querySchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { query, surveyId, context } = value;
  const db = getFirestore();

  let surveyData = '';
  if (surveyId) {
    const surveyDoc = await db.collection('surveys').doc(surveyId).get();
    if (!surveyDoc.exists) {
      throw new AppError('Survey not found', 404);
    }
    
    const responsesSnapshot = await db.collection('responses').where('surveyId', '==', surveyId).get();
    const responses = responsesSnapshot.docs.map(doc => doc.data());
    
    surveyData = JSON.stringify({
      survey: surveyDoc.data(),
      responses: responses,
      totalResponses: responses.length
    }, null, 2);
  }

  const prompt = `
Humanitarian Data Analysis Query: ${query}

${surveyData ? `Survey Data: ${surveyData}` : 'No specific survey data provided.'}

Please provide a comprehensive analysis and insights based on this query and data. Focus on humanitarian impact, trends, patterns, and actionable recommendations.
  `;

  const aiResponse = await callOpenRouterAI(prompt, context);

  res.json({
    success: true,
    data: {
      query,
      response: aiResponse,
      surveyId,
      timestamp: new Date().toISOString()
    }
  });
}));

// Generate AI insights for a survey
router.post('/insights', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST), asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const { error, value } = generateInsightSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { surveyId, type, parameters } = value;
  const db = getFirestore();

  const surveyDoc = await db.collection('surveys').doc(surveyId).get();
  if (!surveyDoc.exists) {
    throw new AppError('Survey not found', 404);
  }

  const responsesSnapshot = await db.collection('responses').where('surveyId', '==', surveyId).get();
  const responses = responsesSnapshot.docs.map(doc => doc.data());

  if (responses.length === 0) {
    throw new AppError('No responses found for this survey', 400);
  }

  const surveyData = {
    survey: surveyDoc.data(),
    responses: responses,
    totalResponses: responses.length
  };

  let prompt = '';
  let title = '';
  let description = '';

  switch (type) {
    case InsightType.TREND:
      prompt = `Analyze trends in this humanitarian survey data. Identify patterns over time, demographic trends, and emerging issues.`;
      title = 'Trend Analysis';
      description = 'Analysis of trends and patterns in survey responses';
      break;
    case InsightType.ANOMALY:
      prompt = `Detect anomalies and outliers in this humanitarian survey data. Identify unusual responses or patterns that may require attention.`;
      title = 'Anomaly Detection';
      description = 'Detection of unusual patterns in survey data';
      break;
    case InsightType.PATTERN:
      prompt = `Identify significant patterns and correlations in this humanitarian survey data. Look for relationships between different variables.`;
      title = 'Pattern Analysis';
      description = 'Analysis of patterns and correlations in survey data';
      break;
    case InsightType.PREDICTION:
      prompt = `Based on this humanitarian survey data, provide predictions and forecasts for future trends or needs.`;
      title = 'Predictive Analysis';
      description = 'Predictions based on survey data trends';
      break;
    case InsightType.SUMMARY:
      prompt = `Provide a comprehensive summary of this humanitarian survey data. Highlight key findings, statistics, and important insights.`;
      title = 'Data Summary';
      description = 'Comprehensive summary of survey data';
      break;
    case InsightType.RECOMMENDATION:
      prompt = `Based on this humanitarian survey data, provide actionable recommendations for humanitarian organizations and field operations.`;
      title = 'Recommendations';
      description = 'Actionable recommendations based on survey data';
      break;
  }

  if (parameters) {
    prompt += ` Additional parameters: ${JSON.stringify(parameters)}`;
  }

  const aiResponse = await callOpenRouterAI(prompt, JSON.stringify(surveyData, null, 2));

  // Save insight to database
  const insightData = {
    surveyId,
    type,
    title,
    description,
    response: aiResponse,
    confidence: 0.85, // Placeholder confidence score
    generatedAt: new Date(),
    createdBy: req.user!.id,
    parameters: parameters || {}
  };

  const insightRef = await db.collection('insights').add(insightData);
  await insightRef.update({ id: insightRef.id });

  res.json({
    success: true,
    data: {
      id: insightRef.id,
      ...insightData
    },
    message: 'AI insight generated successfully'
  });
}));

// Get insights for a survey
router.get('/insights/:surveyId', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST), asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const db = getFirestore();
  const insightsSnapshot = await db.collection('insights')
    .where('surveyId', '==', req.params.surveyId)
    .orderBy('generatedAt', 'desc')
    .get();

  const insights = insightsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  res.json({
    success: true,
    data: insights
  });
}));

// Delete an insight
router.delete('/insights/:id', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST), asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const db = getFirestore();
  const insightDoc = await db.collection('insights').doc(req.params.id).get();

  if (!insightDoc.exists) {
    throw new AppError('Insight not found', 404);
  }

  const insight = { id: insightDoc.id, ...insightDoc.data() } as any;

  // Check if user created the insight or is admin
  if (req.user!.role !== UserRole.ADMIN && insight.createdBy !== req.user!.id) {
    throw new AppError('Access denied', 403);
  }

  await db.collection('insights').doc(req.params.id).delete();

  res.json({
    success: true,
    message: 'Insight deleted successfully'
  });
}));

export default router;
