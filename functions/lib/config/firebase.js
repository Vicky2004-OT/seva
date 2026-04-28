"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuth = exports.getFirestore = exports.initializeFirebase = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
let firebaseApp = null;
const initializeFirebase = () => {
    if (firebaseApp) {
        return;
    }
    // For demo purposes, we'll use a mock configuration
    // In production, replace with actual Firebase credentials
    try {
        firebaseApp = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert({
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
    }
    catch (error) {
        console.log('⚠️ Firebase initialization failed, using mock mode');
        console.log('Error:', error.message);
        // Create a mock app for development
        firebaseApp = {};
    }
};
exports.initializeFirebase = initializeFirebase;
const getFirestore = () => {
    if (!firebaseApp) {
        (0, exports.initializeFirebase)();
    }
    if (!firebaseApp) {
        throw new Error('Firebase not initialized');
    }
    try {
        return firebase_admin_1.default.firestore(firebaseApp);
    }
    catch (error) {
        console.log('⚠️ Firestore not available, using mock mode');
        // Return a mock Firestore for development
        return {};
    }
};
exports.getFirestore = getFirestore;
const getAuth = () => {
    if (!firebaseApp) {
        (0, exports.initializeFirebase)();
    }
    if (!firebaseApp) {
        throw new Error('Firebase not initialized');
    }
    try {
        return firebase_admin_1.default.auth(firebaseApp);
    }
    catch (error) {
        console.log('⚠️ Firebase Auth not available, using mock mode');
        // Return a mock Auth for development
        return {};
    }
};
exports.getAuth = getAuth;
