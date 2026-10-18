import { formatDistanceToNow } from 'date-fns'
import { CalendarIcon, FileTextIcon, AlertTriangleIcon, ClockIcon } from 'lucide-react'
import type { CaseDetail } from '@/lib/queries/cases'
import type { DocumentRow } from '@/lib/queries/documents'
import type { FindingRow } from '@/lib/queries/findings'
import type { HearingRow } from '@/lib/queries/hearings'
import { StatutoryBailCard } from '@/components/bail/StatutoryBailCard'

import { Button } from '@/components/ui/button'

interface OverviewTabProps {
  caseData: CaseDetail
  documents: DocumentRow[]
  findings: FindingRow[]
  hearings: HearingRow[]
  onGoToAnalysis?: () => void
}

export function OverviewTab({ caseData, documents, findings, hearings, onGoToAnalysis }: OverviewTabProps) {
  const needsReview = findings.filter((f) => f.reviewStatus === 'needs_review').length
  const verified = findings.filter((f) => f.reviewStatus === 'verified').length
  const notDiscrepancy = findings.filter((f) => f.reviewStatus === 'not_a_discrepancy').length

  const highSeverity = findings.filter((f) => f.severity === 'high').length
  const mediumSeverity = findings.filter((f) => f.severity === 'medium').length

  const upcoming = hearings
    .filter((h) => new Date(h.hearingDate) >= new Date())
    .sort((a, b) => a.hearingDate.localeCompare(b.hearingDate))[0]

  return (
    <div className="flex flex-col gap-6">
      {/* Statutory Bail Tracker */}
      <StatutoryBailCard caseData={caseData} />

      {/* Analysis Call to Action if documents exist */}
      {documents.length > 0 && findings.length === 0 && (
        <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-teal-900">
              {documents.length} document{documents.length > 1 ? 's' : ''} uploaded — Case Analysis ready
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Review extractive findings, chronology, and contradictory statements in the Analysis &amp; Synopsis workspace.
            </p>
          </div>
          {onGoToAnalysis && (
            <Button
              onClick={onGoToAnalysis}
              className="bg-teal text-white hover:bg-teal-light text-xs h-8 px-3"
            >
              Open Analysis &rarr;
            </Button>
          )}
        </div>
      )}

      {/* Description */}
      {caseData.description && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{caseData.description}</p>
        </div>
      )}

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<FileTextIcon className="w-4 h-4 text-sky-500" />}
          label="Documents"
          value={documents.length}
        />
        <StatCard
          icon={<AlertTriangleIcon className="w-4 h-4 text-amber-500" />}
          label="Findings"
          value={findings.length}
          sub={highSeverity > 0 ? `${highSeverity} high severity` : undefined}
          subColor="text-rose-600"
        />
        <StatCard
          icon={<CalendarIcon className="w-4 h-4 text-violet-500" />}
          label="Hearings"
          value={hearings.length}
        />
        <StatCard
          icon={<ClockIcon className="w-4 h-4 text-orange-500" />}
          label="Needs Review"
          value={needsReview}
          sub={verified > 0 ? `${verified} verified` : undefined}
          subColor="text-emerald-600"
        />
      </div>

      {/* Finding status breakdown */}
      {findings.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Finding Status Breakdown
          </h3>
          <div className="flex gap-4">
            <ReviewPill label="Needs Review" count={needsReview} color="bg-amber-100 text-amber-700" />
            <ReviewPill label="Verified" count={verified} color="bg-emerald-100 text-emerald-700" />
            <ReviewPill label="Not a Discrepancy" count={notDiscrepancy} color="bg-slate-100 text-slate-600" />
          </div>
          <div className="mt-3 flex gap-4">
            <ReviewPill label="High" count={highSeverity} color="bg-rose-100 text-rose-700" />
            <ReviewPill label="Medium" count={mediumSeverity} color="bg-orange-100 text-orange-700" />
            <ReviewPill
              label="Low"
              count={findings.length - highSeverity - mediumSeverity}
              color="bg-slate-100 text-slate-600"
            />
          </div>
        </div>
      )}

      {/* Next hearing */}
      {upcoming && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
          <h3 className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-2">
            Next Scheduled Hearing
          </h3>
          <p className="text-sm font-semibold text-slate-800">
            {new Date(upcoming.hearingDate).toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {upcoming.eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            {upcoming.description ? ` — ${upcoming.description}` : ''}
          </p>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-slate-400 flex gap-4">
        {caseData.createdAt && (
          <span>
            Created{' '}
            {formatDistanceToNow(new Date(caseData.createdAt), { addSuffix: true })}
          </span>
        )}
        {caseData.updatedAt && (
          <span>
            Last updated{' '}
            {formatDistanceToNow(new Date(caseData.updatedAt), { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  subColor = 'text-slate-400',
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub?: string
  subColor?: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <span className="text-3xl font-bold text-slate-800">{value}</span>
      {sub && <span className={`text-xs font-medium ${subColor}`}>{sub}</span>}
    </div>
  )
}

function ReviewPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
      <span className="font-bold">{count}</span>
    </span>
  )
}
