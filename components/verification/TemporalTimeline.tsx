'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Info, Clock, GitBranch, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { TemporalAnalysisResult, ExtractedEvent, TemporalContradiction } from '@/lib/analysis/temporalContradictions'

interface TemporalTimelineProps {
  caseId: number
}

const SEVERITY_STYLE: Record<string, { icon: typeof AlertTriangle; className: string; label: string }> = {
  critical: {
    icon: AlertTriangle,
    className: 'border-rose-300 bg-rose-50 text-rose-800',
    label: 'Critical',
  },
  warning: {
    icon: Clock,
    className: 'border-amber-300 bg-amber-50 text-amber-800',
    label: 'Warning',
  },
  info: {
    icon: Info,
    className: 'border-slate-200 bg-slate-50 text-slate-700',
    label: 'Info',
  },
}

function ContradictionCard({ contradiction, onHighlight }: {
  contradiction: TemporalContradiction
  onHighlight?: (docId: number, page: number) => void
}) {
  const style = SEVERITY_STYLE[contradiction.severity] ?? SEVERITY_STYLE.info
  const Icon = style.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-lg border p-3 text-xs', style.className)}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              contradiction.severity === 'critical' ? 'bg-rose-200 text-rose-800' :
              contradiction.severity === 'warning' ? 'bg-amber-200 text-amber-800' :
              'bg-slate-200 text-slate-700'
            )}>
              {style.label}
            </span>
            <span className="text-[10px] text-slate-500 uppercase font-medium">
              {contradiction.type.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="leading-relaxed">{contradiction.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => onHighlight?.(contradiction.sourceA.documentId, contradiction.sourceA.pageNumber)}
              className="rounded px-1.5 py-0.5 bg-white/70 border border-current/30 hover:bg-white transition-colors font-medium"
            >
              {contradiction.sourceA.documentName} p.{contradiction.sourceA.pageNumber}
            </button>
            <button
              onClick={() => onHighlight?.(contradiction.sourceB.documentId, contradiction.sourceB.pageNumber)}
              className="rounded px-1.5 py-0.5 bg-white/70 border border-current/30 hover:bg-white transition-colors font-medium"
            >
              {contradiction.sourceB.documentName} p.{contradiction.sourceB.pageNumber}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function TimelineEvent({ event }: { event: ExtractedEvent }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex flex-col items-center shrink-0">
        <div className="h-2 w-2 rounded-full bg-teal-500 mt-1" />
        <div className="w-px flex-1 bg-slate-200 mt-0.5 min-h-[1rem]" />
      </div>
      <div className="pb-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className="text-xs font-mono font-semibold text-slate-800">{event.dateStr}</span>
          {event.timeStr && (
            <span className="text-[10px] text-slate-500 font-mono">{event.timeStr}</span>
          )}
          <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={event.documentName}>
            {event.documentName} p.{event.pageNumber}
          </span>
        </div>
        <p className="text-xs font-medium text-slate-700">{event.eventDescription}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{event.context}</p>
      </div>
    </div>
  )
}

export function TemporalTimeline({ caseId }: TemporalTimelineProps) {
  const [result, setResult] = useState<TemporalAnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'contradictions' | 'timeline'>('contradictions')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/cases/${caseId}/temporal-analysis`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setResult(data as TemporalAnalysisResult)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load temporal analysis.')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [caseId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">Analyzing document timelines…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-rose-600">{error}</div>
    )
  }

  if (!result) return null

  const criticalCount = result.contradictions.filter((c) => c.severity === 'critical').length
  const warningCount = result.contradictions.filter((c) => c.severity === 'warning').length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-200 bg-slate-50 text-xs shrink-0">
        <div className="flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-600"><strong>{result.eventCount}</strong> events</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'font-bold',
              criticalCount > 0 ? 'text-rose-600' : 'text-slate-500'
            )}
          >
            {criticalCount}
          </span>
          <span className="text-slate-500">critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn('font-bold', warningCount > 0 ? 'text-amber-600' : 'text-slate-500')}>
            {warningCount}
          </span>
          <span className="text-slate-500">warnings</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <span className="text-slate-500">{result.documentCount} doc{result.documentCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Tab switch */}
      <div className="flex border-b border-slate-200 bg-white shrink-0 px-4 pt-2 gap-4">
        <button
          onClick={() => setTab('contradictions')}
          className={cn(
            'pb-2 text-xs font-semibold border-b-2 transition-colors',
            tab === 'contradictions' ? 'border-teal-500 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          Contradictions ({result.contradictionCount})
        </button>
        <button
          onClick={() => setTab('timeline')}
          className={cn(
            'pb-2 text-xs font-semibold border-b-2 transition-colors',
            tab === 'timeline' ? 'border-teal-500 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          Timeline ({result.eventCount})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'contradictions' ? (
          <div className="p-4 flex flex-col gap-3">
            {result.contradictions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm gap-2">
                <Info className="h-8 w-8 opacity-40" />
                <p>No temporal contradictions detected across documents.</p>
              </div>
            ) : (
              result.contradictions.map((c, i) => (
                <ContradictionCard key={i} contradiction={c} />
              ))
            )}
          </div>
        ) : (
          <div className="p-4">
            {result.events.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-12">No date references found in documents.</div>
            ) : (
              <div>
                {result.events.map((event, i) => (
                  <TimelineEvent key={i} event={event} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
