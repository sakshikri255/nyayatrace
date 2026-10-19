'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface HearingEntry {
  id: number
  caseId: number
  hearingDate: string
  eventType: string
  description: string | null
  outcome: string | null
  adjournmentReason: string | null
  judge: string | null
  court: string | null
  caseNumber: string
  caseTitle: string
  caseType: string
  caseStatus: string
}

interface CauseListResponse {
  fromDate: string
  toDate: string
  totalHearings: number
  byDate: Record<string, HearingEntry[]>
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  bail_hearing: 'Bail Hearing',
  charge_framing: 'Charge Framing',
  arguments: 'Arguments',
  judgment: 'Judgment',
  order: 'Order',
  adjournment: 'Adjournment',
}

const CASE_TYPE_COLORS: Record<string, string> = {
  bail: 'border-teal-300 bg-teal-50 text-teal-800',
  parole: 'border-violet-300 bg-violet-50 text-violet-800',
  criminal: 'border-rose-300 bg-rose-50 text-rose-800',
  civil: 'border-blue-300 bg-blue-50 text-blue-800',
  unspecified: 'border-slate-200 bg-slate-50 text-slate-700',
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  bail_hearing: 'bg-teal-100 text-teal-700',
  charge_framing: 'bg-blue-100 text-blue-700',
  arguments: 'bg-violet-100 text-violet-700',
  judgment: 'bg-rose-100 text-rose-700',
  order: 'bg-amber-100 text-amber-700',
  adjournment: 'bg-slate-100 text-slate-600',
}

function getWeekDates(offset: number): { monday: Date; saturday: Date } {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset + offset * 7)
  monday.setHours(0, 0, 0, 0)
  const saturday = new Date(monday)
  saturday.setDate(monday.getDate() + 5)
  return { monday, saturday }
}

function toISO(d: Date) { return d.toISOString().slice(0, 10) }
function fmt(dateStr: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', opts)
}

function HearingCard({ hearing, isToday }: { hearing: HearingEntry; isToday: boolean }) {
  const typeColors = CASE_TYPE_COLORS[hearing.caseType] ?? CASE_TYPE_COLORS.unspecified
  const eventColor = EVENT_TYPE_COLORS[hearing.eventType] ?? EVENT_TYPE_COLORS.adjournment

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border p-3 text-xs transition-all hover:shadow-sm cursor-default',
        typeColors
      )}
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <span className={cn('rounded-full px-1.5 py-0.5 font-semibold text-[10px]', eventColor)}>
          {EVENT_TYPE_LABELS[hearing.eventType] ?? hearing.eventType}
        </span>
        {hearing.court && (
          <span className="text-[10px] text-slate-500 truncate max-w-[80px]">{hearing.court}</span>
        )}
      </div>
      <p className="font-semibold text-slate-900 truncate">{hearing.caseTitle}</p>
      <p className="text-[11px] font-mono text-slate-500 mt-0.5">{hearing.caseNumber}</p>
      {hearing.judge && (
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
          <span className="font-medium">J.</span> {hearing.judge}
        </p>
      )}
      {hearing.outcome && (
        <p className="text-[11px] text-slate-600 mt-1 italic truncate">{hearing.outcome}</p>
      )}
    </motion.div>
  )
}

export function CauseListBoard() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [data, setData] = useState<CauseListResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const { monday, saturday } = getWeekDates(weekOffset)
  const fromDate = toISO(monday)
  const toDate = toISO(saturday)
  const today = toISO(new Date())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cause-list?from=${fromDate}&to=${toDate}`)
      if (!res.ok) throw new Error('Failed to load cause list')
      const json = await res.json() as CauseListResponse
      setData(json)
    } catch {
      toast.error('Could not load cause list data.')
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate])

  useEffect(() => { load() }, [load])

  // Generate Mon–Sat day list
  const days: Date[] = []
  for (let i = 0; i <= 5; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }

  const isCurrentWeek = weekOffset === 0

  return (
    <div className="flex flex-col gap-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Prev Week
        </button>

        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-slate-800">
            {isCurrentWeek ? 'This Week' : weekOffset < 0 ? `${Math.abs(weekOffset)} Week${Math.abs(weekOffset) > 1 ? 's' : ''} Ago` : `${weekOffset} Week${weekOffset > 1 ? 's' : ''} Ahead`}
          </span>
          <span className="text-xs text-slate-400 mt-0.5">
            {fmt(fromDate, { day: 'numeric', month: 'short' })} – {fmt(toDate, { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-teal-700 border border-teal-200 hover:bg-teal-50 transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Next Week <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-3 text-xs text-slate-500 px-1">
        <Calendar className="h-4 w-4 text-slate-400" />
        <span>
          <strong className="text-slate-700">{data?.totalHearings ?? 0}</strong> hearing{data?.totalHearings !== 1 ? 's' : ''} this week
        </span>
        {loading && <span className="text-teal-600 animate-pulse">Loading…</span>}
      </div>

      {/* Board — desktop grid, mobile stacked */}
      <AnimatePresence mode="wait">
        <motion.div
          key={weekOffset}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="hidden md:grid grid-cols-6 gap-3"
        >
          {days.map((day) => {
            const dayStr = toISO(day)
            const isToday = dayStr === today
            const dayHearings = data?.byDate[dayStr] ?? []

            return (
              <div
                key={dayStr}
                className={cn(
                  'flex flex-col rounded-xl border min-h-[200px]',
                  isToday
                    ? 'border-teal-400 bg-teal-50/40'
                    : 'border-slate-200 bg-white'
                )}
              >
                {/* Day header */}
                <div className={cn(
                  'px-3 py-2 rounded-t-xl border-b text-xs font-semibold',
                  isToday ? 'border-teal-300 bg-teal-100/60 text-teal-800' : 'border-slate-200 bg-slate-50 text-slate-600'
                )}>
                  <div>{fmt(dayStr, { weekday: 'short' })}</div>
                  <div className={cn('text-lg font-bold leading-tight', isToday ? 'text-teal-700' : 'text-slate-800')}>
                    {fmt(dayStr, { day: 'numeric' })}
                  </div>
                  {isToday && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-700 uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500 inline-block animate-pulse" /> Today
                    </span>
                  )}
                </div>

                {/* Hearings */}
                <div className="flex flex-col gap-2 p-2 flex-1">
                  {dayHearings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 text-xs text-center py-4">
                      <Clock className="h-5 w-5 mb-1 opacity-40" />
                      No hearings
                    </div>
                  ) : (
                    dayHearings.map((h) => (
                      <HearingCard key={h.id} hearing={h} isToday={isToday} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {/* Mobile list view */}
      <div className="md:hidden flex flex-col gap-3">
        {days.map((day) => {
          const dayStr = toISO(day)
          const isToday = dayStr === today
          const dayHearings = data?.byDate[dayStr] ?? []
          if (dayHearings.length === 0) return null

          return (
            <div key={dayStr} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className={cn(
                'px-4 py-2 text-xs font-semibold border-b',
                isToday ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-600'
              )}>
                {fmt(dayStr, { weekday: 'long', day: 'numeric', month: 'short' })}
                {isToday && <span className="ml-2 text-teal-600 font-bold">— Today</span>}
              </div>
              <div className="flex flex-col gap-2 p-3">
                {dayHearings.map((h) => (
                  <HearingCard key={h.id} hearing={h} isToday={isToday} />
                ))}
              </div>
            </div>
          )
        })}
        {(!data || data.totalHearings === 0) && !loading && (
          <div className="text-center text-sm text-slate-400 py-12">No hearings scheduled this week.</div>
        )}
      </div>
    </div>
  )
}
