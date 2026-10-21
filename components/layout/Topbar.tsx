'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, LogOut, Bell, X, AlertTriangle } from 'lucide-react'
import { useMobileSidebar } from '@/components/layout/MobileSidebarContext'
import dynamic from 'next/dynamic'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { getSession } from '@/lib/auth'
import { cn } from '@/lib/utils'
import type { BailAlert } from '@/app/api/overview/alerts/route'

const CommandPalette = dynamic(
  () => import('@/components/layout/CommandPalette').then((m) => m.CommandPalette),
  {
    ssr: false,
    loading: () => (
      <button
        type="button"
        className="hidden md:flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border-dark bg-charcoal/80 px-3 text-xs text-muted"
      >
        <span className="text-teal text-[11px]">⌘</span>
        <span>Search cases, sections, text...</span>
        <kbd className="ml-2 rounded border border-border-dark bg-navy/80 px-1.5 py-0.5 text-[10px] font-mono text-muted">
          ⌘K
        </kbd>
      </button>
    ),
  }
)

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

const DISMISSED_KEY = 'nyayatrace_dismissed_alerts'

function getDismissed(): Record<string, number> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveDismissed(d: Record<string, number>) {
  try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(d)) } catch { /* ignore */ }
}

function isDismissedUntilTomorrow(caseId: number): boolean {
  const d = getDismissed()
  const ts = d[String(caseId)]
  if (!ts) return false
  const tomorrow = new Date()
  tomorrow.setHours(0, 0, 0, 0)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return ts > tomorrow.getTime() - 86_400_000 // dismissed in the past day
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
  const { title, breadcrumb } = getPageInfo(pathname)
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null)
  const [alerts, setAlerts] = useState<BailAlert[]>([])
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSession(getSession())
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/overview/alerts')
      if (!res.ok) return
      const data = await res.json() as { alerts: BailAlert[] }
      setAlerts(data.alerts.filter((a) => !isDismissedUntilTomorrow(a.caseId)))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchAlerts()
    const timer = setInterval(fetchAlerts, 5 * 60_000)
    return () => clearInterval(timer)
  }, [fetchAlerts])

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch { /* ignore */ }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nyayatrace_session')
    }
    router.replace('/login')
  }

  function handleDismiss(caseId: number) {
    dismissUntilTomorrow(caseId)
    setAlerts((prev) => prev.filter((a) => a.caseId !== caseId))
  }

  const urgentCount = alerts.length

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

      {/* Right: alerts bell + theme toggle + user + sign out */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Bail Alerts Bell */}
        <div ref={bellRef} className="relative">
          <button
            type="button"
            aria-label={`Bail alerts${urgentCount > 0 ? ` — ${urgentCount} urgent` : ''}`}
            onClick={() => setBellOpen((o) => !o)}
            className={cn(
              'relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-dark text-slate-400 hover:bg-charcoal hover:text-slate-200 transition-colors',
              urgentCount > 0 && 'text-amber-400 border-amber-800/40 hover:text-amber-300'
            )}
          >
            <Bell size={16} />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {urgentCount > 9 ? '9+' : urgentCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border-dark bg-charcoal shadow-2xl shadow-black/50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-dark">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Bail Alerts
                </span>
                <button
                  type="button"
                  onClick={() => setBellOpen(false)}
                  className="text-slate-500 hover:text-slate-300"
                  aria-label="Close alerts"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-2">
                    <Bell size={20} className="text-slate-600" />
                    <p className="text-xs text-slate-500">All clear — no urgent bail deadlines</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border-dark">
                    {alerts.map((alert) => (
                      <li key={alert.caseId} className="px-4 py-3 hover:bg-charcoal/60 group">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={alert.href}
                            onClick={() => setBellOpen(false)}
                            className="flex-1 min-w-0"
                          >
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <AlertTriangle
                                size={12}
                                className={cn(
                                  'shrink-0',
                                  alert.status === 'accrued' ? 'text-red-400' : 'text-amber-400'
                                )}
                              />
                              <span
                                className={cn(
                                  'text-[10px] font-bold uppercase tracking-wide',
                                  alert.status === 'accrued' ? 'text-red-400' : 'text-amber-400'
                                )}
                              >
                                {alert.statusLabel}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-slate-200 truncate">{alert.title}</p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{alert.caseNumber}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{alert.statutorySection}</p>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDismiss(alert.caseId)}
                            title="Dismiss until tomorrow"
                            className="shrink-0 mt-0.5 text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
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
