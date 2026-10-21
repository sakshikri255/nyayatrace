'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, LogOut } from 'lucide-react'
import { useMobileSidebar } from '@/components/layout/MobileSidebarContext'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { logoutUser, getSession } from '@/lib/auth'

const PAGE_TITLES: Record<string, { title: string; breadcrumb: string[] }> = {
  '/overview': { title: 'Overview', breadcrumb: ['Overview'] },
  '/cases': { title: 'Cases', breadcrumb: ['Overview', 'Cases'] },
  '/verification': { title: 'Fact & Evidence Verification', breadcrumb: ['Overview', 'Verification'] },
  '/bail-briefs': { title: 'Bail & Parole', breadcrumb: ['Overview', 'Bail & Parole'] },
  '/case-progress': { title: 'Case Progress', breadcrumb: ['Overview', 'Case Progress'] },
  '/concordance': { title: 'Dual Law Concordance', breadcrumb: ['Overview', 'Concordance'] },
  '/cause-list': { title: 'Court Diary / Roznamcha', breadcrumb: ['Overview', 'Cause List'] },
  '/reports': { title: 'Reports', breadcrumb: ['Overview', 'Reports'] },
  '/settings': { title: 'Settings', breadcrumb: ['Overview', 'Settings'] },
}

function getPageInfo(pathname: string) {
  for (const [key, val] of Object.entries(PAGE_TITLES)) {
    if (pathname === key || pathname.startsWith(key + '/')) return val
  }
  return { title: 'NyayaTrace', breadcrumb: ['NyayaTrace'] }
}

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setMobileOpen } = useMobileSidebar()
  const { title, breadcrumb } = getPageInfo(pathname)
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null)

  useEffect(() => {
    setSession(getSession())
  }, [])

  function handleLogout() {
    logoutUser()
    router.replace('/login')
  }

  return (
    <header className="flex items-center justify-between gap-4 h-14 px-6 bg-[var(--sidebar-background)] border-b border-border-dark dark:border-border-dark light:border-slate-200 shrink-0">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
        className="mr-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-charcoal hover:text-slate-200 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      {/* Left: title + breadcrumb */}
      <div className="flex flex-1 flex-col justify-center min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              {i === breadcrumb.length - 1 ? (
                <span aria-current="page" className="text-slate-200 font-medium">
                  {crumb}
                </span>
              ) : (
                <Link href="/overview" className="hover:text-teal-light">
                  {crumb}
                </Link>
              )}
            </span>
          ))}
        </div>
        <h1 className="text-base font-semibold text-slate-100 leading-tight truncate">
          {title}
        </h1>
      </div>

      {/* Center: Command Palette */}
      <CommandPalette />

      {/* Right: theme toggle + user + sign out */}
      <div className="flex items-center gap-3 shrink-0">
        <ThemeToggle />
        {session && (
          <span className="hidden sm:flex h-9 items-center text-xs text-slate-300 max-w-[140px] truncate">
            {session.name}
          </span>
        )}
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-slate-300 hover:bg-rose-950/40 hover:text-rose-400 border border-border-dark hover:border-rose-800/60 transition-colors"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}

export default Topbar