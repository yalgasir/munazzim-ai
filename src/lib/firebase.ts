import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const isValidKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY.startsWith("AIza");

const firebaseConfig = {
  apiKey: isValidKey ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY : "AIzaSyMockKey_DemoMode",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "munazzim.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "munazzim",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "munazzim.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const isFirebaseConfigured = isValidKey;

export { auth, db };

