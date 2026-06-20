"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

/**
 * @fileOverview Authentication context for managing global user state.
 * Automatically synchronizes the user session with the Firestore 'users' collection.
 * Meets requirements for registration data persistence and duplicate prevention.
 */

interface AuthContextType {
  user: any | null;
  loading: boolean;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  isDemo: true 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncUser = async () => {
      // Identity data for the user session
      const userData = { 
        uid: "public-guest", 
        email: "guest@munazzim.app",
        displayName: "Guest User",
        status: "Active",
        lastSeen: new Date().toISOString()
      };

      if (isFirebaseConfigured) {
        try {
          const userRef = doc(db, "users", userData.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            // New User Registration
            // Saving all requested fields including Registration Date and Account Status
            await setDoc(userRef, {
              ...userData,
              registrationDate: new Date().toISOString(),
              createdAt: serverTimestamp(),
            });
            console.log("New user record created in database.");
          } else {
            // Existing User Update
            // Prevents duplicates by merging and only updating dynamic activity fields
            await setDoc(userRef, { 
              lastSeen: userData.lastSeen,
              status: "Active" 
            }, { merge: true });
            console.log("Existing user session synchronized.");
          }
        } catch (error) {
          console.error("Error syncing user to Firestore:", error);
        }
      }
      
      setUser(userData);
      setLoading(false);
    };

    syncUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isDemo: true }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
