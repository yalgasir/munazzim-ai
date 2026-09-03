"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const { user, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) router.replace("/");
  }, [router, user]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try { setError(''); await register(email, password); router.replace('/'); }
    catch { setError('Account creation failed.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={submit} className="flex w-80 flex-col gap-3">
        <h1 className="text-xl font-semibold">Create Laboratory Account</h1>
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password (6+ characters)" minLength={6} required />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit">Create Account</Button>
        <Button type="button" variant="link" onClick={() => router.push('/login')}>Back to sign in</Button>
      </form>
    </div>
  );
}






 