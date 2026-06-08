
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: any | null;
  loading: boolean;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isDemo: false });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const publicPaths = ["/login", "/register"];

    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsDemo(false);
        setLoading(false);
        
        if (!currentUser && !publicPaths.includes(pathname)) {
          router.push("/login");
        }
      });
      return () => unsubscribe();
    } else {
      // وضع المحاكاة
      const mockUser = localStorage.getItem("current_mock_user");
      if (mockUser) {
        setUser(JSON.parse(mockUser));
        setIsDemo(true);
      } else {
        setUser(null);
        if (!publicPaths.includes(pathname)) {
          router.push("/login");
        }
      }
      setLoading(false);
    }
  }, [router, pathname]);

  return (
    <AuthContext.Provider value={{ user, loading, isDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
