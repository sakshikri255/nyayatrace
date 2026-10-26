'use client'

import { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function NavigationProgressBarInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const [showSpinner, setShowSpinner] = useState(false)

  // Listen to link clicks across the entire app
  useEffect(() => {
    function handleAnchorClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return

      const href = target.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      if (target.target === '_blank') return

      try {
        const nextUrl = new URL(href, window.location.href)
        const currentUrl = new URL(window.location.href)

        // Only trigger for internal route changes to different path
        if (
          nextUrl.origin === currentUrl.origin &&
          (nextUrl.pathname !== currentUrl.pathname || nextUrl.search !== currentUrl.search)
        ) {
          setVisible(true)
          setProgress(25)
          setShowSpinner(true)

          // Gradually advance while waiting for the route to change
          const timer1 = setTimeout(() => setProgress(55), 150)
          const timer2 = setTimeout(() => setProgress(75), 450)
          const timer3 = setTimeout(() => setProgress(88), 900)

          return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
            clearTimeout(timer3)
          }
        }
      } catch {
        // invalid URL
      }
    }

    document.addEventListener('click', handleAnchorClick, { capture: true })
    return () => document.removeEventListener('click', handleAnchorClick, { capture: true })
  }, [])

  // When pathname or searchParams change, complete and hide
  useEffect(() => {
    if (visible) {
      setProgress(100)
      setShowSpinner(false)
      const timeout = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 250)
      return () => clearTimeout(timeout)
    }
  }, [pathname, searchParams, visible])

  return (
    <>
      {/* ── Top progress bar ── */}
      {(visible || progress > 0) && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 right-0 z-[9999] h-[2.5px] overflow-hidden"
        >
          <div
            className="h-full bg-gradient-to-r from-gold-muted via-gold to-gold-light shadow-[0_0_10px_rgba(229,195,120,0.8),0_0_5px_rgba(197,168,128,0.6)] transition-all duration-200 ease-out"
            style={{
              width: `${progress}%`,
              opacity: visible ? 1 : 0,
            }}
          />
        </div>
      )}

      {/* ── Spinner overlay (only for slow navigations ≥ 400 ms) ── */}
      {showSpinner && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[9998] flex items-center justify-center"
        >
          {/* Subtle frosted backdrop */}
          <div className="absolute inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-[1px]" />

          {/* Spinner card */}
          <div className="relative flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-8 py-6 shadow-xl dark:border-slate-700/60 dark:bg-slate-900/80">
            <div className="relative h-10 w-10">
              {/* Track */}
              <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-700" />
              {/* Arc */}
              <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-teal" />
            </div>
            <p className="animate-pulse text-[12px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
              Loading…
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBarInner />
    </Suspense>
  )
}
