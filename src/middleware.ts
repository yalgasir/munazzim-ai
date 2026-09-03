import { NextResponse, type NextRequest } from 'next/server';

const publicApiPaths = new Set(['/api/health', '/api/user/sync']);

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')
    && !publicApiPaths.has(request.nextUrl.pathname)
    && !request.cookies.get('munazzim_session')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};