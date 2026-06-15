"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * @fileOverview Authentication context for managing global user state.
 * Synchronizes the guest user with the Firestore 'users' collection.
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
      const guestUser = { 
        id: "public-guest", 
        uid: "public-guest", 
        email: "guest@munazzim.app",
        displayName: "Guest User",
        role: "user",
        lastSeen: new Date().toISOString()
      };

      if (isFirebaseConfigured) {
        try {
          const userRef = doc(db, "users", guestUser.id);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, guestUser);
          } else {
            // Update last seen
            await setDoc(userRef, { lastSeen: guestUser.lastSeen }, { merge: true });
          }
        } catch (error) {
          console.error("Error syncing user to Firestore:", error);
        }
      }
      
      setUser(guestUser);
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
