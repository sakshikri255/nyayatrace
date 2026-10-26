'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'

const DISMISSED_KEY = 'nyayasetu_pwa_install_dismissed'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if already dismissed
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (dismissed) return

    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    setShow(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-gold/30 bg-midnight-900/95 px-4 py-3 text-xs text-slate-200 shadow-2xl backdrop-blur-sm max-w-xs"
          role="alert"
        >
          <Download size={16} className="text-gold shrink-0" />
          <span className="flex-1">
            Install NyayaSetu for offline access
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-md bg-gradient-to-r from-gold-muted via-gold to-gold-light px-2.5 py-1 text-[11px] font-semibold text-midnight-950 hover:brightness-110 transition-colors"
            >
              Install
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-md p-1 text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
