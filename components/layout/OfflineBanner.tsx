'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOffline(!navigator.onLine)

    function handleOnline() { setIsOffline(false) }
    function handleOffline() { setIsOffline(true) }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/90 px-4 py-2.5 text-xs font-medium text-amber-200 shadow-2xl backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <WifiOff size={14} className="text-amber-400 shrink-0" />
          You are offline — showing cached data
        </motion.div>
      )}
    </AnimatePresence>
  )
}
