'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'

type CaseTabThemeEvent = CustomEvent<{ tab: string }>

function isDarkRoute(pathname: string, tab: string | null) {
  if (pathname === '/overview' || pathname === '/settings') return true
  return /^\/cases\/\d+$/.test(pathname) && (tab ?? 'overview') === 'overview'
}

export function RouteThemeController() {
  const pathname = usePathname()
  const { setTheme } = useTheme()

  useEffect(() => {
    const applyRouteTheme = (tab: string | null) => {
      setTheme(isDarkRoute(pathname, tab) ? 'dark' : 'light')
    }

    const currentTab = new URLSearchParams(window.location.search).get('tab')
    applyRouteTheme(currentTab)

    const handleCaseTabChange = (event: Event) => {
      const { detail } = event as CaseTabThemeEvent
      applyRouteTheme(detail.tab)
    }

    window.addEventListener('nyaya:case-tab-change', handleCaseTabChange)
    return () => window.removeEventListener('nyaya:case-tab-change', handleCaseTabChange)
  }, [pathname, setTheme])

  return null
}
