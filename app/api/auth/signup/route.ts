import { NextRequest, NextResponse } from 'next/server'
import { createUser, createSession, SESSION_COOKIE, seedDemoUsersIfNeeded } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    seedDemoUsersIfNeeded()
    const body = await request.json() as { name?: string; email?: string; password?: string; role?: string }
    const { name, email, password, role } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    // Check if email already exists
    const existing = db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).all()
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const validRole = ['advocate', 'clerk', 'admin'].includes(role ?? '') ? (role as 'advocate' | 'clerk' | 'admin') : 'advocate'
    const user = await createUser(name.trim(), email.toLowerCase().trim(), password, validRole)
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
    console.error('[POST /api/auth/signup]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
