
"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * @fileOverview Authentication context for managing global user state.
 * Triggers a server-side sync to capture IP addresses and update user records.
 */

interface AuthContextType {
  user: { uid: string; email: string | null; displayName: string | null } | null;
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
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth')
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => setUser(result?.user || null))
      .finally(() => setLoading(false));
  }, []);

  const authenticate = async (email: string, password: string, register = false) => {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, register }),
    });
    const result = await response.json();
    if (!response.ok) throw Object.assign(new Error(result.error || 'Sign-in failed'), { code: result.error || 'auth/sign-in-failed' });
    setUser(result.user);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isDemo: false,
      signIn: (email, password) => authenticate(email, password),
      register: (email, password) => authenticate(email, password, true),
      signOut: async () => {
        await fetch('/api/auth', { method: 'DELETE' });
        setUser(null);
      },
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
