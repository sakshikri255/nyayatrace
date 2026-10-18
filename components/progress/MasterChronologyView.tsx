'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  AlertTriangle,
  Clock,
  FileText,
  Gavel,
  ShieldAlert,
  CheckCircle2,
  Filter,
} from 'lucide-react'
import type { ChronologyReport, ChronologyEvent } from '@/lib/analysis/chronology'
import { cn } from '@/lib/utils'

interface MasterChronologyViewProps {
  caseId: number
}

const CATEGORY_STYLES: Record<
  ChronologyEvent['category'],
  { icon: React.ElementType; color: string; badge: string }
> = {
  remand: { icon: Clock, color: 'bg-teal-500 text-white', badge: 'bg-teal-50 text-teal-800' },
  statutory_bail: {
    icon: ShieldAlert,
    color: 'bg-rose-500 text-white',
    badge: 'bg-rose-50 text-rose-800',
  },
  chargesheet: {
    icon: CheckCircle2,
    color: 'bg-emerald-500 text-white',
    badge: 'bg-emerald-50 text-emerald-800',
  },
  hearing: { icon: Calendar, color: 'bg-blue-500 text-white', badge: 'bg-blue-50 text-blue-800' },
  order: { icon: Gavel, color: 'bg-purple-500 text-white', badge: 'bg-purple-50 text-purple-800' },
  discrepancy: {
    icon: AlertTriangle,
    color: 'bg-amber-500 text-white',
    badge: 'bg-amber-50 text-amber-800',
  },
  incident: { icon: Clock, color: 'bg-slate-500 text-white', badge: 'bg-slate-50 text-slate-800' },
  fir: { icon: FileText, color: 'bg-slate-700 text-white', badge: 'bg-slate-100 text-slate-800' },
  arrest: { icon: Clock, color: 'bg-red-500 text-white', badge: 'bg-red-50 text-red-800' },
  general: { icon: Calendar, color: 'bg-slate-400 text-white', badge: 'bg-slate-50 text-slate-700' },
}

export function MasterChronologyView({ caseId }: MasterChronologyViewProps) {
  const [data, setData] = useState<ChronologyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    async function fetchChronology() {
      try {
        const res = await fetch(`/api/cases/${caseId}/chronology`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Failed to load chronology', err)
      } finally {
        setLoading(false)
      }
    }
    fetchChronology()
  }, [caseId])

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        Synthesizing dates and detecting chronological conflicts...
      </div>
    )
  }

  if (!data || data.events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
        <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-700">No Chronological Events Found</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Record custody remand dates, judicial orders, or upload exhibits with incident dates to generate an automated timeline.
        </p>
      </div>
    )
  }

  const filteredEvents = data.events.filter((ev) => {
    if (filterCategory === 'all') return true
    if (filterCategory === 'custody')
      return ['remand', 'statutory_bail', 'chargesheet', 'arrest'].includes(ev.category)
    if (filterCategory === 'court') return ['hearing', 'order'].includes(ev.category)
    if (filterCategory === 'discrepancy') return ev.category === 'discrepancy' || ev.hasConflict
    return true
  })

  return (
    <div className="space-y-6">
      {/* Conflicts Alert Box */}
      {data.conflicts.length > 0 && (
        <div className="rounded-xl border border-rose-300 bg-gradient-to-r from-rose-50 to-white p-4">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Detected Chronological Inconsistencies ({data.conflicts.length})</span>
          </div>
          <div className="mt-2 space-y-2">
            {data.conflicts.map((c, i) => (
              <div key={i} className="text-xs text-rose-900 bg-white/80 rounded-md p-2.5 border border-rose-200/60">
                <strong className="block font-semibold">{c.title}</strong>
                <p className="text-rose-700 mt-0.5">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>
            Span: <strong>{data.dateRange.firstDate ?? '—'}</strong> to{' '}
            <strong>{data.dateRange.lastDate ?? '—'}</strong> ({data.dateRange.totalDays} days)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          {['all', 'custody', 'court', 'discrepancy'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                filterCategory === cat
                  ? 'bg-teal text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Tree */}
      <div className="relative pl-6 space-y-6 before:absolute before:bottom-0 before:left-2.5 before:top-2 before:w-0.5 before:bg-slate-200">
        {filteredEvents.map((ev) => {
          const cfg = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.general
          const Icon = cfg.icon

          return (
            <div key={ev.id} className="relative group">
              {/* Dot Icon */}
              <div
                className={cn(
                  'absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white shadow-xs',
                  cfg.color
                )}
              >
                <Icon className="h-2.5 w-2.5" />
              </div>

              {/* Event Card */}
              <div
                className={cn(
                  'rounded-xl border p-4 text-xs transition-shadow hover:shadow-md bg-white',
                  ev.hasConflict
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-slate-200/90'
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{ev.date}</span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        cfg.badge
                      )}
                    >
                      {ev.category.replace('_', ' ')}
                    </span>
                  </div>

                  {ev.source && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {ev.source}
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <h4 className="font-semibold text-slate-800 text-xs">{ev.title}</h4>
                  <p className="mt-1 leading-relaxed text-slate-600">{ev.description}</p>
                </div>

                {ev.hasConflict && ev.conflictReason && (
                  <div className="mt-3 rounded-md bg-rose-100/70 p-2 text-rose-800 text-[11px] border border-rose-200">
                    <strong>Conflict Flag:</strong> {ev.conflictReason}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
