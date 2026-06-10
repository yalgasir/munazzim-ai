"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * @fileOverview Authentication context for managing global user state.
 * Supports public guest access as requested by project requirements.
 */

interface AuthContextType {
  user: any | null;
  loading: boolean;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: { id: "public-guest", uid: "public-guest", email: "guest@munazzim.app" }, 
  loading: false, 
  isDemo: true 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user] = useState({ 
    id: "public-guest", 
    uid: "public-guest", 
    email: "guest@munazzim.app",
    displayName: "مستخدم منظّم"
  });
  const [loading] = useState(false);

  return (
    <AuthContext.Provider value={{ user, loading, isDemo: true }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


