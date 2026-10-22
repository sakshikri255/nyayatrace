import Link from 'next/link'
import { ArrowRightIcon, FileSearchIcon, AlertTriangleIcon, BriefcaseIcon, ScaleIcon } from 'lucide-react'
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

  // Compute aggregate metrics
  const allBreakdowns = cases.map((c) => FindingBreakdown({ caseId: c.id }))
  const totalFindings = allBreakdowns.reduce((sum, b) => sum + b.total, 0)
  const totalNeedsReview = allBreakdowns.reduce((sum, b) => sum + b.needsReview, 0)

  return (
    <div className="flex flex-col h-full">
      <div className="max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-6">

        {/* ── Header: icon + text, no background box ──────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <FileSearchIcon className="w-6 h-6 text-teal mt-0.5 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--section-heading)] leading-tight">
                Fact &amp; Evidence Verification
              </h1>
              <p className="text-sm text-[var(--section-subheading)] mt-1">
                Select a case to open the three-panel verification workspace and review document findings.
              </p>
            </div>
          </div>
          <Link
            href="/cases"
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--section-card-border)] bg-[var(--section-card-bg)] px-3 py-2 text-xs font-medium text-[var(--section-subheading)] hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors shrink-0"
          >
            <BriefcaseIcon className="w-3.5 h-3.5" />
            View All Cases
          </Link>
        </div>

        {/* ── Floating metrics strip ───────────────────────────────────── */}
        {cases.length > 0 && (
          <div className="flex flex-wrap items-center gap-8 px-4 py-4 border-b border-[var(--section-card-border)]">
            <div className="flex flex-col gap-0.5">
              <span className="text-3xl font-bold text-teal tabular-nums">{cases.length}</span>
              <span className="text-xs text-[var(--section-subheading)] uppercase tracking-wide">Total Cases</span>
            </div>
            <div className="w-px h-10 bg-[var(--section-card-border)]" />
            <div className="flex flex-col gap-0.5">
              <span className="text-3xl font-bold text-amber-500 tabular-nums">{totalNeedsReview}</span>
              <span className="text-xs text-[var(--section-subheading)] uppercase tracking-wide">Findings to Review</span>
            </div>
            <div className="w-px h-10 bg-[var(--section-card-border)]" />
            <div className="flex flex-col gap-0.5">
              <span className="text-3xl font-bold text-[var(--section-heading)] tabular-nums">{totalFindings}</span>
              <span className="text-xs text-[var(--section-subheading)] uppercase tracking-wide">Total Findings</span>
            </div>
          </div>
        )}

        {/* ── Case list ──────────────────────────────────────────────── */}
        {cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangleIcon className="w-8 h-8 text-[var(--section-subheading)] mb-3 opacity-40" />
            <p className="text-sm font-medium text-[var(--section-heading)]">No cases created yet.</p>
            <p className="text-xs text-[var(--section-subheading)] mt-1">Create a case to upload authorized records and review their sources.</p>
            <Link href="/cases?new=1" className="mt-4 text-sm font-medium text-teal underline">Create a case</Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--section-card-border)]">
            {cases.map((c, idx) => {
              const { total, needsReview, verified } = allBreakdowns[idx]
              return (
                <CaseRow
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

interface CaseRowProps {
  id: number
  caseNumber: string
  title: string
  status: 'active' | 'closed' | 'pending' | 'stayed' | 'unspecified'
  totalFindings: number
  needsReview: number
  verified: number
}

function CaseRow({
  id,
  caseNumber,
  title,
  status,
  totalFindings,
  needsReview,
  verified,
}: CaseRowProps) {
  return (
    <div className="flex items-center gap-4 px-2 py-3 hover:bg-teal/[0.02] transition-colors group">
      {/* Left: case number + title */}
      <div className="min-w-0 flex-1">
        <span className="font-mono text-xs font-bold text-teal tracking-tight">{caseNumber}</span>
        <p className="text-sm font-semibold text-[var(--section-heading)] line-clamp-1 mt-0.5">{title}</p>
      </div>

      {/* Center: finding counts inline */}
      <div className="hidden sm:flex items-center gap-3 shrink-0">
        <CaseStatusBadge status={status} />
        <span className="text-xs text-[var(--section-subheading)]">
          <span className="font-semibold text-[var(--section-heading)]">{totalFindings}</span> findings
        </span>
        {needsReview > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-500">
            {needsReview} pending
          </span>
        )}
        {verified > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-500">
            {verified} verified
          </span>
        )}
      </div>

      {/* Right: action links */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/bail-briefs/${id}`}
          className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded border border-[var(--section-card-border)] text-[var(--section-subheading)] hover:border-teal/40 hover:text-teal transition-colors"
          title="Bail & Parole"
        >
          <ScaleIcon className="w-3.5 h-3.5" />
        </Link>
        <Link
          href={`/verification/${id}`}
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded bg-teal text-white text-xs font-semibold hover:bg-teal/90 transition-colors"
        >
          Open Workspace
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
