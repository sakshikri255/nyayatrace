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

export const SESSION_KEY = 'nyayatrace_session'
export const SESSION_CHANGE_EVENT = 'nyayatrace_session_change'

export function setSession(session: UserRecord | null): void {
  if (typeof window === 'undefined') return
  try {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  } catch {
    /* ignore storage errors */
  }
  // Notify intra-window listeners immediately
  window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT, { detail: session }))
}

export function subscribeToSession(callback: (session: UserRecord | null) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<UserRecord | null>
    callback(custom.detail !== undefined ? custom.detail : getSession())
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === SESSION_KEY) {
      callback(getSession())
    }
  }

  window.addEventListener(SESSION_CHANGE_EVENT, handleCustomEvent)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(SESSION_CHANGE_EVENT, handleCustomEvent)
    window.removeEventListener('storage', handleStorage)
  }
}

export function loginUser(email: string, password: string): UserRecord | null {
  const found = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  )
  if (!found) return null
  const session: UserRecord = {
    id: found.id,
    name: found.name,
    email: found.email,
    role: found.role,
  }
  setSession(session)
  return session
}

export function signUpUser(name: string, email: string, _password?: string): UserRecord {
  void _password
  const session: UserRecord = {
    id: Date.now().toString(),
    name,
    email,
    role: 'Associate',
  }
  setSession(session)
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
  setSession(null)
}

