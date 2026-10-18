'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { NyayaTraceLogo } from '@/components/logo/NyayaTraceLogo'
import { useEffect } from 'react'

/**
 * Wraps all (app) routes. Checks auth synchronously on mount to eliminate
 * the blank-screen flash caused by an async useEffect check.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  // Lazy initialiser — runs synchronously, no re-render needed on happy path
  const [status] = useState<'ok' | 'checking' | 'redirect'>(() => {
    if (typeof window === 'undefined') return 'checking'
    return getSession() ? 'ok' : 'redirect'
  })

  useEffect(() => {
    if (status === 'redirect') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [status, pathname, router])

  if (status === 'redirect' || status === 'checking') {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center gap-4">
        <NyayaTraceLogo size="lg" variant="light" />
        <div className="flex items-center gap-2 mt-2">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal/30 border-t-teal" />
          <span className="text-xs text-muted animate-pulse">Loading workspace…</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
