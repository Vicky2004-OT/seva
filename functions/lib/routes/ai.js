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
const types_2 = require("../types");
const axios_1 = __importDefault(require("axios"));
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
// Validation schemas
const querySchema = joi_1.default.object({
    query: joi_1.default.string().required(),
    surveyId: joi_1.default.string().optional(),
    context: joi_1.default.string().optional()
});
const generateInsightSchema = joi_1.default.object({
    surveyId: joi_1.default.string().required(),
    type: joi_1.default.string().valid(...Object.values(types_1.InsightType)).required(),
    parameters: joi_1.default.object().optional()
});
// OpenRouter.ai API integration
const callOpenRouterAI = async (prompt, context) => {
    var _a;
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new errorHandler_1.AppError('OpenRouter API key not configured', 500);
    }
    try {
        const response = await axios_1.default.post('https://openrouter.ai/api/v1/chat/completions', {
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
    }
    catch (error) {
        console.error('OpenRouter API error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new errorHandler_1.AppError('Failed to generate AI response', 500);
    }
};
// Natural language query
router.post('/query', auth_1.authenticate, (0, auth_1.authorize)(types_2.UserRole.ADMIN, types_2.UserRole.ANALYST), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { error, value } = querySchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.AppError(error.details[0].message, 400);
    }
    const { query, surveyId, context } = value;
    const db = (0, firebase_1.getFirestore)();
    let surveyData = '';
    if (surveyId) {
        const surveyDoc = await db.collection('surveys').doc(surveyId).get();
        if (!surveyDoc.exists) {
            throw new errorHandler_1.AppError('Survey not found', 404);
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
router.post('/insights', auth_1.authenticate, (0, auth_1.authorize)(types_2.UserRole.ADMIN, types_2.UserRole.ANALYST), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { error, value } = generateInsightSchema.validate(req.body);
    if (error) {
        throw new errorHandler_1.AppError(error.details[0].message, 400);
    }
    const { surveyId, type, parameters } = value;
    const db = (0, firebase_1.getFirestore)();
    const surveyDoc = await db.collection('surveys').doc(surveyId).get();
    if (!surveyDoc.exists) {
        throw new errorHandler_1.AppError('Survey not found', 404);
    }
    const responsesSnapshot = await db.collection('responses').where('surveyId', '==', surveyId).get();
    const responses = responsesSnapshot.docs.map(doc => doc.data());
    if (responses.length === 0) {
        throw new errorHandler_1.AppError('No responses found for this survey', 400);
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
        case types_1.InsightType.TREND:
            prompt = `Analyze trends in this humanitarian survey data. Identify patterns over time, demographic trends, and emerging issues.`;
            title = 'Trend Analysis';
            description = 'Analysis of trends and patterns in survey responses';
            break;
        case types_1.InsightType.ANOMALY:
            prompt = `Detect anomalies and outliers in this humanitarian survey data. Identify unusual responses or patterns that may require attention.`;
            title = 'Anomaly Detection';
            description = 'Detection of unusual patterns in survey data';
            break;
        case types_1.InsightType.PATTERN:
            prompt = `Identify significant patterns and correlations in this humanitarian survey data. Look for relationships between different variables.`;
            title = 'Pattern Analysis';
            description = 'Analysis of patterns and correlations in survey data';
            break;
        case types_1.InsightType.PREDICTION:
            prompt = `Based on this humanitarian survey data, provide predictions and forecasts for future trends or needs.`;
            title = 'Predictive Analysis';
            description = 'Predictions based on survey data trends';
            break;
        case types_1.InsightType.SUMMARY:
            prompt = `Provide a comprehensive summary of this humanitarian survey data. Highlight key findings, statistics, and important insights.`;
            title = 'Data Summary';
            description = 'Comprehensive summary of survey data';
            break;
        case types_1.InsightType.RECOMMENDATION:
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
        createdBy: req.user.id,
        parameters: parameters || {}
    };
    const insightRef = await db.collection('insights').add(insightData);
    await insightRef.update({ id: insightRef.id });
    res.json({
        success: true,
        data: Object.assign({ id: insightRef.id }, insightData),
        message: 'AI insight generated successfully'
    });
}));
// Get insights for a survey
router.get('/insights/:surveyId', auth_1.authenticate, (0, auth_1.authorize)(types_2.UserRole.ADMIN, types_2.UserRole.ANALYST), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    const insightsSnapshot = await db.collection('insights')
        .where('surveyId', '==', req.params.surveyId)
        .orderBy('generatedAt', 'desc')
        .get();
    const insights = insightsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    res.json({
        success: true,
        data: insights
    });
}));
// Delete an insight
router.delete('/insights/:id', auth_1.authenticate, (0, auth_1.authorize)(types_2.UserRole.ADMIN, types_2.UserRole.ANALYST), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    const insightDoc = await db.collection('insights').doc(req.params.id).get();
    if (!insightDoc.exists) {
        throw new errorHandler_1.AppError('Insight not found', 404);
    }
    const insight = Object.assign({ id: insightDoc.id }, insightDoc.data());
    // Check if user created the insight or is admin
    if (req.user.role !== types_2.UserRole.ADMIN && insight.createdBy !== req.user.id) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    await db.collection('insights').doc(req.params.id).delete();
    res.json({
        success: true,
        message: 'Insight deleted successfully'
    });
}));
exports.default = router;
