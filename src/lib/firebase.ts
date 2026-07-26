import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase Initialization Module.
 * Synchronized with project: studio-5856019500-6395d
 */

const MOCK_KEY = "AIzaSyMockKey_Please_Set_In_Env";
// Trim whitespace to prevent errors from copy-pasting newlines or spaces
const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim() || MOCK_KEY;

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-5856019500-6395d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-5856019500-6395d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-5856019500-6395d.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "5856019500",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:5856019500:web:mockid"
};

// A key is valid if it exists, isn't the mock, and follows the AIzaSy prefix standard
export const isFirebaseConfigured = 
  apiKey !== MOCK_KEY && 
  apiKey.startsWith("AIzaSy") && 
  apiKey.length > 20;

let app;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  if (isFirebaseConfigured) {
    console.log("Munazzim: Cloud Workspace detected and initializing...");
  }
} catch (e) {
  console.warn("Firebase initialization failed, falling back to local mode.", e);
}

const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

export { auth, db };
