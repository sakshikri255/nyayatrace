import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, createSession, SESSION_COOKIE, seedDemoUsersIfNeeded } from '@/lib/auth-server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    seedDemoUsersIfNeeded()
    const body = await request.json() as { email?: string; password?: string }
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await authenticateUser(email, password)
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = createSession(user.id)

    const response = NextResponse.json({ user })
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === 'production',
    })
    return response
  } catch (error) {
    console.error('[POST /api/auth/login]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
