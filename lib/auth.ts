/**
 * Simple client-side auth store backed by localStorage.
 * No real backend — credentials are checked against DEMO_USERS.
 */

export interface UserRecord {
  id: string
  name: string
  email: string
  role: string
}

/** Sample accounts users can log in with */
export const DEMO_USERS: Array<UserRecord & { password: string }> = [
  {
    id: '1',
    name: 'Aditi Sharma',
    email: 'aditi@nyayatrace.in',
    password: 'Demo@1234',
    role: 'Senior Advocate',
  },
  {
    id: '2',
    name: 'Rohan Mehta',
    email: 'rohan@nyayatrace.in',
    password: 'Demo@1234',
    role: 'Junior Associate',
  },
]

const SESSION_KEY = 'nyayatrace_session'

export function loginUser(email: string, password: string): UserRecord | null {
  const found = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  )
  if (!found) return null
  const { password: _pw, ...session } = found
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
  return session
}

export function signUpUser(name: string, email: string, _password: string): UserRecord {
  const session: UserRecord = {
    id: Date.now().toString(),
    name,
    email,
    role: 'Associate',
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
  return session
}

export function getSession(): UserRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as UserRecord) : null
  } catch {
    return null
  }
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY)
  }
}
