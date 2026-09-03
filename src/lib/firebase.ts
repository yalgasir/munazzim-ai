import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";

/**
 * Firebase Initialization Module
 * Local Firebase Emulator support for:
 * - Browser on localhost
 * - Next.js server APIs
 */

const MOCK_KEY = "AIzaSyMockKey_Please_Set_In_Env";

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

  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "studio-5856019500-6395d.firebaseapp.com",

  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "ai-time-manager-9dfc1",

  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "studio-5856019500-6395d.appspot.com",

  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "5856019500",

  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:5856019500:web:mockid",
};

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

/**
 * SERVER SIDE
 *
 * Next.js API routes run here.
 * Always connect the server to the local Firebase Emulator.
 */
if (typeof window === "undefined") {
  const firestoreHost = process.env.MUNAZZIM_FIRESTORE_EMULATOR_HOST || "127.0.0.1";
  const firestorePort = Number(process.env.MUNAZZIM_FIRESTORE_EMULATOR_PORT || 8081);
  try {
    connectFirestoreEmulator(
      db,
      firestoreHost,
      firestorePort
    );

    console.log(
      `SERVER connected to Firestore Emulator: ${firestoreHost}:${firestorePort}`
    );
  } catch (error) {
    console.log(
      "Server Firestore Emulator already connected."
    );
  }
}

/**
 * BROWSER SIDE
 *
 * Keep direct emulator access only for localhost
 * while we migrate the remaining pages to Next.js APIs.
 *
 * Ngrok users should NOT connect directly to Firebase.
 */
if (typeof window !== "undefined") {
  const hostname = window.location.hostname;

  const isLocalBrowser =
    hostname === "localhost" ||
    hostname === "127.0.0.1";

  if (isLocalBrowser) {
    try {
      connectAuthEmulator(
        auth,
        "http://127.0.0.1:9099",
        {
          disableWarnings: true,
        }
      );

      connectFirestoreEmulator(
        db,
        "127.0.0.1",
        8081
      );

      console.log(
        "🔥 Browser connected to Firebase Auth Emulator"
      );

      console.log(
        "🔥 Browser connected to Firestore Emulator"
      );
    } catch (error) {
      console.log(
        "Browser Firebase Emulator already connected."
      );
    }
  }
}

export { app, auth, db };
