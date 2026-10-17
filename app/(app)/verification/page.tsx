import Link from 'next/link'
import { ArrowRightIcon, FileSearchIcon, AlertTriangleIcon } from 'lucide-react'
import { getAllCases } from '@/lib/queries/cases'
import { getFindingsByCaseId } from '@/lib/queries/findings'
import { CaseStatusBadge } from '@/components/cases/CaseStatusBadge'
import { PageTransition } from '@/components/layout/PageTransition'

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
    <PageTransition>
    <div className="flex flex-col h-full">
      <div className="max-w-6xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {/* Heading */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
            <FileSearchIcon className="w-5 h-5 text-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              Fact &amp; Evidence Verification
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Select a case to open the three-panel verification workspace and review document findings.
            </p>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </PageTransition>
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
    <div className="group bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 hover:border-teal/50 hover:shadow-sm transition-all">
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
      <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-slate-800 leading-none">{totalFindings}</span>
          <span className="text-xs text-slate-400 mt-0.5">Findings</span>
        </div>
        <div className="w-px h-8 bg-slate-100" />
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-amber-600 leading-none">{needsReview}</span>
          <span className="text-xs text-slate-400 mt-0.5">Pending</span>
        </div>
        <div className="w-px h-8 bg-slate-100" />
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-emerald-600 leading-none">{verified}</span>
          <span className="text-xs text-slate-400 mt-0.5">Verified</span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/verification/${id}`}
        className="mt-auto flex items-center justify-between gap-2 rounded-lg bg-teal/5 hover:bg-teal/10 border border-teal/20 hover:border-teal/40 px-4 py-2.5 text-sm font-semibold text-teal transition-all group-hover:translate-x-0.5"
      >
        Open Workspace
        <ArrowRightIcon className="w-4 h-4 shrink-0" />
      </Link>
    </div>
  )
}
