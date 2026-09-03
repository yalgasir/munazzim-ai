"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) router.replace("/");
  }, [router, user]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try { setError(''); await signIn(email, password); router.replace('/'); }
    catch (error: any) { setError(error?.code || error?.message || 'Sign-in failed.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={submit} className="flex w-80 flex-col gap-3">
        <h1 className="text-xl font-semibold">Laboratory Sign In</h1>
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" required />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit">Sign In</Button>
        <Button type="button" variant="link" onClick={() => router.push('/register')}>Create laboratory account</Button>
      </form>
    </div>
  );
}






 