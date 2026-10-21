import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, SESSION_COOKIE, seedDemoUsersIfNeeded } from '@/lib/auth-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  seedDemoUsersIfNeeded()
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  const user = getSessionUser(token)
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  return NextResponse.json({ user })
}
