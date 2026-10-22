'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Briefcase,
  Search,
  Scale,
  Settings,
  ChevronLeft,
  BookOpen,
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
  const pathname = usePathname()
  const { mobileOpen, setMobileOpen } = useMobileSidebar()

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
          'relative hidden h-full shrink-0 flex-col overflow-hidden border-r border-white/10 bg-midnight-950 md:flex',
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
        <div className="border-t border-white/10 px-2.5 py-3 shrink-0">
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
