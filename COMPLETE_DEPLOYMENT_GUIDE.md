# 🚀 Complete SevaSync Deployment Guide

## 📋 Overview
This guide will walk you through deploying your SevaSync humanitarian data collection platform from scratch using:
- **Firebase** - Database & Authentication
- **Render** - Backend hosting
- **Vercel** - Frontend hosting

---

## 🔥 Step 1: Firebase Setup (Database & Auth)

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `seva-sync-production`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Firebase Services
1. In Firebase Console, go to "Build" section
2. Enable **Firestore Database**
   - Click "Create database"
   - Choose "Start in test mode" (for now)
   - Select a location (choose closest to your users)
3. Enable **Authentication**
   - Click "Get started"
   - Enable "Email/Password" sign-in method

### 1.3 Get Firebase Credentials
1. Go to Project Settings ⚙️
2. Under "Service accounts", click "Generate new private key"
3. Download the JSON file
4. Open the file and copy these values:
   - `project_id`
   - `client_email` 
   - `private_key`

### 1.4 Get Database URL
1. Go to Firestore Database
2. Click the settings icon ⚙️ next to "Firestore Database"
3. Copy the "Database URL" (looks like: `https://your-project-id.firebaseio.com`)

---

## 🎨 Step 2: Frontend Deployment (Vercel)

### 2.1 Prepare Frontend for Deployment
```bash
cd frontend
```

### 2.2 Create Vercel Account
1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub (recommended)
3. Click "New Project"

### 2.3 Deploy Frontend
1. **Import Repository**: Select your GitHub repository
2. **Framework Preset**: Vite should be detected automatically
3. **Environment Variables** (in Vercel dashboard):
   ```
   VITE_API_URL=https://your-backend-name.onrender.com/api
   VITE_OPENROUTER_API_KEY=your-openrouter-api-key
   ```
4. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Click "Deploy"

### 2.4 Get Frontend URL
After deployment, Vercel will give you a URL like:
`https://seva-sync-frontend.vercel.app`

---

## 🚀 Step 3: Backend Deployment (Render)

### 3.1 Prepare Backend for Deployment
```bash
cd backend
```

### 3.2 Create Render Account
1. Go to [Render](https://render.com)
2. Sign up with GitHub (recommended)

### 3.3 Deploy Backend
1. **Create New Web Service**
2. **Connect Repository**: Select your GitHub repository
3. **Configure Service**:
   - **Name**: `seva-sync-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (to start)

### 3.4 Add Environment Variables (in Render dashboard)
```
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Actual-Private-Key-Here\n-----END PRIVATE KEY-----"
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-this-to-something-secure
JWT_EXPIRES_IN=7d

# OpenRouter.ai Configuration
OPENROUTER_API_KEY=your-openrouter-api-key

# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 3.5 Get Backend URL
After deployment, Render will give you a URL like:
`https://seva-sync-backend.onrender.com`

---

## 🔧 Step 4: Update Configuration Files

### 4.1 Update Frontend Environment
Go to your Vercel dashboard and update:
```
VITE_API_URL=https://seva-sync-backend.onrender.com/api
```

### 4.2 Update Backend CORS
In your Render environment variables, ensure:
```
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

---

## 🧪 Step 5: Test Your Deployed Application

### 5.1 Test Backend
1. Go to your backend URL + `/health`
   - Example: `https://seva-sync-backend.onrender.com/health`
2. You should see: `{"status": "ok", "timestamp": "..."}`

### 5.2 Test Frontend
1. Go to your frontend URL
2. Try to register a new user
3. Try to login
4. Create a test survey

---

## 📊 Step 6: OpenRouter.ai Setup

### 6.1 Get OpenRouter API Key
1. Go to [OpenRouter.ai](https://openrouter.ai)
2. Sign up and get your API key
3. Add it to your Render environment variables:
   ```
   OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key
   ```

### 6.2 Test AI Features
1. In your deployed app, go to AI Analytics
2. Try asking a question about your data
3. Verify the AI response works

---

## 🔒 Step 7: Security & Best Practices

### 7.1 Update Firebase Security Rules
In Firebase Console > Firestore Database > Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Survey access based on user role and organization
    match /surveys/{surveyId} {
      allow read, write: if request.auth != null && (
        resource.data.createdBy == request.auth.uid ||
        request.auth.token.role in ['admin', 'analyst'] ||
        (request.auth.token.role == 'ngo' && resource.data.organization == request.auth.token.organization)
      );
    }
  }
}
```

### 7.2 Enable Firebase Production Mode
1. Go to Firestore Database
2. Click "Rules" tab
3. Change from test mode to production rules
4. Click "Publish"

---

## 📱 Step 8: Mobile Optimization (Optional)

### 8.1 Add PWA Features
```bash
cd frontend
npm install @vitejs/plugin-pwa
```

### 8.2 Update Vite Config
Add PWA plugin to `vite.config.ts` for mobile app-like experience.

---

## 🎯 Step 9: Go Live!

### 9.1 Final Checklist
- [ ] Backend URL is accessible
- [ ] Frontend URL loads properly  
- [ ] User registration works
- [ ] Survey creation works
- [ ] AI analytics works
- [ ] Environment variables are set
- [ ] Firebase rules are secure

### 9.2 Share Your Platform
Your SevaSync platform is now live! Share the URLs:
- **Frontend**: `https://your-frontend-domain.vercel.app`
- **Backend API**: `https://your-backend-name.onrender.com/api`

---

## 🆘 Troubleshooting

### Common Issues & Solutions

**Issue**: "Firebase connection failed"
- **Solution**: Double-check your Firebase credentials in Render environment variables

**Issue**: "CORS errors"
- **Solution**: Ensure FRONTEND_URL in Render matches your Vercel domain exactly

**Issue**: "Build failed on Render"
- **Solution**: Check that your `package.json` has the correct build scripts

**Issue**: "AI analytics not working"
- **Solution**: Verify your OpenRouter API key is correct and has credits

---

## 💰 Cost Summary

### Free Tier Usage:
- **Render**: 750 hours/month (Free tier)
- **Vercel**: 100GB bandwidth/month (Free tier)
- **Firebase**: 1GB storage, 50K reads/day (Free tier)
- **OpenRouter.ai**: Pay per use (usually $5-10/month for moderate usage)

### Estimated Monthly Costs:
- **Development**: $0 (all free tiers)
- **Production**: $5-20/month depending on usage

---

## 🎉 You're Live!

Your SevaSync humanitarian data collection platform is now deployed and ready to help organizations collect and analyze field data efficiently!

**Next Steps**:
1. Test all features thoroughly
2. Add your organization's branding
3. Train field workers on how to use the platform
4. Monitor usage and scale as needed

**Need Help?** - Check the Render and Vercel documentation for advanced configurations.
