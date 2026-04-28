# 🚀 Render Backend Deployment Guide

## 📋 Quick Setup (5 minutes)

### Step 1: Go to Render
1. Visit [Render.com](https://render.com)
2. Sign up with GitHub (recommended)

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. **Connect Repository**: Select `Vicky2004-OT/seva`
3. **Configure Service**:

#### Basic Settings:
- **Name**: `seva-sync-backend`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Instance Type**: `Free`

#### Build Settings:
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### Environment Variables:
```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-here-change-this
OPENROUTER_API_KEY=your-openrouter-api-key-here
FIREBASE_PROJECT_ID=seva-48f23
FIREBASE_CLIENT_EMAIL=demo@seva-48f23.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\nxhXctbdgZcfwxh6Y685RtXhiaaKqjOXQ5fKA/Q1YP+1+uYzxqnnnjVy3+kRBmIFc\nT6i2t6/t8A==\n-----END PRIVATE KEY-----"
FIREBASE_DATABASE_URL=https://seva-48f23.firebaseio.com
```

### Step 3: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (2-3 minutes)
3. Get your backend URL: `https://seva-sync-backend.onrender.com`

## 🔧 Update Frontend API URL

After your backend is deployed, update your frontend to point to the new backend URL:

### Option 1: Update Firebase Hosting
```bash
# Update frontend environment variable
firebase hosting:config:set VITE_API_URL=https://seva-sync-backend.onrender.com/api
firebase deploy --only hosting
```

### Option 2: Manual Update
1. Go to Firebase Console → Hosting
2. Update environment variables
3. Redeploy frontend

## 🧪 Test Your Platform

1. **Frontend**: https://seva-48f23.web.app
2. **Backend API**: https://seva-sync-backend.onrender.com/health
3. **Full Test**: Try registering a user on the frontend

## 🎉 Complete Platform URLs

- **Frontend**: https://seva-48f23.web.app
- **Backend API**: https://seva-sync-backend.onrender.com/api
- **Health Check**: https://seva-sync-backend.onrender.com/health

## 💰 Cost

- **Render Free Tier**: $0/month
- **Firebase Hosting**: $0/month
- **Total Cost**: $0/month (for moderate usage)

## 🆘 Troubleshooting

### Common Issues:
1. **Build fails**: Check `package.json` has correct scripts
2. **API not responding**: Check environment variables
3. **CORS errors**: Ensure frontend URL is allowed

### Quick Fixes:
- Check Render logs for errors
- Verify all environment variables are set
- Make sure backend starts successfully

Your SevaSync platform will be fully deployed and ready for humanitarian organizations! 🌍
