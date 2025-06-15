import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Note: This middleware relies on client-side Firebase Auth state.
// For robust server-side protection with Firebase, you'd typically use session cookies
// managed by Firebase Admin SDK or a library like next-firebase-auth.
// This is a simpler approach for initial scaffolding.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // These are public paths
  const publicPaths = ['/login', '/signup'];

  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For protected routes, this middleware doesn't have access to Firebase Auth state directly.
  // Actual protection will be handled client-side by `(app)/layout.tsx` redirecting.
  // This middleware can be extended if using server-side session management.
  // For now, it just allows access to non-auth pages, relying on client-side checks.

  // Example: If you had a session cookie from Firebase (e.g., `__session`)
  // const sessionCookie = request.cookies.get('__session');
  // if (!sessionCookie && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }
  // if (sessionCookie && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
  //   return NextResponse.redirect(new URL('/chat', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (static assets in public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
