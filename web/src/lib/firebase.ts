import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'placeholder',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'placeholder',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'placeholder.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '0',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '0:0:web:0',
};

function getApp(): FirebaseApp {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
}

function createAuth(): Auth {
  if (typeof window === 'undefined') return null as unknown as Auth;
  return getAuth(getApp());
}

function createFirestore(): Firestore {
  if (typeof window === 'undefined') return null as unknown as Firestore;
  return getFirestore(getApp());
}

function createFunctions(): Functions {
  if (typeof window === 'undefined') return null as unknown as Functions;
  return getFunctions(getApp());
}

export const auth = createAuth();
export const firestore = createFirestore();
export const functions = createFunctions();
