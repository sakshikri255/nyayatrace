/**
 * Server-side auth utilities — DB-backed sessions with bcrypt password hashing.
 * Cookie name: nyayasetu_session
 * Session: stored in SQLite sessions table, 7-day expiry
 */

import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users, sessions } from '@/lib/db/schema'
import { eq, lt } from 'drizzle-orm'
import { DEMO_USERS } from '@/lib/auth'
import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'nyayasetu_session'
const SESSION_MAX_AGE_DAYS = 7

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
}

/** Generate a random hex session token */
function generateToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '')
  }
  // Fallback: use Math.random (not cryptographically secure, but sufficient for dev)
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

/** Seed demo users into the DB on first run if users table is empty */
export function seedDemoUsersIfNeeded(): void {
  try {
    const count = db.select({ id: users.id }).from(users).limit(1).all()
    if (count.length > 0) return

    for (const demo of DEMO_USERS) {
      const hash = bcrypt.hashSync(demo.password, 10)
      const role = demo.role.toLowerCase().includes('admin')
        ? 'admin'
        : demo.role.toLowerCase().includes('clerk')
        ? 'clerk'
        : 'advocate'
      db.insert(users).values({
        id: demo.id,
        name: demo.name,
        email: demo.email,
        passwordHash: hash,
        role: role as 'advocate' | 'clerk' | 'admin',
      }).run()
    }
  } catch {
    // Ignore — table may not exist yet during migration
  }
}

/** Create a new user in the DB */
export async function createUser(
  name: string,
  email: string,
  password: string,
  role: 'advocate' | 'clerk' | 'admin' = 'advocate'
): Promise<SessionUser> {
  const passwordHash = await bcrypt.hash(password, 10)
  const id = generateToken()

  db.insert(users).values({ id, name, email, passwordHash, role }).run()

  return { id, name, email, role }
}

/** Authenticate user by email/password. Returns null if credentials are invalid. */
export async function authenticateUser(
  email: string,
  password: string
): Promise<SessionUser | null> {
  // Ensure demo users exist
  seedDemoUsersIfNeeded()

  const [user] = db.select().from(users).where(eq(users.email, email.toLowerCase())).all()
  if (!user) return null

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null

  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

/** Create a session for a user, returns the session token */
export function createSession(userId: string): string {
  const id = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_DAYS * 86_400_000).toISOString()

  // Clean up expired sessions for this user first
  try {
    db.delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString())).run()
  } catch { /* ignore */ }

  db.insert(sessions).values({ id, userId, expiresAt }).run()
  return id
}

/** Get the session user from the current request cookie (Next.js server context) */
export async function getSessionFromCookie(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null
    return getSessionUser(token)
  } catch {
    return null
  }
}

/** Get session user by token */
export function getSessionUser(token: string): SessionUser | null {
  try {
    const now = new Date().toISOString()
    const [row] = db
      .select({
        sessionId: sessions.id,
        expiresAt: sessions.expiresAt,
        userId: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.id, token))
      .all()

    if (!row) return null
    if (row.expiresAt < now) {
      // Expired — delete silently
      db.delete(sessions).where(eq(sessions.id, token)).run()
      return null
    }

    return { id: row.userId, name: row.name, email: row.email, role: row.role }
  } catch {
    return null
  }
}

/** Delete a session by token */
export function deleteSession(token: string): void {
  try {
    db.delete(sessions).where(eq(sessions.id, token)).run()
  } catch { /* ignore */ }
}

/** Get user by id */
export function getUserById(id: string): SessionUser | null {
  try {
    const [user] = db.select().from(users).where(eq(users.id, id)).all()
    if (!user) return null
    return { id: user.id, name: user.name, email: user.email, role: user.role }
  } catch {
    return null
  }
}

/** 
 * Helper for API routes — reads session from cookie header and throws 401 if not authenticated.
 * Returns the session user.
 */
export async function getRequiredSession(request: Request): Promise<SessionUser> {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`))
  const token = match?.[1]
  if (!token) {
    throw new AuthError('Unauthorized')
  }
  const user = getSessionUser(token)
  if (!user) {
    throw new AuthError('Unauthorized')
  }
  return user
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}
