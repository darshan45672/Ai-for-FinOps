import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
  '/auth/signin',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/callback',
];

// Routes that are public assets
const publicAssets = [
  '/_next',
  '/favicon.ico',
  '/file.svg',
  '/globe.svg',
  '/next.svg',
  '/vercel.svg',
  '/window.svg',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets
  if (publicAssets.some(asset => pathname.startsWith(asset))) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const accessToken = request.cookies.get('accessToken')?.value;
  const isAuthenticated = !!accessToken;
  
  // Check if trying to access auth pages
  const isAuthPage = publicRoutes.some(route => pathname.startsWith(route));

  // If authenticated and trying to access auth pages, redirect to home
  if (isAuthenticated && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // If not authenticated and trying to access protected pages, redirect to register
  if (!isAuthenticated && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/register';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - static files
     * - _next internal routes
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
