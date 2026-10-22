'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

export type UrgencyItem = {
  id: string
  label: string
  href: string
  level: 'critical' | 'warning' | 'info'
}

interface UrgencyTickerProps {
  items: UrgencyItem[]
}

const LEVEL_STYLES = {
  critical: 'text-rose-400 hover:text-rose-300',
  warning: 'text-gold-light hover:text-gold',
  info: 'text-slate-300 hover:text-white',
}

const LEVEL_DOTS = {
  critical: '🚨',
  warning: '⚠️',
  info: '⚖️',
}

export function UrgencyTicker({ items }: UrgencyTickerProps) {
  if (items.length === 0) return null

  return (
    <div
      className={cn(
        'no-print flex-shrink-0 bg-midnight-950/95 border-b border-white/8 px-4 py-1.5 overflow-hidden backdrop-blur-md'
      )}
      role="marquee"
      aria-label="Urgent case alerts"
    >
      <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gold shrink-0 mr-4 border-r border-white/10 pr-4">
          Alerts
        </span>
        <div className="flex items-center gap-0 flex-nowrap">
          {items.map((item, idx) => (
            <span key={item.id} className="flex items-center gap-0 shrink-0">
              <Link
                href={item.href}
                className={cn(
                  'text-xs font-medium transition-colors flex items-center gap-1.5 px-2 whitespace-nowrap',
                  LEVEL_STYLES[item.level]
                )}
              >
                <span>{LEVEL_DOTS[item.level]}</span>
                {item.label}
              </Link>
              {idx < items.length - 1 && (
                <span className="text-white/20 text-xs px-1 select-none">·</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
