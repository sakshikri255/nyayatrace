import Link from 'next/link'
import { ArrowRightIcon, FileSearchIcon, AlertTriangleIcon, BriefcaseIcon, ScaleIcon, TrendingUpIcon } from 'lucide-react'
import { getAllCases } from '@/lib/queries/cases'
import { getFindingsByCaseId } from '@/lib/queries/findings'
import { CaseStatusBadge } from '@/components/cases/CaseStatusBadge'

export const dynamic = 'force-dynamic'

function FindingBreakdown({ caseId }: { caseId: number }) {
  const findings = getFindingsByCaseId(caseId)
  const needsReview = findings.filter((f) => f.reviewStatus === 'needs_review').length
  const verified = findings.filter((f) => f.reviewStatus === 'verified').length
  const notDiscrepancy = findings.filter((f) => f.reviewStatus === 'not_a_discrepancy').length
  return { total: findings.length, needsReview, verified, notDiscrepancy }
}

export default function VerificationIndexPage() {
  const cases = getAllCases()

  return (
    <div className="flex flex-col h-full">
      <div className="max-w-6xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {/* Heading */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
            <FileSearchIcon className="w-5 h-5 text-teal" />
          </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                Fact &amp; Evidence Verification
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                Select a case to open the three-panel verification workspace and review document findings.
              </p>
            </div>
          </div>
          <Link
            href="/cases"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors shrink-0"
          >
            <BriefcaseIcon className="w-3.5 h-3.5" />
            View All Cases
          </Link>
        </div>

        {/* Case grid */}
        {cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 rounded-xl text-center">
            <AlertTriangleIcon className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-700">No cases created yet.</p>
            <p className="text-xs text-slate-500 mt-1">Create a case to upload authorized records and review their sources.</p>
            <Link href="/cases?new=1" className="mt-4 text-sm font-medium text-teal-700 underline">Create a case</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-grid">
            {cases.map((c) => {
              const { total, needsReview, verified } = FindingBreakdown({ caseId: c.id })
              return (
                <CaseCard
                  key={c.id}
                  id={c.id}
                  caseNumber={c.caseNumber}
                  title={c.title}
                  status={c.status}
                  totalFindings={total}
                  needsReview={needsReview}
                  verified={verified}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

interface CaseCardProps {
  id: number
  caseNumber: string
  title: string
  status: 'active' | 'closed' | 'pending' | 'stayed' | 'unspecified'
  totalFindings: number
  needsReview: number
  verified: number
}

function CaseCard({
  id,
  caseNumber,
  title,
  status,
  totalFindings,
  needsReview,
  verified,
}: CaseCardProps) {
  return (
    <div className="animate-fade-up group bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-3 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-teal/50 hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)]">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-mono text-xs font-semibold text-teal tracking-tight truncate">
            {caseNumber}
          </span>
          <h2 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
            {title}
          </h2>
        </div>
        <CaseStatusBadge status={status} />
      </div>

      {/* Finding stats */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          <span className="font-bold">{totalFindings}</span> Findings
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          <span className="font-bold">{needsReview}</span> Pending
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <span className="font-bold">{verified}</span> Verified
        </span>
      </div>

      {/* Actions */}
      <div className="mt-auto flex items-center gap-2">
        <Link
          href={`/verification/${id}`}
          className="inline-flex h-10 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-teal/20 bg-teal/5 px-3 text-sm font-semibold text-teal transition-colors hover:border-teal/40 hover:bg-teal/10"
        >
          Open Workspace
          <ArrowRightIcon className="w-4 h-4 shrink-0" />
        </Link>
        <Link
          href={`/bail-briefs/${id}`}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-xs font-medium text-slate-500 transition-colors hover:border-teal/40 hover:bg-teal/5 hover:text-teal"
          title="Bail & Parole"
        >
          <ScaleIcon className="w-3.5 h-3.5" />
        </Link>
        <Link
          href={`/case-progress/${id}`}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-xs font-medium text-slate-500 transition-colors hover:border-teal/40 hover:bg-teal/5 hover:text-teal"
          title="Case Progress"
        >
          <TrendingUpIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
