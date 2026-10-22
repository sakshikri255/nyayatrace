'use client'

import { useState, useEffect } from 'react'
import { getSession, subscribeToSession, type UserRecord } from '@/lib/auth'

export function useSession(): UserRecord | null {
  const [session, setSessionState] = useState<UserRecord | null>(null)

  useEffect(() => {
    // Initial sync on mount
    setSessionState(getSession())

    // Subscribe to both intra-window custom events and cross-tab storage events
    return subscribeToSession((newSession) => {
      setSessionState(newSession)
    })
  }, [])

  return session
}
