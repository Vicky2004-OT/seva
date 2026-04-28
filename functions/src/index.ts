import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';

// Import your existing routes
import authRoutes from './routes/auth';
import surveyRoutes from './routes/surveys';
import userRoutes from './routes/users';
import aiRoutes from './routes/ai';
import statsRoutes from './routes/stats';

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export as Firebase Function
export const api = functions.https.onRequest(app);
