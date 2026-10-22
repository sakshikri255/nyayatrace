import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware — protects all (app) routes.
 * Public routes: /login, /signup, /reset-password, /api/auth/*
 * 
 * NOTE: We only check cookie presence here (edge-compatible).
 * Full session validation is done in API routes via getRequiredSession().
 */

const SESSION_COOKIE = 'nyayatrace_session'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow auth API routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Allow all other API routes (they handle auth themselves)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Public page routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Protected routes: check session cookie presence
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    const nextTarget = pathname === '/' ? '/overview' : pathname
    loginUrl.searchParams.set('next', nextTarget)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)).*)',
  ],
}
