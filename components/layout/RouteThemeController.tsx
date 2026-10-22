'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'

const DARK_ROUTES = ['/overview', '/settings']

export function RouteThemeController() {
  const pathname = usePathname()
  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme(DARK_ROUTES.includes(pathname) ? 'dark' : 'light')
  }, [pathname, setTheme])

  return null
}
