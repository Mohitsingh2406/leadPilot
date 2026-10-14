import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-leadpilot-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'leadpilot-spacenos.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'leadpilot-spacenos',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'leadpilot-spacenos.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
};

// Initialize Firebase client instance safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export let db: Firestore | null = null;
export let auth: Auth | null = null;

try {
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.warn('Firebase client initialized with local fallback:', (e as Error).message);
}

