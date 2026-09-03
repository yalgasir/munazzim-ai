import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * Local development user sync.
 * In local mode we do not write the user from the server route.
 * Tasks, appointments, and other data continue to use Firebase Emulator.
 */

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get('authorization') || '';
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : '';
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const user = await adminAuth.verifyIdToken(token);

    const response = NextResponse.json({
      success: true,
      local: true,
      user: {
        uid: user.uid,
        email: user.email || null,
        displayName: user.name || null,
      }
    });
    response.cookies.set('munazzim_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: false,
      maxAge: 60 * 60,
    });
    return response;

  } catch (error: any) {
    console.error('User sync error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unknown error'
      },
      { status: 401 }
    );
  }
}
