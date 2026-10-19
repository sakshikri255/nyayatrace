'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { NyayaTraceLogo } from '@/components/logo/NyayaTraceLogo'

/**
 * Wraps all (app) routes. Checks auth synchronously on mount to eliminate
 * the blank-screen flash caused by an async useEffect check.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState<'ok' | 'checking'>('checking')

  useEffect(() => {
    if (getSession()) {
      setStatus('ok')
    } else {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [pathname, router])

  if (status === 'checking') {
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
