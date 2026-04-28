# SevaSync Deployment Guide

## Backend Deployment (Render)

1. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your Firebase and OpenRouter.ai credentials
   ```

2. **Deploy to Render**
   - Create Render account
   - Connect GitHub repository
   - Use `render.yaml` configuration
   - Set environment variables in Render dashboard

## Frontend Deployment (Vercel)

1. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Deploy to Vercel**
   - Create Vercel account
   - Connect GitHub repository
   - Use `vercel.json` configuration
   - Set environment variables in Vercel dashboard

## Environment Variables

### Backend (.env)
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_CLIENT_EMAIL`: Service account email
- `FIREBASE_PRIVATE_KEY`: Firebase private key
- `FIREBASE_DATABASE_URL`: Firestore database URL
- `JWT_SECRET`: JWT secret key
- `JWT_EXPIRES_IN`: Token expiration (default: 7d)
- `OPENROUTER_API_KEY`: OpenRouter.ai API key
- `FRONTEND_URL`: Frontend URL for CORS

### Frontend (Vercel)
- `VITE_API_URL`: Backend API URL
- `VITE_OPENROUTER_API_KEY`: OpenRouter.ai API key

## Firebase Setup

1. Create Firebase project
2. Enable Firestore Database
3. Create service account
4. Download service account key
5. Update backend environment variables
