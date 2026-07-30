import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase Initialization Module.
 * Includes sanitization for environment variables to prevent crashes.
 */

const MOCK_KEY = "AIzaSyMockKey_Please_Set_In_Env";

// Safely handle potential undefined or malformed API key
const getSafeApiKey = () => {
  const raw = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
  return raw.replace(/^["']|["']$/g, "").trim();
};

const apiKey = getSafeApiKey();

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
let auth: any = null;
let db: any = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

export { auth, db };
