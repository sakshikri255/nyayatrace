'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  FileText,
  Gavel,
  Scale,
  Sparkles,
  Info,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ChronologyReport, ChronologyEvent } from '@/lib/analysis/chronology'

interface AnimatedCheckpointTimelineProps {
  caseId: number
  caseNumber?: string
  caseTitle?: string
  onClose?: () => void
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; badge: string; ring: string }
> = {
  remand: {
    label: 'Custody Remand',
    icon: Clock,
    color: 'bg-teal-500 text-white',
    badge: 'bg-teal-500/10 text-teal-700 border-teal-200',
    ring: 'ring-teal-400',
  },
  statutory_bail: {
    label: 'Statutory Bail Deadline',
    icon: ShieldAlert,
    color: 'bg-rose-500 text-white',
    badge: 'bg-rose-500/10 text-rose-700 border-rose-200',
    ring: 'ring-rose-400',
  },
  chargesheet: {
    label: 'Chargesheet Filing',
    icon: CheckCircle2,
    color: 'bg-emerald-500 text-white',
    badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
    ring: 'ring-emerald-400',
  },
  hearing: {
    label: 'Court Hearing',
    icon: Calendar,
    color: 'bg-blue-500 text-white',
    badge: 'bg-blue-500/10 text-blue-700 border-blue-200',
    ring: 'ring-blue-400',
  },
  order: {
    label: 'Judicial Order',
    icon: Gavel,
    color: 'bg-purple-500 text-white',
    badge: 'bg-purple-500/10 text-purple-700 border-purple-200',
    ring: 'ring-purple-400',
  },
  discrepancy: {
    label: 'Contradiction / Conflict',
    icon: AlertTriangle,
    color: 'bg-amber-500 text-white',
    badge: 'bg-amber-500/10 text-amber-700 border-amber-200',
    ring: 'ring-amber-400',
  },
  incident: {
    label: 'Incident Scene',
    icon: Clock,
    color: 'bg-slate-600 text-white',
    badge: 'bg-slate-500/10 text-slate-700 border-slate-200',
    ring: 'ring-slate-400',
  },
  fir: {
    label: 'FIR Registered',
    icon: FileText,
    color: 'bg-slate-800 text-white',
    badge: 'bg-slate-800/10 text-slate-800 border-slate-300',
    ring: 'ring-slate-700',
  },
  arrest: {
    label: 'Formal Arrest',
    icon: ShieldAlert,
    color: 'bg-red-600 text-white',
    badge: 'bg-red-500/10 text-red-700 border-red-200',
    ring: 'ring-red-400',
  },
  general: {
    label: 'Milestone',
    icon: Scale,
    color: 'bg-slate-500 text-white',
    badge: 'bg-slate-500/10 text-slate-700 border-slate-200',
    ring: 'ring-slate-400',
  },
}

export function AnimatedCheckpointTimeline({
  caseId,
  caseNumber,
  caseTitle,
  onClose,
}: AnimatedCheckpointTimelineProps) {
  const [data, setData] = useState<ChronologyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [copied, setCopied] = useState(false)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    async function fetchChronology() {
      try {
        setLoading(true)
        const res = await fetch(`/api/cases/${caseId}/chronology`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
          setCurrentIndex(0)
        }
      } catch (err) {
        console.error('Failed to load chronology', err)
      } finally {
        setLoading(false)
      }
    }
    fetchChronology()
  }, [caseId])

  const events = data?.events || []
  const filteredEvents = events.filter((ev) => {
    if (filterCategory === 'all') return true
    if (filterCategory === 'custody')
      return ['remand', 'statutory_bail', 'chargesheet', 'arrest'].includes(ev.category)
    if (filterCategory === 'court') return ['hearing', 'order'].includes(ev.category)
    if (filterCategory === 'conflicts') return ev.category === 'discrepancy' || ev.hasConflict
    return true
  })

  // Keep index within bounds if filter changes
  useEffect(() => {
    if (currentIndex >= filteredEvents.length && filteredEvents.length > 0) {
      setCurrentIndex(0)
    }
  }, [filterCategory, filteredEvents.length, currentIndex])

  // Autoplay sequencer
  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => {
          if (prev < filteredEvents.length - 1) {
            return prev + 1
          } else {
            setIsPlaying(false)
            return prev
          }
        })
      }, 4000)
    }
    return () => {
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current)
    }
  }, [isPlaying, currentIndex, filteredEvents.length])

  // Auto-scroll checkpoint into view in horizontal scroller only
  useEffect(() => {
    const container = scrollContainerRef.current
    const el = document.getElementById(`checkpoint-btn-${currentIndex}`)
    if (container && el) {
      const scrollOffset = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2
      container.scrollTo({ left: Math.max(0, scrollOffset), behavior: 'smooth' })
    }
  }, [currentIndex])

  const activeEvent: ChronologyEvent | undefined = filteredEvents[currentIndex]
  const activeCfg = activeEvent
    ? CATEGORY_CONFIG[activeEvent.category] || CATEGORY_CONFIG.general
    : CATEGORY_CONFIG.general

  function copyBrief() {
    if (!activeEvent) return
    const text = `Case: ${caseTitle || caseNumber || 'Case #' + caseId}
Milestone: ${activeEvent.title}
Date: ${activeEvent.date}
Category: ${activeEvent.category.toUpperCase()}
Source: ${activeEvent.source}
Brief: ${activeEvent.description}
${activeEvent.hasConflict ? `\n[CONFLICT FLAG]: ${activeEvent.conflictReason}` : ''}`

    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Stage brief copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/5 rounded-2xl border border-slate-200">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          <Clock className="w-5 h-5 text-teal-600 absolute" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">Synthesizing Checkpoint Chronology…</p>
        <p className="text-xs text-slate-400 mt-1">Cross-referencing custody remands, hearings, and evidence dates</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">No Chronology Checkpoints Yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Add custody remand dates, hearings, or upload documents to generate an automated interactive checkpoint timeline.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close View
          </button>
        )}
      </div>
    )
  }

  const completionPercent = filteredEvents.length > 1
    ? (currentIndex / (filteredEvents.length - 1)) * 100
    : 100

  return (
    <div className="flex flex-col gap-6 bg-slate-900 text-white rounded-2xl p-5 sm:p-7 shadow-xl border border-slate-800 overflow-hidden relative">
      {/* Ambient background glow accents */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Controller */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4 relative z-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-400" />
              Chronology Journey
            </span>
            {caseNumber && (
              <span className="font-mono text-xs text-slate-400 font-semibold">{caseNumber}</span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {caseTitle || `Case #${caseId} Timeline`}
          </h2>
          {data?.dateRange && (
            <p className="text-xs text-slate-400" suppressHydrationWarning>
              Spans {data.dateRange.firstDate || '—'} to {data.dateRange.lastDate || '—'} (
              {data.dateRange.totalDays} days in total)
            </p>
          )}
        </div>

        {/* Playback & Sequencer Controls */}
        <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur-md rounded-xl p-1.5 border border-slate-700/60 shadow-inner">
          <button
            onClick={() => {
              setCurrentIndex(0)
              setIsPlaying(false)
            }}
            title="Reset to start"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setIsPlaying(false)
              setCurrentIndex((prev) => Math.max(0, prev - 1))
            }}
            disabled={currentIndex === 0}
            title="Previous checkpoint"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying((p) => !p)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-md',
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
            )}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Sequence</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false)
              setCurrentIndex((prev) => Math.min(filteredEvents.length - 1, prev + 1))
            }}
            disabled={currentIndex >= filteredEvents.length - 1}
            title="Next checkpoint"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <span className="font-mono text-xs font-semibold px-2 text-slate-300">
            {currentIndex + 1} / {filteredEvents.length}
          </span>
        </div>
      </div>

      {/* Filter Category Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs relative z-10">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 mr-1 text-[11px] font-medium">Filter Path:</span>
          {[
            { id: 'all', label: `All Checkpoints (${events.length})` },
            { id: 'custody', label: 'Custody & Remand' },
            { id: 'court', label: 'Hearings & Orders' },
            { id: 'conflicts', label: `Conflicts (${data?.conflicts.length || 0})` },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                filterCategory === cat.id
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {activeEvent && (
          <div className="flex items-center gap-2">
            <button
              onClick={copyBrief}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Brief'}</span>
            </button>
            <Link
              href={`/cases/${caseId}`}
              className="inline-flex items-center gap-1 text-xs text-teal-400 hover:underline"
            >
              <span>Workspace</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* ── Checkpoints Track / Horizontal Conduit ────────────────────────── */}
      <div className="relative py-4 px-2 select-none">
        {/* Glowing conduit line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-slate-800 rounded-full" />
        <motion.div
          className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(20,184,166,0.6)]"
          initial={false}
          animate={{ width: `${Math.max(4, completionPercent)}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />

        {/* Scrollable Checkpoint Nodes */}
        <div
          ref={scrollContainerRef}
          className="relative flex items-center justify-between gap-6 overflow-x-auto py-4 px-3 scrollbar-none z-10"
        >
          {filteredEvents.map((ev, idx) => {
            const cfg = CATEGORY_CONFIG[ev.category] || CATEGORY_CONFIG.general
            const Icon = cfg.icon
            const isSelected = idx === currentIndex
            const isPast = idx < currentIndex
            const isConflict = ev.hasConflict

            return (
              <button
                key={ev.id}
                id={`checkpoint-btn-${idx}`}
                onClick={() => {
                  setCurrentIndex(idx)
                  setIsPlaying(false)
                }}
                className="group relative flex flex-col items-center shrink-0 focus:outline-hidden max-w-[130px]"
              >
                {/* Node Pill Date */}
                <span
                  className={cn(
                    'text-[10px] font-mono font-medium mb-2 px-1.5 py-0.5 rounded transition-all max-w-[120px] truncate',
                    isSelected
                      ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40 shadow-xs'
                      : isPast
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  )}
                  title={ev.date}
                >
                  {ev.date}
                </span>

                {/* Node Orb */}
                <div className="relative flex items-center justify-center">
                  {isSelected && (
                    <motion.div
                      layoutId="checkpoint-glow"
                      className="absolute -inset-2 rounded-full bg-teal-400/30 blur-xs animate-pulse"
                    />
                  )}
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'relative flex items-center justify-center rounded-full transition-all duration-300',
                      isSelected
                        ? `h-10 w-10 ring-4 ring-offset-2 ring-offset-slate-900 ${cfg.color} ${cfg.ring} shadow-lg shadow-teal-500/20`
                        : isPast
                        ? 'h-8 w-8 bg-slate-700 text-slate-300 ring-2 ring-slate-600'
                        : 'h-7 w-7 bg-slate-800 text-slate-500 ring-1 ring-slate-700 hover:text-slate-300 hover:bg-slate-700'
                    )}
                  >
                    <Icon className={cn(isSelected ? 'w-5 h-5' : 'w-3.5 h-3.5')} />

                    {/* Exclamation badge for conflict */}
                    {isConflict && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black shadow-xs ring-1 ring-slate-900 animate-ping" />
                    )}
                    {isConflict && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black shadow-xs ring-1 ring-slate-900">
                        !
                      </span>
                    )}
                  </motion.div>
                </div>

                {/* Node Stage Label */}
                <span
                  className={cn(
                    'mt-2 text-[11px] font-medium max-w-[120px] text-center line-clamp-1 truncate transition-colors',
                    isSelected ? 'text-white font-semibold' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                  title={ev.title}
                >
                  {ev.title.replace(/^Hearing: |^Judicial Order: /i, '')}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Active Checkpoint Brief Card ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeEvent && (
          <motion.div
            key={activeEvent.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'rounded-xl border p-5 sm:p-6 backdrop-blur-md transition-all',
              activeEvent.hasConflict
                ? 'bg-rose-950/30 border-rose-500/40 shadow-rose-900/10'
                : 'bg-slate-800/80 border-slate-700/80 shadow-inner'
            )}
          >
            {/* Brief Card Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-900 text-teal-300 border border-slate-700">
                  Checkpoint {currentIndex + 1}
                </span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border',
                    activeCfg.badge
                  )}
                >
                  {activeCfg.label}
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {activeEvent.date}
                </span>
              </div>

              {activeEvent.source && (
                <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900/70 px-2.5 py-1 rounded-md border border-slate-700/50">
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  <span>Source: {activeEvent.source}</span>
                </span>
              )}
            </div>

            {/* Stage Title */}
            <h3 className="text-base sm:text-lg font-bold text-white mt-3">
              {activeEvent.title}
            </h3>

            {/* Detailed Stage Brief */}
            <div className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-lg border border-slate-800 font-normal">
              {activeEvent.description}
            </div>

            {/* Inconsistency / Conflict Alert Callout */}
            {activeEvent.hasConflict && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 rounded-xl border border-rose-500/60 bg-gradient-to-r from-rose-900/40 to-rose-950/20 p-4"
              >
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4 text-rose-400 animate-pulse" />
                  <span>Analytical Inconsistency / Ground of Challenge</span>
                </div>
                <p className="mt-1.5 text-xs text-rose-200 leading-relaxed">
                  {activeEvent.conflictReason || 'Detected chronological contradiction in record timestamps.'}
                </p>
              </motion.div>
            )}

            {/* Quick Navigation Footer */}
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/40">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-teal-400" />
                Use arrow buttons or playback to step through the chronological story
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                  disabled={currentIndex === 0}
                  className="px-2.5 py-1 rounded-md bg-slate-700/60 hover:bg-slate-700 text-slate-200 disabled:opacity-30 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <button
                  onClick={() => setCurrentIndex((p) => Math.min(filteredEvents.length - 1, p + 1))}
                  disabled={currentIndex >= filteredEvents.length - 1}
                  className="px-2.5 py-1 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold disabled:opacity-30 transition-colors flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
