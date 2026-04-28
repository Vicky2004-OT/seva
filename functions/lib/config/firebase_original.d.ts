import admin from 'firebase-admin';
declare let firebaseApp: admin.app.App | null;
export declare const initializeFirebase: () => void;
export declare const getFirestore: () => admin.firestore.Firestore;
export declare const getAuth: () => admin.auth.Auth;
export default firebaseApp;
