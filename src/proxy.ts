import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/api/auth/login', '/api/auth/logout', '/api/context', '/api/kanji'];

export function proxy(req: NextRequest) {
  // Skip if Cognito is not configured (local dev without auth)
  if (!process.env.COGNITO_USER_POOL_ID) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Accept token from cookie (browser) or Authorization header (API clients / CLI)
  const cookieToken = req.cookies.get('access_token')?.value;
  const authHeader = req.headers.get('authorization') ?? '';
  const hasToken = !!cookieToken || authHeader.startsWith('Bearer ');

  if (!hasToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
