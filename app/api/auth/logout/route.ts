import { NextRequest, NextResponse } from 'next/server'
import { deleteSession, SESSION_COOKIE } from '@/lib/auth-server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (token) {
    deleteSession(token)
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
