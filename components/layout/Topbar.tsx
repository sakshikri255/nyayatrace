'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, LogOut } from 'lucide-react'
import { useMobileSidebar } from '@/components/layout/MobileSidebarContext'
import { CommandPalette } from '@/components/layout/CommandPalette'
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
  const session = getSession()

  function handleLogout() {
    logoutUser()
    router.replace('/login')
  }

  return (
    <header className="flex items-center h-14 px-6 bg-offwhite border-b border-gray-200 shrink-0">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
        className="mr-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      {/* Left: title + breadcrumb */}
      <div className="flex flex-col justify-center min-w-0 mr-auto">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              {i === breadcrumb.length - 1 ? (
                <span aria-current="page" className="text-gray-600 font-medium">
                  {crumb}
                </span>
              ) : (
                <Link href="/overview" className="hover:text-gray-600">
                  {crumb}
                </Link>
              )}
            </span>
          ))}
        </div>
        <h1 className="text-base font-semibold text-gray-900 leading-tight truncate">
          {title}
        </h1>
      </div>

      {/* Center: Command Palette */}
      <CommandPalette />

      {/* Right: user + sign out */}
      <div className="ml-3 flex items-center gap-3 shrink-0">
        {session && (
          <span className="hidden sm:block text-xs text-gray-500 max-w-[140px] truncate">
            {session.name}
          </span>
        )}
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-colors"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}

export default Topbar