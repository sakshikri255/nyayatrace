'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Briefcase,
  Search,
  Scale,
  TrendingUp,
  FileText,
  Settings,
  ChevronLeft,
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
  { label: 'Case Progress', href: '/case-progress', icon: TrendingUp },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'Settings', href: '/settings', icon: Settings },
]

const sidebarVariants = {
  expanded: { width: 240 },
  collapsed: { width: 64 },
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { mobileOpen, setMobileOpen } = useMobileSidebar()

  return (
    <TooltipProvider delay={0}>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={() => setMobileOpen(false)}
        className={cn('fixed inset-0 z-40 hidden bg-slate-950/50 md:hidden', mobileOpen && 'block')}
      />
      <motion.aside
        variants={sidebarVariants}
        animate={collapsed ? 'collapsed' : 'expanded'}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'relative hidden h-full shrink-0 flex-col overflow-hidden border-r border-border-dark bg-navy md:flex',
          mobileOpen && 'fixed inset-y-0 left-0 z-50 flex w-60 shadow-2xl md:relative md:inset-auto md:z-auto md:shadow-none'
        )}
        style={{ minWidth: 0 }}
      >
        {/* ── Logo ── */}
        <div className="flex items-center h-14 px-4 border-b border-border-dark shrink-0">
          {collapsed ? (
            <NyayaTraceLogo size="sm" variant="light" />
          ) : (
            <NyayaTraceLogo size="lg" variant="light" />
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-0.5 px-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <li key={item.href} className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 rounded-md bg-charcoal"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-teal" />
                  )}

                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Link
                          href={item.href}
                          prefetch={true}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                            isActive
                              ? 'text-teal-light'
                              : 'text-muted hover:text-offwhite hover:bg-charcoal/60'
                          )}
                        >
                          <Icon
                            size={18}
                            className={cn(
                              'shrink-0 transition-colors',
                              isActive ? 'text-teal-light' : 'text-muted'
                            )}
                          />
                          <AnimatePresence initial={false}>
                            {!collapsed && (
                              <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden whitespace-nowrap"
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </Link>
                      }
                    />
                    {collapsed && (
                      <TooltipContent side="right">
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
        <div className="border-t border-border-dark px-2 py-3 shrink-0">
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden w-full items-center justify-center rounded-md py-2 text-muted transition-colors hover:bg-charcoal/60 hover:text-offwhite md:flex"
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
