import admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = (): void => {
  if (firebaseApp) {
    return;
  }

  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'demo@demo-project.iam.gserviceaccount.com',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
xhXctbdgZcfwxh6Y685RtXhiaaKqjOXQ5fKA/Q1YP+1+uYzxqnnnjVy3+kRBmIFc
T6i2t6/t8A==
-----END PRIVATE KEY-----`,
  };

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
};

export const getFirestore = (): admin.firestore.Firestore => {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin.firestore();
};

export const getAuth = (): admin.auth.Auth => {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin.auth();
};

export default firebaseApp;
