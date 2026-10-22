import Link from 'next/link'
import { FileText, SearchIcon, ScaleIcon, BriefcaseIcon } from 'lucide-react'
import { getAllCases } from '@/lib/queries/cases'
import { CaseStatusBadge, CaseTypeBadge } from '@/components/cases/CaseStatusBadge'

export const dynamic = 'force-dynamic'

export default function ReportsPage() {
  const cases = getAllCases()

  return (
    <div className="min-h-full">
      <div className="px-6 py-8 max-w-5xl mx-auto flex flex-col gap-6">

        {/* Page header */}
        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-teal mt-0.5 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--section-heading)] leading-tight">Reports</h1>
            <p className="text-sm text-[var(--section-subheading)] mt-1 max-w-2xl">
              Review case records and source-linked analysis saved from uploaded documents.
            </p>
          </div>
        </div>

        {/* Floating metrics strip */}
        {cases.length > 0 && (
          <div className="flex flex-wrap items-center gap-8 px-4 py-4 border-b border-[var(--section-card-border)]">
            <div className="flex flex-col gap-0.5">
              <span className="text-3xl font-bold text-teal tabular-nums">{cases.length}</span>
              <span className="text-xs text-[var(--section-subheading)] uppercase tracking-wide">Total Cases</span>
            </div>
            <div className="w-px h-10 bg-[var(--section-card-border)]" />
            <div className="flex flex-col gap-0.5">
              <span className="text-3xl font-bold text-[var(--section-heading)] tabular-nums">
                {cases.reduce((sum, c) => sum + c.documentCount, 0)}
              </span>
              <span className="text-xs text-[var(--section-subheading)] uppercase tracking-wide">Documents</span>
            </div>
            <div className="w-px h-10 bg-[var(--section-card-border)]" />
            <div className="flex flex-col gap-0.5">
              <span className="text-3xl font-bold text-[var(--section-heading)] tabular-nums">
                {cases.reduce((sum, c) => sum + c.findingCount, 0)}
              </span>
              <span className="text-xs text-[var(--section-subheading)] uppercase tracking-wide">Findings</span>
            </div>
          </div>
        )}

        {/* Case list */}
        {cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-10 h-10 text-[var(--section-subheading)] mb-3 opacity-40" />
            <p className="text-sm font-medium text-[var(--section-heading)]">No cases available for reports.</p>
            <Link href="/cases?new=1" className="mt-4 text-sm font-medium text-teal underline">
              Create a case
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--section-card-border)]">
            {cases.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 px-2 py-3 hover:bg-teal/[0.02] transition-colors group"
              >
                {/* Left: case number + title */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-mono text-xs font-bold text-teal tracking-tight">
                      {c.caseNumber}
                    </span>
                    <CaseTypeBadge caseType={c.caseType} />
                    <CaseStatusBadge status={c.status} />
                  </div>
                  <p className="text-sm font-semibold text-[var(--section-heading)] line-clamp-1">
                    {c.title}
                  </p>
                  <p className="text-xs text-[var(--section-subheading)] mt-0.5">
                    {c.documentCount} document{c.documentCount !== 1 ? 's' : ''} · {c.findingCount} finding{c.findingCount !== 1 ? 's' : ''}
                    {c.court ? ` · ${c.court}` : ''}
                  </p>
                </div>

                {/* Right: action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/cases/${c.id}`}
                    className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded border border-[var(--section-card-border)] text-[var(--section-subheading)] hover:border-teal/40 hover:text-teal transition-colors"
                    title="Case Workspace"
                  >
                    <BriefcaseIcon className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={`/verification/${c.id}`}
                    className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded border border-[var(--section-card-border)] text-[var(--section-subheading)] hover:border-teal/40 hover:text-teal transition-colors"
                    title="Verification Workspace"
                  >
                    <SearchIcon className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={`/bail-briefs/${c.id}`}
                    className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded border border-[var(--section-card-border)] text-[var(--section-subheading)] hover:border-teal/40 hover:text-teal transition-colors"
                    title="Bail & Parole Brief"
                  >
                    <ScaleIcon className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={`/reports/${c.id}`}
                    className="inline-flex items-center gap-1.5 px-3 h-8 rounded bg-teal text-white text-xs font-semibold hover:bg-teal/90 transition-colors"
                  >
                    Generate Brief →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
