import { NextResponse, type NextRequest } from 'next/server';

const publicApiPaths = new Set(['/api/health', '/api/user/sync', '/api/auth']);
const publicPagePaths = new Set(['/login', '/register']);

const hasSession = (request: NextRequest) => Boolean(request.cookies.get('munazzim_session')?.value);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes keep the existing behavior: JSON 401 instead of a redirect.
  if (pathname.startsWith('/api/')) {
    if (!publicApiPaths.has(pathname) && !hasSession(request)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Page routes: every protected application route requires a session cookie.
  // Without one, always send the user to the Login page.
  if (!publicPagePaths.has(pathname) && !hasSession(request)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|robots.txt).*)'],
};