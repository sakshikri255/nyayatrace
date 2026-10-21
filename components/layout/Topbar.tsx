'use client'

import { useState, useEffect, useRef } from 'react'
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
} from 'lucide-react'
import { useMobileSidebar } from '@/components/layout/MobileSidebarContext'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { logoutUser, getSession, DEMO_USERS, type UserRecord } from '@/lib/auth'
import { cn } from '@/lib/utils'

const PAGE_CONFIG: Record<string, { title: string; category: string }> = {
  '/overview': { title: 'Overview', category: 'Dashboard' },
  '/cases': { title: 'Cases', category: 'Dashboard' },
  '/verification': { title: 'Fact & Evidence Verification', category: 'Dashboard' },
  '/bail-briefs': { title: 'Bail & Statutory Relief', category: 'Dashboard' },
  '/case-progress': { title: 'Case Progress & Strategy', category: 'Dashboard' },
  '/concordance': { title: 'Dual Law Concordance', category: 'Dashboard' },
  '/cause-list': { title: 'Court Diary / Roznamcha', category: 'Dashboard' },
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

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setMobileOpen } = useMobileSidebar()
  const [session, setSession] = useState<UserRecord | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const pageMeta = getPageMeta(pathname)

  useEffect(() => {
    setSession(getSession())
  }, [])

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function handleLogout() {
    logoutUser()
    router.replace('/login')
  }

  function handleSwitchUser(user: (typeof DEMO_USERS)[number]) {
    if (typeof window !== 'undefined') {
      const newSession: UserRecord = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
      localStorage.setItem('nyayatrace_session', JSON.stringify(newSession))
      setSession(newSession)
      setProfileOpen(false)
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

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      {/* ── Left: Mobile menu toggle + Clean Breadcrumb / Title ── */}
      <div className="flex items-center gap-3 min-w-0 mr-4">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex flex-col justify-center min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400">
            {pageMeta.parentHref ? (
              <Link
                href={pageMeta.parentHref}
                className="hover:text-teal font-medium text-slate-500 transition-colors truncate"
              >
                {pageMeta.category}
              </Link>
            ) : (
              <span className="text-slate-500 font-medium truncate">{pageMeta.category}</span>
            )}

            <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />

            <span className="font-semibold text-slate-800 truncate">
              {pageMeta.subTitle || pageMeta.title}
            </span>
          </nav>

          <h1 className="text-sm font-bold text-slate-900 leading-tight truncate">
            {pageMeta.title}
          </h1>
        </div>
      </div>

      {/* ── Center: Search / Command Palette ── */}
      <div className="hidden md:flex flex-1 items-center justify-center max-w-sm px-2">
        <CommandPalette />
      </div>

      {/* ── Right: Clean Primary Action + Profile Menu ── */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="md:hidden">
          <CommandPalette />
        </div>

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
              'flex items-center gap-2 rounded-lg border border-slate-200/90 bg-white p-1 sm:px-2.5 sm:py-1 text-left transition-all hover:border-slate-300 hover:bg-slate-50',
              profileOpen && 'border-teal/50 bg-teal/5 ring-2 ring-teal/20'
            )}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-navy text-[11px] font-bold text-white">
              {initials}
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-none truncate max-w-[120px]">
                {session?.name || 'Advocate'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate max-w-[120px]">
                {session?.role || 'Senior Advocate'}
              </span>
            </div>

            <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-0 shadow-xl z-50 animate-in fade-in-0 zoom-in-95 duration-100">
              {/* Profile identity header */}
              <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 rounded-t-xl">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {session?.name || 'Aditi Sharma'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{session?.email || 'aditi@nyayatrace.in'}</p>
                <span className="inline-block mt-1 rounded bg-teal/10 px-1.5 py-0.2 text-[10px] font-semibold text-teal-800">
                  {session?.role || 'Senior Advocate'}
                </span>
              </div>

              {/* Persona Switcher */}
              <div className="p-2 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">
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
                            ? 'bg-teal/10 text-teal-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <User className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'text-teal' : 'text-slate-400')} />
                          <div className="truncate">
                            <span className="block truncate leading-tight">{user.name}</span>
                            <span className="block text-[10px] text-slate-400 font-normal leading-tight">
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
                  className="w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
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

export default Topbar
