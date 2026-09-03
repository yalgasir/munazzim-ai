import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

const sessionCookie = 'munazzim_session';

function responseWithSession(token: string, user: { uid: string; email: string | null; displayName: string | null }) {
  const response = NextResponse.json({ success: true, user });
  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false,
    maxAge: 60 * 60,
  });
  return response;
}

function tokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get('cookie') || '';
  return cookie.match(/(?:^|;\s*)munazzim_session=([^;]+)/)?.[1] || null;
}

export async function GET(request: Request) {
  const token = tokenFromRequest(request);
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const user = await adminAuth.verifyIdToken(decodeURIComponent(token));
    return NextResponse.json({
      user: { uid: user.uid, email: user.email || null, displayName: user.name || null },
    });
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, register = false } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
    const operation = register ? 'accounts:signUp' : 'accounts:signInWithPassword';
    const signIn = await fetch(`http://${emulatorHost}/identitytoolkit.googleapis.com/v1/${operation}?key=munazzim-lab`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const result = await signIn.json();
    if (!signIn.ok || typeof result.idToken !== 'string') {
      return NextResponse.json({ error: result.error?.message || 'Sign-in failed' }, { status: 401 });
    }

    const user = await adminAuth.verifyIdToken(result.idToken);
    return responseWithSession(result.idToken, {
      uid: user.uid,
      email: user.email || null,
      displayName: user.name || null,
    });
  } catch {
    return NextResponse.json({ error: 'Sign-in service unavailable' }, { status: 503 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionCookie, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}