import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
}

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = `${process.env.MUNAZZIM_FIRESTORE_EMULATOR_HOST || '127.0.0.1'}:${process.env.MUNAZZIM_FIRESTORE_EMULATOR_PORT || 8081}`;
}

const app = getApps()[0] || initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-time-manager-9dfc1',
});

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);