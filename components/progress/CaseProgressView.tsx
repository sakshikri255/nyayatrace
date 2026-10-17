'use client'

import { GavelIcon, CalendarIcon, ActivityIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CaseStatusBadge, CaseTypeBadge } from '@/components/cases/CaseStatusBadge'
import { CaseActivityChart } from '@/components/progress/CaseActivityChart'
import { HearingTimeline } from '@/components/progress/HearingTimeline'
import type { CaseDetail } from '@/lib/queries/cases'
import type { HearingRow, HearingChartPoint } from '@/lib/queries/hearings'

type JudicialOrder = {
  id: number
  caseId: number
  orderDate: string
  orderType: string
  summary: string | null
  issuedBy: string | null
  documentId: number | null
  createdAt: string | null
  sourceDocument?: string
}

interface CaseProgressViewProps {
  caseDetail: CaseDetail
  hearings: HearingRow[]
  chartData: HearingChartPoint[]
  orders: JudicialOrder[]
}

const orderTypeLabels: Record<string, string> = {
  bail_order: 'Bail Order',
  stay_order: 'Stay Order',
  framing_charges: 'Framing of Charges',
  sentence: 'Sentence',
  other: 'Other',
}

const statusLabels: Record<string, string> = {
  active: 'Active',
  closed: 'Closed',
  pending: 'Pending',
  stayed: 'Stayed',
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  )
}

export function CaseProgressView({
  caseDetail,
  hearings,
  chartData,
  orders,
}: CaseProgressViewProps) {
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
      ? `${formatDate(firstHearing.hearingDate)} – ${formatDate(lastHearing.hearingDate)}`
      : 'No hearings'

  const lastEvent = lastHearing
    ? `${formatDate(lastHearing.hearingDate)} — ${lastHearing.eventType.replace(/_/g, ' ')}`
    : '—'

  return (
    <div className="flex flex-col gap-6">
      {/* Case header */}
      <div className="bg-white border border-slate-200 rounded-lg px-5 py-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {caseDetail.caseNumber}
          </span>
          <CaseStatusBadge status={caseDetail.status} />
          <CaseTypeBadge caseType={caseDetail.caseType} />
        </div>
        <h1 className="text-xl font-bold text-slate-900">{caseDetail.title}</h1>
        {caseDetail.court && (
          <p className="text-sm text-slate-500">{caseDetail.court}</p>
        )}
        {caseDetail.judge && (
          <p className="text-xs text-slate-400">Presiding Judge: {caseDetail.judge}</p>
        )}
      </div>

      {/* Status strip */}
      <div className="bg-white border border-slate-200 rounded-lg px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatItem label="Current Status" value={statusLabels[caseDetail.status] ?? caseDetail.status} />
        <StatItem label="Total Hearings" value={String(hearings.length)} />
        <StatItem label="Hearing Period" value={dateRange} />
        <StatItem label="Last Event" value={lastEvent} />
      </div>

      {/* Chart + quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: chart (60%) */}
        <div className="lg:col-span-3">
          <CaseActivityChart
            data={chartData}
            caseTitle={caseDetail.title}
            totalHearings={hearings.length}
          />
        </div>

        {/* Right: case status card (40%) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-gray-800">Case Summary</h3>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Case type</span>
              <CaseTypeBadge caseType={caseDetail.caseType} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Status</span>
              <CaseStatusBadge status={caseDetail.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Hearings</span>
              <span className="text-sm font-semibold text-slate-800">{hearings.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Judicial orders</span>
              <span className="text-sm font-semibold text-slate-800">{orders.length}</span>
            </div>
            {firstHearing && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">First hearing</span>
                <span className="text-xs font-medium text-slate-700">
                  {formatDate(firstHearing.hearingDate)}
                </span>
              </div>
            )}
            {lastHearing && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Last hearing</span>
                <span className="text-xs font-medium text-slate-700">
                  {formatDate(lastHearing.hearingDate)}
                </span>
              </div>
            )}
          </div>

          {caseDetail.description && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 leading-relaxed">{caseDetail.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Hearing timeline */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Hearing Timeline ({hearings.length})
          </h2>
        </div>
        <HearingTimeline hearings={hearings} />
      </div>

      {/* Judicial orders */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <GavelIcon className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Judicial Orders ({orders.length})
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg py-10 text-center">
            <p className="text-sm text-slate-400">No judicial orders on record.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">
                    Date
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-40">
                    Type
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Summary
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">
                    Issued By
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr
                    key={o.id}
                    className={cn(
                      'border-b border-slate-100 hover:bg-slate-50 transition-colors',
                      i % 2 === 1 && 'bg-slate-50/40'
                    )}
                  >
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                        {formatDate(o.orderDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-teal-50 text-teal-700 border-teal-200">
                        {orderTypeLabels[o.orderType] ?? o.orderType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-600">{o.summary ?? '—'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-500">{o.issuedBy ?? '—'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
