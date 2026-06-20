import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase Initialization Module.
 * Synchronized with project: studio-5856019500-6395d
 */

// We check if the API key is provided, otherwise we use a placeholder to allow initialization 
// while alerting the user. Firestore usually requires a real key to sync.
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyMockKey_Please_Set_In_Env";

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-5856019500-6395d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-5856019500-6395d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-5856019500-6395d.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "5856019500",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:5856019500:web:mockid"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// isFirebaseConfigured is true if the API key looks real
export const isFirebaseConfigured = apiKey.startsWith("AIza");

export { auth, db };
 