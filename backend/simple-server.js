const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic API routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'SevaSync API is working!', timestamp: new Date().toISOString() });
});

// Auth routes (simplified)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    // Mock registration - in production, save to Firebase
    res.json({ 
      success: true, 
      message: 'User registered successfully',
      user: { id: 'mock-user-id', email, name, role: role || 'field_worker' }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Mock login - in production, validate with Firebase
    res.json({ 
      success: true, 
      message: 'Login successful',
      token: 'mock-jwt-token',
      user: { id: 'mock-user-id', email, name: 'Test User', role: 'field_worker' }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Survey routes (simplified)
app.get('/api/surveys', (req, res) => {
  res.json({
    success: true,
    surveys: [
      {
        id: 'survey-1',
        title: 'Community Health Assessment',
        description: 'Basic health survey for community',
        status: 'published',
        createdAt: new Date().toISOString()
      }
    ]
  });
});

app.post('/api/surveys', async (req, res) => {
  try {
    const survey = req.body;
    res.json({
      success: true,
      message: 'Survey created successfully',
      survey: { ...survey, id: 'new-survey-id', createdAt: new Date().toISOString() }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

// Users route (simplified)
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    users: [
      {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'field_worker',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ]
  });
});

// Analytics route (simplified)
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalSurveys: 5,
      totalResponses: 120,
      activeUsers: 25,
      recentActivity: [
        { type: 'survey_created', timestamp: new Date().toISOString() },
        { type: 'user_registered', timestamp: new Date().toISOString() }
      ]
    }
  });
});

// AI Analytics route (simplified)
app.post('/api/ai/query', async (req, res) => {
  try {
    const { query } = req.body;
    res.json({
      success: true,
      response: `Based on the data, here's an analysis for: ${query}`,
      insights: [
        'Survey participation has increased by 20%',
        'Most responses come from urban areas',
        'Health-related questions have highest completion rates'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'AI query failed' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 SevaSync Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
});

module.exports = app;
