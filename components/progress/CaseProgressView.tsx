'use client'

import Link from 'next/link'
import { GavelIcon, CalendarIcon, ActivityIcon, ArrowRightIcon, BriefcaseIcon, ScaleIcon, SearchIcon, FileTextIcon } from 'lucide-react'
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

  return (
    <div className="flex flex-col gap-6">
      {/* Cross-feature quick links */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/cases/${caseDetail.id}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--section-card-border)] bg-[var(--section-card-bg)] px-3 py-1.5 text-xs font-medium text-[var(--section-subheading)] hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
        >
          <BriefcaseIcon className="w-3.5 h-3.5" />
          Case Workspace
          <ArrowRightIcon className="w-3 h-3" />
        </Link>
        <Link
          href={`/bail-briefs/${caseDetail.id}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--section-card-border)] bg-[var(--section-card-bg)] px-3 py-1.5 text-xs font-medium text-[var(--section-subheading)] hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
        >
          <ScaleIcon className="w-3.5 h-3.5" />
          Bail &amp; Parole Brief
          <ArrowRightIcon className="w-3 h-3" />
        </Link>
        <Link
          href={`/verification/${caseDetail.id}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--section-card-border)] bg-[var(--section-card-bg)] px-3 py-1.5 text-xs font-medium text-[var(--section-subheading)] hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
        >
          <SearchIcon className="w-3.5 h-3.5" />
          Verification Workspace
          <ArrowRightIcon className="w-3 h-3" />
        </Link>
        <Link
          href={`/reports/${caseDetail.id}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--section-card-border)] bg-[var(--section-card-bg)] px-3 py-1.5 text-xs font-medium text-[var(--section-subheading)] hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
        >
          <FileTextIcon className="w-3.5 h-3.5" />
          Case Brief / Report
          <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      {/* Case header — clean text section, no white box */}
      <div className="flex flex-col gap-2 pb-4 border-b border-[var(--section-card-border)]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-teal tracking-tight">
            {caseDetail.caseNumber}
          </span>
          <CaseStatusBadge status={caseDetail.status} />
          <CaseTypeBadge caseType={caseDetail.caseType} />
        </div>
        <h1 className="text-xl font-bold text-[var(--section-heading)]">{caseDetail.title}</h1>
        {caseDetail.court && (
          <p className="text-sm text-[var(--section-subheading)]">{caseDetail.court}</p>
        )}
        {caseDetail.judge && (
          <p className="text-xs text-[var(--section-subheading)]">Presiding Judge: {caseDetail.judge}</p>
        )}
      </div>

      {/* Status strip — floating text metrics with dividers */}
      <div className="flex flex-wrap items-center gap-8 px-2 py-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-bold text-teal tabular-nums">
            {statusLabels[caseDetail.status] ?? caseDetail.status}
          </span>
          <span className="text-xs text-[var(--section-subheading)] uppercase tracking-wide">Current Status</span>
        </div>
        <div className="w-px h-8 bg-[var(--section-card-border)]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-bold text-[var(--section-heading)] tabular-nums">{hearings.length}</span>
          <span className="text-xs text-[var(--section-subheading)] uppercase tracking-wide">Total Hearings</span>
        </div>
        <div className="w-px h-8 bg-[var(--section-card-border)]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-bold text-[var(--section-heading)] tabular-nums">{orders.length}</span>
          <span className="text-xs text-[var(--section-subheading)] uppercase tracking-wide">Judicial Orders</span>
        </div>
        <div className="w-px h-8 bg-[var(--section-card-border)]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-[var(--section-heading)]">{dateRange}</span>
          <span className="text-xs text-[var(--section-subheading)] uppercase tracking-wide">Hearing Period</span>
        </div>
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

        {/* Right: case summary card */}
        <div className="lg:col-span-2 bg-[var(--section-card-bg)] border border-[var(--section-card-border)] rounded-lg p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-[var(--section-subheading)]" />
            <h3 className="text-sm font-semibold text-[var(--section-heading)]">Case Summary</h3>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--section-subheading)]">Case type</span>
              <CaseTypeBadge caseType={caseDetail.caseType} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--section-subheading)]">Status</span>
              <CaseStatusBadge status={caseDetail.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--section-subheading)]">Hearings</span>
              <span className="text-sm font-semibold text-[var(--section-heading)]">{hearings.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--section-subheading)]">Judicial orders</span>
              <span className="text-sm font-semibold text-[var(--section-heading)]">{orders.length}</span>
            </div>
            {firstHearing && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--section-subheading)]">First hearing</span>
                <span className="text-xs font-medium text-[var(--section-heading)]">
                  {formatDate(firstHearing.hearingDate)}
                </span>
              </div>
            )}
            {lastHearing && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--section-subheading)]">Last hearing</span>
                <span className="text-xs font-medium text-[var(--section-heading)]">
                  {formatDate(lastHearing.hearingDate)}
                </span>
              </div>
            )}
          </div>

          {caseDetail.description && (
            <div className="pt-3 border-t border-[var(--section-card-border)]">
              <p className="text-xs text-[var(--section-subheading)] leading-relaxed">{caseDetail.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Hearing timeline */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="w-4 h-4 text-[var(--section-subheading)]" />
          <h2 className="text-xs font-semibold text-[var(--section-subheading)] uppercase tracking-wide">
            Hearing Timeline ({hearings.length})
          </h2>
        </div>
        <HearingTimeline hearings={hearings} />
      </div>

      {/* Judicial orders */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <GavelIcon className="w-4 h-4 text-[var(--section-subheading)]" />
          <h2 className="text-xs font-semibold text-[var(--section-subheading)] uppercase tracking-wide">
            Judicial Orders ({orders.length})
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="bg-[var(--section-card-bg)] border border-[var(--section-card-border)] rounded-lg py-10 text-center">
            <p className="text-sm text-[var(--section-subheading)]">No judicial orders on record.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--section-card-border)] bg-[var(--section-card-bg)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[var(--section-card-border)] bg-[var(--muted)]">
                  <th className="py-3 px-4 text-xs font-semibold text-[var(--section-subheading)] uppercase tracking-wide w-32">
                    Date
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-[var(--section-subheading)] uppercase tracking-wide w-40">
                    Type
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-[var(--section-subheading)] uppercase tracking-wide">
                    Summary
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-[var(--section-subheading)] uppercase tracking-wide w-36">
                    Issued By
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr
                    key={o.id}
                    className={cn(
                      'border-b border-[var(--section-card-border)] hover:bg-[var(--table-row-hover)] transition-colors',
                      i % 2 === 1 && 'bg-[var(--muted)]/40'
                    )}
                  >
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-[var(--section-heading)] whitespace-nowrap">
                        {formatDate(o.orderDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-full border border-teal/20 bg-teal/10 px-2 py-0.5 text-xs font-medium text-teal">
                        {orderTypeLabels[o.orderType] ?? o.orderType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-[var(--section-subheading)]">{o.summary ?? '—'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-[var(--section-subheading)]">{o.issuedBy ?? '—'}</p>
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
