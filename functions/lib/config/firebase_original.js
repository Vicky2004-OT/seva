"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuth = exports.getFirestore = exports.initializeFirebase = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
let firebaseApp = null;
const initializeFirebase = () => {
    var _a;
    if (firebaseApp) {
        return;
    }
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'demo@demo-project.iam.gserviceaccount.com',
        privateKey: ((_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n')) || `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
xhXctbdgZcfwxh6Y685RtXhiaaKqjOXQ5fKA/Q1YP+1+uYzxqnnnjVy3+kRBmIFc
T6i2t6/t8A==
-----END PRIVATE KEY-----`,
    };
    try {
        firebaseApp = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
        console.log('✅ Firebase initialized successfully');
    }
    catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        throw error;
    }
};
exports.initializeFirebase = initializeFirebase;
const getFirestore = () => {
    if (!firebaseApp) {
        throw new Error('Firebase not initialized. Call initializeFirebase() first.');
    }
    return firebase_admin_1.default.firestore();
};
exports.getFirestore = getFirestore;
const getAuth = () => {
    if (!firebaseApp) {
        throw new Error('Firebase not initialized. Call initializeFirebase() first.');
    }
    return firebase_admin_1.default.auth();
};
exports.getAuth = getAuth;
exports.default = firebaseApp;
