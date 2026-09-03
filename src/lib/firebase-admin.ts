import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
}

const app = getApps()[0] || initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-time-manager-9dfc1',
});

export const adminAuth = getAuth(app);