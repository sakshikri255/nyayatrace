'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu,
  LogOut,
  Plus,
  ChevronRight,
  ChevronDown,
  User,
  Check,
  Bell,
  X,
  AlertTriangle,
} from 'lucide-react'
import { useMobileSidebar } from '@/components/layout/MobileSidebarContext'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { logoutUser, setSession, DEMO_USERS, type UserRecord } from '@/lib/auth'
import { useSession } from '@/hooks/useSession'
import { cn } from '@/lib/utils'
import type { BailAlert } from '@/app/api/overview/alerts/route'

const PAGE_CONFIG: Record<string, { title: string; category: string }> = {
  '/overview': { title: 'Overview', category: 'Dashboard' },
  '/cases': { title: 'Cases', category: 'Dashboard' },
  '/verification': { title: 'Fact & Evidence Verification', category: 'Dashboard' },
  '/bail-briefs': { title: 'Bail & Statutory Relief', category: 'Dashboard' },
  '/concordance': { title: 'Dual Law Concordance', category: 'Dashboard' },
  '/reports': { title: 'Reports', category: 'Dashboard' },
  '/settings': { title: 'Chamber Settings', category: 'Dashboard' },
}

function getPageMeta(pathname: string) {
  if (PAGE_CONFIG[pathname]) {
    return { ...PAGE_CONFIG[pathname], subTitle: null, parentHref: null }
  }

  // Detect /cases/[id]
  const caseMatch = pathname.match(/^\/cases\/(\d+)/)
  if (caseMatch) {
    return {
      title: 'Case Investigation',
      category: 'Cases',
      subTitle: `Case #${caseMatch[1]}`,
      parentHref: '/cases',
    }
  }

  // Detect /bail-briefs/[id]
  const bailMatch = pathname.match(/^\/bail-briefs\/(\d+)/)
  if (bailMatch) {
    return {
      title: 'Statutory Bail Brief',
      category: 'Bail & Parole',
      subTitle: `Case #${bailMatch[1]}`,
      parentHref: '/bail-briefs',
    }
  }

  // Prefix match
  for (const [key, val] of Object.entries(PAGE_CONFIG)) {
    if (pathname.startsWith(key)) {
      return { ...val, subTitle: null, parentHref: null }
    }
  }

  return { title: 'NyayaTrace', category: 'Dashboard', subTitle: null, parentHref: null }
}

const DISMISSED_KEY = 'nyayatrace_dismissed_alerts'

function getDismissed(): Record<string, number> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveDismissed(d: Record<string, number>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(d))
  } catch {
    /* ignore */
  }
}

function isDismissedUntilTomorrow(caseId: number): boolean {
  const d = getDismissed()
  const ts = d[String(caseId)]
  if (!ts) return false
  const tomorrow = new Date()
  tomorrow.setHours(0, 0, 0, 0)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return ts > tomorrow.getTime() - 86_400_000
}

function dismissUntilTomorrow(caseId: number) {
  const d = getDismissed()
  d[String(caseId)] = Date.now()
  saveDismissed(d)
}

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setMobileOpen } = useMobileSidebar()
  const session = useSession()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Bail alert states
  const [alerts, setAlerts] = useState<BailAlert[]>([])
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const pageMeta = getPageMeta(pathname)

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/overview/alerts')
      if (!res.ok) return
      const data: BailAlert[] = await res.json()
      setAlerts(data.filter((a) => !isDismissedUntilTomorrow(a.caseId)))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
    const timer = setInterval(fetchAlerts, 60_000)
    return () => clearInterval(timer)
  }, [fetchAlerts])

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setProfileOpen(false)
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      /* ignore */
    }
    logoutUser()
    router.replace('/login')
  }

  function handleDismiss(caseId: number) {
    dismissUntilTomorrow(caseId)
    setAlerts((prev) => prev.filter((a) => a.caseId !== caseId))
  }

  async function handleSwitchUser(user: (typeof DEMO_USERS)[number]) {
    if (typeof window !== 'undefined') {
      const newSession: UserRecord = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
      setSession(newSession)
      setProfileOpen(false)

      try {
        await fetch('/api/auth/switch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        })
      } catch {
        /* ignore */
      }

      router.refresh()
    }
  }

  const initials = session?.name
    ? session.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AS'

  const urgentCount = alerts.length

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 px-4 sm:px-6 backdrop-blur-md">
      {/* ── Left: Mobile menu toggle + Clean Breadcrumb / Title ── */}
      <div className="flex items-center gap-3 min-w-0 mr-4">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-foreground hover:bg-accent md:hidden transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex flex-col justify-center min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {pageMeta.parentHref ? (
              <Link
                href={pageMeta.parentHref}
                className="hover:text-teal font-medium text-foreground transition-colors truncate"
              >
                {pageMeta.category}
              </Link>
            ) : (
              <span className="font-medium truncate">{pageMeta.category}</span>
            )}

            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />

            <span className="font-semibold text-foreground truncate">
              {pageMeta.subTitle || pageMeta.title}
            </span>
          </nav>

          <h1 className="text-sm font-bold text-foreground leading-tight truncate">
            {pageMeta.title}
          </h1>
        </div>
      </div>

      {/* ── Center: Search / Command Palette ── */}
      <div className="hidden md:flex flex-1 items-center justify-center max-w-sm px-2">
        <CommandPalette />
      </div>

      {/* ── Right: Alerts Bell + ThemeToggle + Primary Action + Profile Menu ── */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="md:hidden">
          <CommandPalette />
        </div>

        {/* Bail Alerts Bell */}
        <div ref={bellRef} className="relative">
          <button
            type="button"
            aria-label={`Bail alerts${urgentCount > 0 ? ` — ${urgentCount} urgent` : ''}`}
            onClick={() => setBellOpen((o) => !o)}
            className={cn(
              'relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
              urgentCount > 0 && 'text-amber-500 border-amber-500/40 hover:text-amber-600'
            )}
          >
            <Bell className="h-4 w-4" />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {urgentCount > 9 ? '9+' : urgentCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Bail Alerts
                </span>
                <button
                  type="button"
                  onClick={() => setBellOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Close alerts"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-2">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">All clear — no urgent bail deadlines</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {alerts.map((alert) => (
                      <li key={alert.caseId} className="px-4 py-3 hover:bg-muted/40 group">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={alert.href}
                            onClick={() => setBellOpen(false)}
                            className="flex-1 min-w-0"
                          >
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <AlertTriangle
                                className={cn(
                                  'h-3 w-3 shrink-0',
                                  alert.status === 'accrued' ? 'text-red-500' : 'text-amber-500'
                                )}
                              />
                              <span
                                className={cn(
                                  'text-[10px] font-bold uppercase tracking-wide',
                                  alert.status === 'accrued' ? 'text-red-500' : 'text-amber-500'
                                )}
                              >
                                {alert.statusLabel}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-foreground truncate">{alert.title}</p>
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{alert.caseNumber}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{alert.statutorySection}</p>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDismiss(alert.caseId)}
                            title="Dismiss until tomorrow"
                            className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Theme Toggle */}
        <ThemeToggle />

        {/* Global Primary Action: + New Case */}
        <Link
          href="/cases?new=1"
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-hover active:scale-[0.98] transition-all"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">New Case</span>
          <span className="sm:hidden">New</span>
        </Link>

        {/* User Account / Persona Menu */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-label="User menu"
            className={cn(
              'group flex items-center gap-2.5 rounded-lg border border-teal/30 bg-teal/[0.04] hover:bg-teal/[0.09] p-1 sm:pl-1.5 sm:pr-2.5 sm:py-1 text-left transition-all duration-200 shadow-xs hover:border-teal/55 hover:shadow-sm hover:shadow-teal/10 cursor-pointer',
              profileOpen && 'border-teal bg-teal/10 ring-2 ring-teal/25 shadow-sm'
            )}
          >
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-teal-600 via-teal-700 to-navy text-[11px] font-bold text-white shadow-xs ring-1 ring-teal-300/30">
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-1.5 ring-background" />
            </div>

            <div className="hidden sm:flex flex-col text-left min-w-0">
              <span className="text-xs font-semibold text-foreground group-hover:text-teal-light transition-colors leading-none truncate max-w-[125px]">
                {session?.name || 'Advocate'}
              </span>
              <span className="text-[10px] text-teal-600 dark:text-teal-300 font-medium leading-tight mt-0.5 truncate max-w-[125px]">
                {session?.role || 'Senior Advocate'}
              </span>
            </div>

            <ChevronDown className={cn(
              'hidden sm:block h-3.5 w-3.5 text-teal/60 group-hover:text-teal transition-transform duration-200',
              profileOpen && 'rotate-180 text-teal'
            )} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-card p-0 shadow-xl z-50 animate-in fade-in-0 zoom-in-95 duration-100">
              {/* Profile identity header */}
              <div className="p-3.5 border-b border-border bg-muted/30 rounded-t-xl">
                <p className="text-xs font-bold text-foreground truncate">
                  {session?.name || 'Aditi Sharma'}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{session?.email || 'aditi@nyayatrace.in'}</p>
                <span className="inline-block mt-1 rounded bg-teal/10 px-1.5 py-0.2 text-[10px] font-semibold text-teal-800 dark:text-teal-300">
                  {session?.role || 'Senior Advocate'}
                </span>
              </div>

              {/* Persona Switcher */}
              <div className="p-2 border-b border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 px-2">
                  Switch Persona
                </p>
                <div className="space-y-0.5">
                  {DEMO_USERS.map((user) => {
                    const isSelected = session?.email === user.email
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSwitchUser(user)}
                        className={cn(
                          'w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs text-left transition-colors',
                          isSelected
                            ? 'bg-teal/10 text-teal-900 dark:text-teal-200 font-semibold'
                            : 'hover:bg-muted text-foreground'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <User className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'text-teal' : 'text-muted-foreground')} />
                          <div className="truncate">
                            <span className="block truncate leading-tight">{user.name}</span>
                            <span className="block text-[10px] text-muted-foreground font-normal leading-tight">
                              {user.role}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-teal shrink-0 ml-1.5" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Sign out */}
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
