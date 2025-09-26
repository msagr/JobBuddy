import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Get the session
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const publicRoutes = ['/auth', '/auth/forgot-password', '/auth/update-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If there's no session and the user is trying to access a protected route
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/auth', request.url);
    redirectUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If there's a session and the user is trying to access an auth route
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth/* (auth API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth/).*)',
  ],
};
