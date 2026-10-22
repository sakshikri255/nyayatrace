import { NextRequest, NextResponse } from 'next/server'
import { createSession, SESSION_COOKIE, seedDemoUsersIfNeeded } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    seedDemoUsersIfNeeded()
    const body = (await request.json()) as { email?: string }
    const email = body.email?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const [user] = db.select().from(users).where(eq(users.email, email)).all()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const token = createSession(user.id)
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (error) {
    console.error('[POST /api/auth/switch]', error)
    return NextResponse.json({ error: 'Failed to switch user' }, { status: 500 })
  }
}
