import Link from 'next/link'
import { CalendarIcon, ArrowRightIcon } from 'lucide-react'
import { getAllCases } from '@/lib/queries/cases'
import { getHearingsByCaseId } from '@/lib/queries/hearings'
import { CaseStatusBadge, CaseTypeBadge } from '@/components/cases/CaseStatusBadge'
import { CaseCardQuickLinks } from '@/components/progress/CaseCardQuickLinks'

export const runtime = 'nodejs'

export default function CaseProgressPage() {
  const allCases = getAllCases()

  // Enrich each case with hearing count + date range
  const enriched = allCases.map((c) => {
    const hearingRows = getHearingsByCaseId(c.id)
    const sorted = [...hearingRows].sort((a, b) => a.hearingDate.localeCompare(b.hearingDate))
    const first = sorted[0]?.hearingDate
    const last = sorted[sorted.length - 1]?.hearingDate
    return { ...c, hearingCount: hearingRows.length, firstHearing: first, lastHearing: last }
  })

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--section-heading)]">Case Progress &amp; Transparency</h1>
        <p className="text-sm text-[var(--section-subheading)] mt-1">
          View hearing timelines, activity charts, and judicial orders for each case.
        </p>
      </div>

      {/* Case grid */}
      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[var(--section-card-bg)] border border-[var(--section-card-border)] rounded-lg">
          <CalendarIcon className="w-10 h-10 text-[var(--section-subheading)] mb-3" />
          <p className="text-sm font-medium text-[var(--section-heading)]">No cases created yet.</p>
          <Link href="/cases?new=1" className="mt-3 text-sm font-medium text-teal underline">Create a case</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-grid">
          {enriched.map((c) => {
            const firstFmt = formatDate(c.firstHearing)
            const lastFmt = formatDate(c.lastHearing)
            const dateRange =
              firstFmt && lastFmt
                ? firstFmt === lastFmt
                  ? firstFmt
                  : `${firstFmt} – ${lastFmt}`
                : null

            return (
              <Link
                key={c.id}
                href={`/case-progress/${c.id}`}
                className="animate-fade-up group bg-[var(--section-card-bg)] border border-[var(--section-card-border)] rounded-lg p-4 flex flex-col gap-3 hover:border-teal/40 hover:shadow-sm transition-all"
              >
                {/* Case number + badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-semibold text-[var(--section-subheading)] bg-[var(--muted)] px-2 py-0.5 rounded">
                    {c.caseNumber}
                  </span>
                  <CaseStatusBadge status={c.status} />
                  <CaseTypeBadge caseType={c.caseType} />
                </div>

                {/* Title */}
                <p className="text-sm font-semibold text-[var(--section-heading)] leading-snug group-hover:text-teal transition-colors">
                  {c.title}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-[var(--section-subheading)]">
                  <span>
                    <span className="font-semibold text-[var(--section-heading)]">{c.hearingCount}</span>{' '}
                    hearing{c.hearingCount === 1 ? '' : 's'}
                  </span>
                  {dateRange && (
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {dateRange}
                    </span>
                  )}
                </div>

                {/* CTA strip */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1 text-xs font-medium text-teal group-hover:gap-2 transition-all">
                    View Progress
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </div>
                  <CaseCardQuickLinks caseId={c.id} />
                </div>
              </Link>
            )
          })}
        </div>
      )}

    </div>
  )
}
