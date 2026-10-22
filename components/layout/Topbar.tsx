'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  Plus,
  ChevronRight,
  Bell,
  X,
  AlertTriangle,
} from 'lucide-react'
import { useMobileSidebar } from '@/components/layout/MobileSidebarContext'
import { CommandPalette } from '@/components/layout/CommandPalette'
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
  const { setMobileOpen } = useMobileSidebar()

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

  // Close bell dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setBellOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function handleDismiss(caseId: number) {
    dismissUntilTomorrow(caseId)
    setAlerts((prev) => prev.filter((a) => a.caseId !== caseId))
  }

  const urgentCount = alerts.length

  const isOverview = pathname === '/overview'

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between px-4 sm:px-6 backdrop-blur-md border-b bg-midnight-900/95 border-white/8 text-slate-100">
      {/* ── Left: Mobile menu toggle + Clean Breadcrumb / Title ── */}
      <div className="flex items-center gap-3 min-w-0 mr-4">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/15 text-slate-300 hover:bg-white/8 md:hidden transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex flex-col justify-center min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400">
            {pageMeta.parentHref ? (
              <Link
                href={pageMeta.parentHref}
                className="font-medium transition-colors truncate text-slate-300 hover:text-gold-light"
              >
                {pageMeta.category}
              </Link>
            ) : (
              <span className="font-medium truncate">{pageMeta.category}</span>
            )}

            <ChevronRight className="h-3 w-3 shrink-0 text-slate-500" />

            <span className="font-semibold truncate text-slate-200">
              {pageMeta.subTitle || pageMeta.title}
            </span>
          </nav>

          <h1 className="text-sm font-bold leading-tight truncate text-slate-100">
            {pageMeta.title}
          </h1>
        </div>
      </div>

      {/* ── Center: Search / Command Palette ── */}
      <div className="hidden md:flex flex-1 items-center justify-center max-w-sm px-2">
        <CommandPalette dark={true} />
      </div>

      {/* ── Right: Alerts Bell + Primary Action ── */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="md:hidden">
          <CommandPalette dark={isOverview} />
        </div>

        {/* Bail Alerts Bell */}
        <div ref={bellRef} className="relative">
          <button
            type="button"
            aria-label={`Bail alerts${urgentCount > 0 ? ` — ${urgentCount} urgent` : ''}`}
            onClick={() => setBellOpen((o) => !o)}
            className={cn(
              'relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-slate-400 hover:bg-white/8 hover:text-slate-200 transition-colors',
              urgentCount > 0 && 'text-gold border-gold/40 hover:text-gold-light'
            )}
          >
            <Bell className="h-4 w-4" />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold-dark text-[10px] font-bold text-white shadow-[0_0_6px_rgba(229,195,120,0.6)]">
                {urgentCount > 9 ? '9+' : urgentCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-white/10 bg-midnight-900 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/5">
                <span className="text-xs font-semibold text-gold uppercase tracking-wider">
                  Bail Alerts
                </span>
                <button
                  type="button"
                  onClick={() => setBellOpen(false)}
                  className="text-slate-400 hover:text-slate-100"
                  aria-label="Close alerts"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-2">
                    <Bell className="h-5 w-5 text-slate-500" />
                    <p className="text-xs text-slate-400">All clear — no urgent bail deadlines</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {alerts.map((alert) => (
                      <li key={alert.caseId} className="px-4 py-3 hover:bg-white/5 group transition-colors">
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
                                  alert.status === 'accrued' ? 'text-red-400' : 'text-gold'
                                )}
                              />
                              <span
                                className={cn(
                                  'text-[10px] font-bold uppercase tracking-wide',
                                  alert.status === 'accrued' ? 'text-red-400' : 'text-gold'
                                )}
                              >
                                {alert.statusLabel}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-slate-200 truncate">{alert.title}</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{alert.caseNumber}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{alert.statutorySection}</p>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDismiss(alert.caseId)}
                            title="Dismiss until tomorrow"
                            className="shrink-0 mt-0.5 text-slate-500 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
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

        {/* Global Primary Action: + New Case */}
        <Link
          href="/cases?new=1"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs active:scale-[0.98] transition-all bg-gradient-to-r from-gold-muted via-gold to-gold-light text-midnight-950 hover:brightness-110 shadow-gold/15"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">New Case</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>
    </header>
  )
}
