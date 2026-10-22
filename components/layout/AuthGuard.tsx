'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { NyayaTraceLogo } from '@/components/logo/NyayaTraceLogo'

/**
 * Wraps all (app) routes. Checks server session via /api/auth/me, with a
 * localStorage fallback for backward compatibility.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState<'ok' | 'checking'>('checking')

  useEffect(() => {
    // Fast path: check legacy localStorage session first for instant feedback
    if (getSession()) {
      setStatus('ok')
      return
    }

    // Then verify via server session
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (res.ok) {
          setStatus('ok')
        } else {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        }
      })
      .catch(() => {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      })
  }, [pathname, router])

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-midnight-950 flex flex-col items-center justify-center gap-4">
        <NyayaTraceLogo size="lg" variant="gold" />
        <div className="flex items-center gap-2 mt-2">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
          <span className="text-xs text-slate-400 animate-pulse">Loading workspace…</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
