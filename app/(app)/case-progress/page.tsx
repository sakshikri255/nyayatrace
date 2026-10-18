import Link from 'next/link'
import { CalendarIcon, ArrowRightIcon } from 'lucide-react'
import { getAllCases } from '@/lib/queries/cases'
import { getHearingsByCaseId } from '@/lib/queries/hearings'
import { CaseStatusBadge, CaseTypeBadge } from '@/components/cases/CaseStatusBadge'

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
        <h1 className="text-2xl font-bold text-slate-900">Case Progress &amp; Transparency</h1>
        <p className="text-sm text-slate-500 mt-1">
          View hearing timelines, activity charts, and judicial orders for each case.
        </p>
      </div>

      {/* Case grid */}
      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-slate-200 rounded-lg">
          <CalendarIcon className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-700">No cases created yet.</p>
          <Link href="/cases?new=1" className="mt-3 text-sm font-medium text-teal-700 underline">Create a case</Link>
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
                className="animate-fade-up group bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3 hover:border-teal-400 hover:shadow-sm transition-all"
              >
                {/* Case number + badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {c.caseNumber}
                  </span>
                  <CaseStatusBadge status={c.status} />
                  <CaseTypeBadge caseType={c.caseType} />
                </div>

                {/* Title */}
                <p className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-teal-700 transition-colors">
                  {c.title}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>
                    <span className="font-semibold text-slate-700">{c.hearingCount}</span>{' '}
                    hearing{c.hearingCount === 1 ? '' : 's'}
                  </span>
                  {dateRange && (
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {dateRange}
                    </span>
                  )}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-1 text-xs font-medium text-teal-600 group-hover:gap-2 transition-all mt-auto">
                  View Progress
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

    </div>
  )
}
