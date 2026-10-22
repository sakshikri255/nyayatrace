'use client'

import { useTheme } from 'next-themes'
import { SunIcon, MoonIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle({ dark }: { dark?: boolean } = {}) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — render only after mount
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-md border ${dark ? 'border-white/15' : 'border-[var(--section-card-border)]'}`} />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
        dark
          ? 'border-white/15 text-slate-400 hover:bg-white/8 hover:text-slate-200'
          : 'border-[var(--section-card-border)] text-[var(--section-subheading)] hover:bg-[var(--muted)] hover:text-[var(--section-heading)]'
      }`}
    >
      {isDark ? (
        <SunIcon className="h-4 w-4" />
      ) : (
        <MoonIcon className="h-4 w-4" />
      )}
    </button>
  )
}
