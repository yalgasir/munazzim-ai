
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * @fileOverview Authentication context for managing global user state.
 * Triggers a server-side sync to capture IP addresses and update user records.
 */

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  isDemo: false,
  signIn: async () => {},
  register: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      try {
        if (currentUser) {
          const token = await currentUser.getIdToken();
          const response = await fetch('/api/user/sync', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            console.error("Failed to sync user data with server.");
          }
        }
      } catch (error) {
        console.error("Error syncing user session:", error);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isDemo: false,
      signIn: async (email, password) => { await signInWithEmailAndPassword(auth, email, password); },
      register: async (email, password) => { await createUserWithEmailAndPassword(auth, email, password); },
      signOut: async () => { await signOut(auth); },
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
