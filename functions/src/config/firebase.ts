import admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = (): void => {
  if (firebaseApp) {
    return;
  }

  // For demo purposes, we'll use a mock configuration
  // In production, replace with actual Firebase credentials
  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: 'demo-project',
        clientEmail: 'demo@demo-project.iam.gserviceaccount.com',
        privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
xhXctbdgZcfwxh6Y685RtXhiaaKqjOXQ5fKA/Q1YP+1+uYzxqnnnjVy3+kRBmIFc
T6i2t6/t8A==
-----END PRIVATE KEY-----`
      }),
      databaseURL: 'https://demo-project.firebaseio.com'
    });

    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.log('⚠️ Firebase initialization failed, using mock mode');
    console.log('Error:', (error as Error).message);
    
    // Create a mock app for development
    firebaseApp = {} as admin.app.App;
  }
};

export const getFirestore = (): admin.firestore.Firestore => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  
  if (!firebaseApp) {
    throw new Error('Firebase not initialized');
  }
  
  try {
    return admin.firestore(firebaseApp);
  } catch (error) {
    console.log('⚠️ Firestore not available, using mock mode');
    // Return a mock Firestore for development
    return {} as admin.firestore.Firestore;
  }
};

export const getAuth = (): admin.auth.Auth => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  
  if (!firebaseApp) {
    throw new Error('Firebase not initialized');
  }
  
  try {
    return admin.auth(firebaseApp);
  } catch (error) {
    console.log('⚠️ Firebase Auth not available, using mock mode');
    // Return a mock Auth for development
    return {} as admin.auth.Auth;
  }
};
