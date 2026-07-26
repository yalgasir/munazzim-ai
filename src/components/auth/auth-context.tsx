
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebase";

/**
 * @fileOverview Authentication context for managing global user state.
 * Triggers a server-side sync to capture IP addresses and update user records.
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
      };

      try {
        if (isFirebaseConfigured) {
          // Call the server-side sync API to capture IP and update Firestore
          // We wrap this in a promise with a timeout to prevent hanging the whole app
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await fetch('/api/user/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            console.error("Failed to sync user data with server.");
          } else {
            const result = await response.json();
            console.log("User session synchronized. Client IP:", result.ip);
          }
        }
      } catch (error) {
        console.error("Error syncing user session:", error);
      } finally {
        // Always set the user and stop loading, even if sync fails
        setUser({ ...userData, status: "Active" });
        setLoading(false);
      }
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
