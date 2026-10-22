'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Briefcase,
  Search,
  Scale,
  Settings,
  ChevronLeft,
  BookOpen,
  LogOut,
  ChevronUp,
  User,
  Check,
} from 'lucide-react'
import { NyayaTraceLogo } from '@/components/logo/NyayaTraceLogo'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useMobileSidebar } from '@/components/layout/MobileSidebarContext'
import { logoutUser, setSession, DEMO_USERS, type UserRecord } from '@/lib/auth'
import { useSession } from '@/hooks/useSession'
import { getAvatar } from '@/lib/avatars'

const PROFILE_KEY = 'nyayatrace_profile'
function readStoredAvatarId(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return undefined
    return (JSON.parse(raw) as { avatarId?: string }).avatarId
  } catch { return undefined }
}

const NAV_ITEMS = [
  { label: 'Overview', href: '/overview', icon: LayoutDashboard },
  { label: 'Cases', href: '/cases', icon: Briefcase },
  { label: 'Verification', href: '/verification', icon: Search },
  { label: 'Bail & Parole', href: '/bail-briefs', icon: Scale },
  { label: 'Concordance', href: '/concordance', icon: BookOpen },
  { label: 'Settings', href: '/settings', icon: Settings },
]

const sidebarVariants = {
  expanded: { width: 240 },
  collapsed: { width: 64 },
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [hasUrgentBail, setHasUrgentBail] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [storedAvatarId, setStoredAvatarId] = useState<string | undefined>(undefined)
  const pathname = usePathname()
  const router = useRouter()
  const session = useSession()
  const { mobileOpen, setMobileOpen } = useMobileSidebar()
  const profileRef = useRef<HTMLDivElement>(null)

  // Keep storedAvatarId in sync with nyayatrace_profile localStorage
  useEffect(() => {
    setStoredAvatarId(readStoredAvatarId())
    function onStorage(e: StorageEvent) {
      if (e.key === PROFILE_KEY) setStoredAvatarId(readStoredAvatarId())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Also refresh when session changes (same-tab save fires SESSION_CHANGE_EVENT)
  useEffect(() => {
    setStoredAvatarId(readStoredAvatarId())
  }, [session])

  const checkAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/overview/alerts')
      if (!res.ok) return
      const data = await res.json() as { total: number }
      setHasUrgentBail(data.total > 0)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    checkAlerts()
    const timer = setInterval(checkAlerts, 5 * 60_000)
    return () => clearInterval(timer)
  }, [checkAlerts])

  // Close profile dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setProfileOpen(false)
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
    } catch { /* ignore */ }
    logoutUser()
    router.replace('/login')
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
      } catch { /* ignore */ }
      router.refresh()
    }
  }

  const avatar = getAvatar(session?.avatarId ?? storedAvatarId)

  return (
    <TooltipProvider delay={0}>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={() => setMobileOpen(false)}
        className={cn('fixed inset-0 z-40 hidden bg-black/70 backdrop-blur-xs md:hidden', mobileOpen && 'block')}
      />
      <motion.aside
        variants={sidebarVariants}
        animate={collapsed ? 'collapsed' : 'expanded'}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'relative z-20 hidden h-full shrink-0 flex-col overflow-hidden border-r border-white/20 bg-midnight-950 md:flex',
          mobileOpen && 'fixed inset-y-0 left-0 z-50 flex w-60 shadow-2xl md:relative md:inset-auto md:z-auto md:shadow-none'
        )}
        style={{ minWidth: 0 }}
      >
        {/* ── Logo ── */}
        <Link
          href="/overview"
          className="flex items-center h-14 px-4 border-b border-white/10 shrink-0 hover:opacity-90 transition-opacity"
        >
          {collapsed ? (
            <NyayaTraceLogo size="sm" variant="gold" />
          ) : (
            <NyayaTraceLogo size="lg" variant="gold" />
          )}
        </Link>

        {/* ── Profile ── */}
        <div className="px-2.5 py-2.5 border-b border-white/10 shrink-0 relative" ref={profileRef}>
          {/* Downward dropdown */}
          {profileOpen && (
            <div className="absolute top-full left-2.5 right-2.5 mt-1 rounded-xl border border-white/10 bg-midnight-900 shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-100 overflow-hidden">
              {/* Identity header */}
              <div className="p-3 border-b border-white/10 bg-white/5">
                <p className="text-xs font-bold truncate text-slate-100">
                  {session?.name || 'Advocate'}
                </p>
                <p className="text-[11px] truncate text-slate-400">
                  {session?.email || ''}
                </p>
                <span className="inline-block mt-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-gold/15 text-gold-light border border-gold/30">
                  {session?.role || 'Senior Advocate'}
                </span>
              </div>

              {/* Persona Switcher */}
              <div className="p-2 border-b border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 px-2 text-slate-500">
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
                            ? 'bg-gold/15 text-gold-light font-semibold'
                            : 'hover:bg-white/8 text-slate-300'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <User className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'text-gold' : 'text-slate-500')} />
                          <div className="truncate">
                            <span className="block truncate leading-tight">{user.name}</span>
                            <span className="block text-[10px] font-normal leading-tight text-slate-500">
                              {user.role}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0 ml-1.5 text-gold" />}
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
                  className="w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}

          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => setProfileOpen((p) => !p)}
                  aria-expanded={profileOpen}
                  aria-label="User menu"
                  className={cn(
                    'group w-full flex items-center gap-2.5 rounded-lg border border-gold/20 bg-gold/[0.04] hover:bg-gold/[0.09] px-2 py-1.5 text-left transition-all duration-200 hover:border-gold/45 cursor-pointer',
                    profileOpen && 'border-gold/50 bg-gold/10 ring-1 ring-gold/20'
                  )}
                >
                  {/* Avatar */}
                  <div className="relative h-7 w-7 shrink-0 rounded-md overflow-hidden border border-gold/30 bg-midnight-800">
                    {avatar.render()}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-midnight-900" />
                  </div>

                  {!collapsed && (
                    <>
                      <div className="flex-1 min-w-0 text-left">
                        <span className="block text-xs font-semibold leading-none truncate text-slate-100 group-hover:text-gold-light transition-colors">
                          {session?.name || 'Advocate'}
                        </span>
                        <span className="block text-[10px] font-medium leading-tight mt-0.5 truncate text-gold-muted">
                          {session?.role || 'Senior Advocate'}
                        </span>
                      </div>
                      <ChevronUp className={cn(
                        'h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-gold/50 group-hover:text-gold',
                        profileOpen && 'rotate-180 text-gold'
                      )} />
                    </>
                  )}
                </button>
              }
            />
            {collapsed && (
              <TooltipContent side="right" className="bg-midnight-900 border-white/10 text-slate-100">
                {session?.name || 'Advocate'}
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1 px-2.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <li key={item.href} className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-gold/15 via-gold/[0.08] to-transparent border border-gold/30 shadow-[0_0_12px_rgba(197,168,128,0.12)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-gradient-to-b from-gold-light via-gold to-gold-dark shadow-[0_0_8px_rgba(229,195,120,0.6)]" />
                  )}

                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Link
                          href={item.href}
                          prefetch={true}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                            isActive
                              ? 'text-gold-light font-semibold'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
                          )}
                        >
                          <div className="relative shrink-0">
                            <Icon
                              size={18}
                              className={cn(
                                'transition-colors duration-200',
                                isActive ? 'text-gold-light' : 'text-slate-400 group-hover:text-gold-light/90'
                              )}
                            />
                            {item.href === '/bail-briefs' && hasUrgentBail && (
                              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-gold-light shadow-[0_0_6px_rgba(229,195,120,0.9)] animate-pulse" />
                            )}
                          </div>
                          {!collapsed && (
                            <span className="overflow-hidden whitespace-nowrap tracking-wide">
                              {item.label}
                            </span>
                          )}
                        </Link>
                      }
                    />
                    {collapsed && (
                      <TooltipContent side="right" className="bg-midnight-900 border-white/10 text-slate-100">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* ── Bottom Section ── */}
        <div className="border-t border-white/10 px-2.5 py-3 shrink-0 flex flex-col gap-2">

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden w-full items-center justify-center rounded-lg py-2 text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-gold-light md:flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <ChevronLeft size={16} />
            </motion.div>
          </button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}

export default Sidebar
