import { adminAuth } from '@/lib/firebase-admin';

function sessionToken(request: Request): string | null {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)munazzim_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getCurrentUserId(request: Request): Promise<string> {
  const token = sessionToken(request);
  if (!token) throw new Error('UNAUTHENTICATED');

  try {
    return (await adminAuth.verifyIdToken(token)).uid;
  } catch {
    throw new Error('UNAUTHENTICATED');
  }
}
