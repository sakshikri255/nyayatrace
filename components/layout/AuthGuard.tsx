'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getSession } from '@/lib/auth'

/**
 * Wraps all (app) routes. If no session exists, redirects to /login.
 * Shows nothing while the check runs (avoids flash of protected content).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    } else {
      setChecked(true)
    }
  }, [pathname, router])

  if (!checked) {
    // Minimal loading screen while auth check runs
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-teal/30 border-t-teal" />
      </div>
    )
  }

  return <>{children}</>
}
