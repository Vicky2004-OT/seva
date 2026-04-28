"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const router = (0, express_1.Router)();
// Get overall platform statistics
router.get('/', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    // Get total counts
    const [surveysSnapshot, responsesSnapshot, usersSnapshot, insightsSnapshot] = await Promise.all([
        db.collection('surveys').count().get(),
        db.collection('responses').count().get(),
        db.collection('users').count().get(),
        db.collection('insights').count().get()
    ]);
    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsersSnapshot = await db.collection('users')
        .where('lastLogin', '>=', thirtyDaysAgo)
        .where('isActive', '==', true)
        .count()
        .get();
    // Get survey status breakdown
    const allSurveys = await db.collection('surveys').get();
    const surveyStats = allSurveys.docs.reduce((acc, doc) => {
        const status = doc.data().status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSurveys = await db.collection('surveys')
        .where('createdAt', '>=', sevenDaysAgo)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
    const recentResponses = await db.collection('responses')
        .where('submittedAt', '>=', sevenDaysAgo)
        .orderBy('submittedAt', 'desc')
        .limit(5)
        .get();
    const recentUsers = await db.collection('users')
        .where('createdAt', '>=', sevenDaysAgo)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
    const recentActivity = [
        ...recentSurveys.docs.map(doc => ({
            id: doc.id,
            type: 'survey_created',
            description: `Survey "${doc.data().title}" was created`,
            timestamp: doc.data().createdAt,
            userId: doc.data().createdBy
        })),
        ...recentResponses.docs.map(doc => ({
            id: doc.id,
            type: 'response_submitted',
            description: `New response submitted for survey`,
            timestamp: doc.data().submittedAt,
            userId: doc.data().respondentId
        })),
        ...recentUsers.docs.map(doc => ({
            id: doc.id,
            type: 'user_registered',
            description: `User "${doc.data().name}" registered`,
            timestamp: doc.data().createdAt,
            userId: doc.id
        }))
    ].sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime()).slice(0, 10);
    // Calculate response rate
    const publishedSurveys = await db.collection('surveys')
        .where('status', '==', 'published')
        .get();
    let totalPotentialResponses = 0;
    for (const survey of publishedSurveys.docs) {
        const responseCount = await db.collection('responses')
            .where('surveyId', '==', survey.id)
            .count()
            .get();
        totalPotentialResponses += responseCount.data().count;
    }
    const responseRate = publishedSurveys.size > 0
        ? (totalPotentialResponses / publishedSurveys.size) * 100
        : 0;
    // Get organization statistics
    const orgSnapshot = await db.collection('users')
        .where('organization', '!=', null)
        .get();
    const organizations = new Set();
    orgSnapshot.docs.forEach(doc => {
        if (doc.data().organization) {
            organizations.add(doc.data().organization);
        }
    });
    const stats = {
        totalSurveys: surveysSnapshot.data().count,
        totalResponses: responsesSnapshot.data().count,
        totalUsers: usersSnapshot.data().count,
        activeUsers: activeUsersSnapshot.data().count,
        organizationsCount: organizations.size,
        totalInsights: insightsSnapshot.data().count,
        surveyStats,
        responseRate: Math.round(responseRate * 100) / 100,
        recentActivity: recentActivity.map(activity => (Object.assign(Object.assign({}, activity), { timestamp: activity.timestamp.toDate ? activity.timestamp.toDate() : activity.timestamp })))
    };
    res.json({
        success: true,
        data: stats
    });
}));
// Get survey-specific statistics
router.get('/survey/:id', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    const surveyId = req.params.id;
    const surveyDoc = await db.collection('surveys').doc(surveyId).get();
    if (!surveyDoc.exists) {
        throw new errorHandler_1.AppError('Survey not found', 404);
    }
    const survey = Object.assign({ id: surveyDoc.id }, surveyDoc.data());
    // Get all responses for this survey
    const responsesSnapshot = await db.collection('responses')
        .where('surveyId', '==', surveyId)
        .get();
    const responses = responsesSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    // Calculate completion statistics
    const totalQuestions = survey.questions.length;
    const completionStats = responses.reduce((acc, response) => {
        const answeredQuestions = response.answers.length;
        const completionRate = (answeredQuestions / totalQuestions) * 100;
        acc.totalAnswers += answeredQuestions;
        acc.completionRates.push(completionRate);
        return acc;
    }, { totalAnswers: 0, completionRates: [] });
    const avgCompletionRate = completionStats.completionRates.length > 0
        ? completionStats.completionRates.reduce((sum, rate) => sum + rate, 0) / completionStats.completionRates.length
        : 0;
    // Get daily response trends
    const dailyResponses = responses.reduce((acc, response) => {
        const date = response.submittedAt.toDate ?
            response.submittedAt.toDate().toISOString().split('T')[0] :
            new Date(response.submittedAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});
    // Get question-wise statistics
    const questionStats = survey.questions.map((question) => {
        const answers = responses
            .map(response => response.answers.find((answer) => answer.questionId === question.id))
            .filter(answer => answer !== undefined);
        let stats = {
            questionId: question.id,
            title: question.title,
            type: question.type,
            totalResponses: answers.length,
            skipRate: ((responses.length - answers.length) / responses.length) * 100
        };
        if (question.type === 'multiple_choice' || question.type === 'checkbox') {
            const optionCounts = answers.reduce((acc, answer) => {
                const value = Array.isArray(answer.value) ? answer.value : [answer.value];
                value.forEach((val) => {
                    acc[val] = (acc[val] || 0) + 1;
                });
                return acc;
            }, {});
            stats.optionDistribution = optionCounts;
        }
        else if (question.type === 'number' || question.type === 'rating') {
            const values = answers.map(answer => parseFloat(answer.value)).filter(val => !isNaN(val));
            if (values.length > 0) {
                stats.numericStats = {
                    min: Math.min(...values),
                    max: Math.max(...values),
                    average: values.reduce((sum, val) => sum + val, 0) / values.length,
                    median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)]
                };
            }
        }
        return stats;
    });
    // Get location statistics
    const locationStats = responses
        .filter(response => response.location)
        .reduce((acc, response) => {
        const location = response.location;
        const key = `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    const stats = {
        survey: {
            id: survey.id,
            title: survey.title,
            status: survey.status,
            createdAt: survey.createdAt,
            publishedAt: survey.publishedAt
        },
        responses: {
            total: responses.length,
            avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
            dailyTrends: dailyResponses
        },
        questions: questionStats,
        locations: locationStats,
        offlineStats: {
            offlineResponses: responses.filter(r => r.isOffline).length,
            onlineResponses: responses.filter(r => !r.isOffline).length
        }
    };
    res.json({
        success: true,
        data: stats
    });
}));
// Get user-specific statistics
router.get('/user/:id', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const db = (0, firebase_1.getFirestore)();
    const userId = req.params.id;
    // Check permissions (admin can see any user, others can only see themselves)
    if (req.user.role !== types_1.UserRole.ADMIN && req.user.id !== userId) {
        throw new errorHandler_1.AppError('Access denied', 403);
    }
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
        throw new errorHandler_1.AppError('User not found', 404);
    }
    const user = Object.assign({ id: userDoc.id }, userDoc.data());
    // Get surveys created by user
    const surveysSnapshot = await db.collection('surveys')
        .where('createdBy', '==', userId)
        .get();
    const surveys = surveysSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    // Get responses submitted by user
    const responsesSnapshot = await db.collection('responses')
        .where('respondentId', '==', userId)
        .get();
    const responses = responsesSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    // Get insights generated by user
    const insightsSnapshot = await db.collection('insights')
        .where('createdBy', '==', userId)
        .get();
    const insights = insightsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    const stats = {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        },
        surveys: {
            total: surveys.length,
            published: surveys.filter(s => s.status === 'published').length,
            draft: surveys.filter(s => s.status === 'draft').length,
            closed: surveys.filter(s => s.status === 'closed').length
        },
        responses: {
            total: responses.length,
            offline: responses.filter(r => r.isOffline).length,
            online: responses.filter(r => !r.isOffline).length
        },
        insights: {
            total: insights.length,
            byType: insights.reduce((acc, insight) => {
                acc[insight.type] = (acc[insight.type] || 0) + 1;
                return acc;
            }, {})
        }
    };
    res.json({
        success: true,
        data: stats
    });
}));
exports.default = router;
//# sourceMappingURL=stats_broken.js.map