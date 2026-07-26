import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase Initialization Module.
 * Synchronized with project: studio-5856019500-6395d
 */

const MOCK_KEY = "AIzaSyMockKey_Please_Set_In_Env";
// Get the API key from environment and trim any accidental whitespace
const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim();

// Check if a valid API key is present (starts with AIzaSy and is not the placeholder)
export const isFirebaseConfigured = !!(
  apiKey && 
  apiKey.startsWith("AIzaSy") && 
  apiKey !== MOCK_KEY &&
  apiKey.length > 20
);

const firebaseConfig = {
  apiKey: isFirebaseConfigured ? apiKey : MOCK_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-5856019500-6395d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-5856019500-6395d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-5856019500-6395d.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "5856019500",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:5856019500:web:mockid"
};

let app;
try {
  // Initialize Firebase
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  if (isFirebaseConfigured) {
    console.log("Munazzim: Cloud Workspace successfully activated.");
  } else {
    console.log("Munazzim: Running in Local Mock Mode. Add NEXT_PUBLIC_FIREBASE_API_KEY to enable Cloud Sync.");
  }
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

export { auth, db };
