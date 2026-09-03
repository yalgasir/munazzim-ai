"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user && pathname !== '/login' && pathname !== '/register') {
      router.replace('/login');
    }
  }, [loading, mounted, pathname, router, user]);

  if (!mounted || loading || (!user && pathname !== '/login' && pathname !== '/register')) return null;

  return <>{children}</>;
}




 