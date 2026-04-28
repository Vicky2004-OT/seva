const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic API routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'SevaSync API is working!', timestamp: new Date().toISOString() });
});

// Export as Firebase Function
exports.api = functions.https.onRequest(app);
