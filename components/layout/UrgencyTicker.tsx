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
  critical: 'text-rose-300',
  warning: 'text-amber-300',
  info: 'text-sky-300',
}

const LEVEL_DOTS = {
  critical: '🚨',
  warning: '⚠️',
  info: '🔵',
}

export function UrgencyTicker({ items }: UrgencyTickerProps) {
  if (items.length === 0) return null

  return (
    <div
      className={cn(
        'no-print flex-shrink-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900',
        'border-b border-slate-700/60 px-4 py-1.5 overflow-hidden'
      )}
      role="marquee"
      aria-label="Urgent case alerts"
    >
      <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 shrink-0 mr-4 border-r border-slate-700 pr-4">
          Alerts
        </span>
        <div className="flex items-center gap-0 flex-nowrap">
          {items.map((item, idx) => (
            <span key={item.id} className="flex items-center gap-0 shrink-0">
              <Link
                href={item.href}
                className={cn(
                  'text-xs font-medium transition-opacity hover:opacity-80 flex items-center gap-1.5 px-2 whitespace-nowrap',
                  LEVEL_STYLES[item.level]
                )}
              >
                <span>{LEVEL_DOTS[item.level]}</span>
                {item.label}
              </Link>
              {idx < items.length - 1 && (
                <span className="text-slate-600 text-xs px-1 select-none">·</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
