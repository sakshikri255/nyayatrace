import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'nyayatrace_session'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value

  // Always allow API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Root — on starting the website, load the login / signup page
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Auth pages (/login, /signup, /reset-password)
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/reset-password')
  ) {
    return NextResponse.next()
  }

  // Protected app routes — must have session cookie
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)).*)',
  ],
}
