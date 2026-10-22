'use client'

import { CalendarIcon, ClockIcon, MapPinIcon, ActivityIcon } from 'lucide-react'
import type { HearingRow, HearingChartPoint } from '@/lib/queries/hearings'
import { CaseActivityChart } from '@/components/progress/CaseActivityChart'
import { cn } from '@/lib/utils'

interface HearingsTabProps {
  hearings: HearingRow[]
  chartData?: HearingChartPoint[]
  caseTitle?: string
}

const eventConfig: Record<string, { label: string; className: string }> = {
  bail_hearing: { label: 'Bail Hearing', className: 'bg-violet-100 text-violet-700 border-violet-200' },
  charge_framing: { label: 'Charge Framing', className: 'bg-sky-100 text-sky-700 border-sky-200' },
  arguments: { label: 'Arguments', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  judgment: { label: 'Judgment', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  order: { label: 'Order', className: 'bg-teal/10 text-teal border-teal/30' },
  adjournment: { label: 'Adjournment', className: 'bg-slate-100 text-slate-600 border-slate-200' },
}

export function HearingsTab({ hearings, chartData, caseTitle }: HearingsTabProps) {
  if (hearings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-slate-200 rounded-lg">
        <CalendarIcon className="w-8 h-8 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">No hearings recorded</p>
        <p className="text-xs text-slate-400 mt-1">Hearing dates will appear here as they are added.</p>
      </div>
    )
  }

  // Sorted ascending
  const sorted = [...hearings].sort((a, b) => a.hearingDate.localeCompare(b.hearingDate))
  const firstHearing = sorted[0]
  const lastHearing = sorted[sorted.length - 1]

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const dateRange =
    firstHearing && lastHearing
      ? firstHearing.hearingDate === lastHearing.hearingDate
        ? formatDate(firstHearing.hearingDate)
        : `${formatDate(firstHearing.hearingDate)} – ${formatDate(lastHearing.hearingDate)}`
      : '—'

  const upcoming = sorted.find((h) => new Date(h.hearingDate) >= new Date())
  const primaryCourt = sorted.find((h) => h.court)?.court

  return (
    <div className="flex flex-col gap-6">
      {/* ── 1. Summary Strip ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ActivityIcon className="w-3.5 h-3.5 text-teal" />
            <span>Total Hearings</span>
          </div>
          <span className="text-2xl font-bold text-slate-800 mt-2 tabular-nums">
            {hearings.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            {sorted.filter((h) => h.eventType === 'adjournment').length} adjournments
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <CalendarIcon className="w-3.5 h-3.5 text-violet-500" />
            <span>Hearing Period</span>
          </div>
          <span className="text-sm font-semibold text-slate-800 mt-2 truncate" title={dateRange}>
            {dateRange}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            First: {formatDate(firstHearing?.hearingDate)}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ClockIcon className="w-3.5 h-3.5 text-amber-500" />
            <span>Next Hearing</span>
          </div>
          <span className="text-sm font-semibold text-slate-800 mt-2 truncate">
            {upcoming ? formatDate(upcoming.hearingDate) : 'None scheduled'}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 truncate">
            {upcoming ? eventConfig[upcoming.eventType]?.label ?? upcoming.eventType : 'All completed'}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <MapPinIcon className="w-3.5 h-3.5 text-sky-500" />
            <span>Forum / Court</span>
          </div>
          <span className="text-sm font-semibold text-slate-800 mt-2 truncate" title={primaryCourt ?? 'Not specified'}>
            {primaryCourt ?? 'Not specified'}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 truncate">
            {sorted.find((h) => h.judge)?.judge ? `Judge: ${sorted.find((h) => h.judge)?.judge}` : 'Standard listing'}
          </span>
        </div>
      </div>

      {/* ── 2. Hearing Activity Chart ─────────────────────────── */}
      {chartData && chartData.length > 0 && (
        <div className="w-full">
          <CaseActivityChart
            data={chartData}
            caseTitle={caseTitle ?? 'Hearing Frequency & Cadence'}
            totalHearings={hearings.length}
          />
        </div>
      )}

      {/* ── 3. Hearings List Table ────────────────────────────── */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-400 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Hearing Log ({hearings.length})
          </h3>
          <span className="text-xs text-slate-400">Chronological Order</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-slate-400 bg-slate-50">
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36 border-r border-slate-400">Date</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36 border-r border-slate-400">Event Type</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-400">Description</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-400">Outcome</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-40 border-r border-slate-400">Court</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">Source Doc</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((h) => {
                const cfg = eventConfig[h.eventType] ?? { label: h.eventType, className: 'bg-slate-100 text-slate-600 border-slate-200' }
                const isUpcoming = new Date(h.hearingDate) >= new Date()
                return (
                  <tr key={h.id} className={cn('border-b border-slate-400 transition-colors hover:bg-slate-50/80', isUpcoming && 'bg-violet-50/40')}>
                    <td className="py-3 px-4 border-r border-slate-400">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                          {formatDate(h.hearingDate)}
                        </span>
                        {isUpcoming && (
                          <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide mt-0.5">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-400">
                      <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', cfg.className)}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-400">
                      <p className="text-sm text-slate-700">{h.description ?? '—'}</p>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-400">
                      <p className="text-sm text-slate-600">{h.outcome ?? '—'}</p>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-400">
                      <p className="text-xs text-slate-600 truncate max-w-[10rem]">{h.court ?? '—'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs text-slate-400 truncate max-w-[9rem]">{h.sourceDocument ?? '—'}</p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
