import Link from 'next/link'
import { BriefcaseIcon, TrendingUpIcon, SearchIcon } from 'lucide-react'
import { getAllCases } from '@/lib/queries/cases'
import { BailDisclaimer } from '@/components/bail/BailDisclaimer'
import { StatutoryBailCard } from '@/components/bail/StatutoryBailCard'
import { ParoleTimelineCard } from '@/components/bail/ParoleTimelineCard'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const caseTypeConfig: Record<string, { label: string; highlight: boolean; className: string }> = {
  bail:     { label: 'Bail',     highlight: true,  className: 'bg-teal-50 text-teal-700 border-teal-200'       },
  parole:   { label: 'Parole',   highlight: true,  className: 'bg-violet-50 text-violet-700 border-violet-200' },
  criminal: { label: 'Criminal', highlight: false, className: 'bg-rose-50 text-rose-700 border-rose-200'       },
  civil:    { label: 'Civil',    highlight: false, className: 'bg-blue-50 text-blue-700 border-blue-200'       },
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active:  { label: 'Active',  className: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700'     },
  closed:  { label: 'Closed',  className: 'bg-slate-100 text-slate-600'     },
  stayed:  { label: 'Stayed',  className: 'bg-purple-100 text-purple-700'   },
}

export default function BailBriefsPage() {
  const allCases = getAllCases()

  return (
    <div className="px-6 py-6 max-w-7xl mx-auto flex flex-col gap-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bail &amp; Parole Case Briefs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Structured summaries assembled from judicial orders, hearings, and case records.
        </p>
      </div>

      {/* Non-dismissable disclaimer — no close button */}
      <BailDisclaimer />

      {/* Case grid */}
      {allCases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-medium text-slate-700">No cases available.</p>
          <Link href="/cases?new=1" className="mt-4 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Create a case</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-grid">
          {allCases.map((c) => {
            const typeCfg = caseTypeConfig[c.caseType] ?? { label: 'Not specified', highlight: false, className: 'bg-slate-50 text-slate-600 border-slate-200' }
            const statusCfg = statusConfig[c.status] ?? { label: 'Not specified', className: 'bg-slate-100 text-slate-600' }

            return (
              <div
                key={c.id}
                className={cn(
                  'animate-fade-up',
                      'bg-white rounded-lg border p-5 flex flex-col gap-3 transition-shadow hover:shadow-sm',
                      c.caseType === 'parole' ? 'border-violet-200' :
                      c.caseType === 'bail'   ? 'border-teal-200'   : 'border-slate-200'
                    )}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-400 tracking-wide">
                    {c.caseNumber}
                  </span>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', typeCfg.className)}>
                      {typeCfg.label}
                    </span>
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', statusCfg.className)}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h2 className={cn('text-sm font-semibold leading-snug',
                  c.caseType === 'parole' ? 'text-violet-900' :
                  c.caseType === 'bail'   ? 'text-teal-900'   : 'text-slate-800'
                )}>
                  {c.title}
                </h2>

                {/* Counts */}
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>{c.documentCount} document{c.documentCount !== 1 ? 's' : ''}</span>
                </div>

                {/* Statutory Default Bail / Parole Tracker */}
                {c.caseType === 'parole' ? (
                  <ParoleTimelineCard caseData={c} compact />
                ) : (
                  <StatutoryBailCard caseData={c} compact />
                )}

                {/* Actions row */}
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <Link
                    href={`/bail-briefs/${c.id}`}
                    className={cn(
                      'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors',
                      c.caseType === 'parole' ? 'bg-violet-600 text-white hover:bg-violet-700' :
                      c.caseType === 'bail'   ? 'bg-teal-600 text-white hover:bg-teal-700'     :
                                               'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    )}
                  >
                    View Brief →
                  </Link>
                  <Link
                    href={`/cases/${c.id}`}
                    className="inline-flex items-center gap-1 px-2 py-2 rounded-md border border-slate-200 text-xs font-medium text-slate-500 hover:border-teal/40 hover:text-teal transition-colors"
                    title="Case Workspace"
                  >
                    <BriefcaseIcon className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={`/case-progress/${c.id}`}
                    className="inline-flex items-center gap-1 px-2 py-2 rounded-md border border-slate-200 text-xs font-medium text-slate-500 hover:border-teal/40 hover:text-teal transition-colors"
                    title="Case Progress"
                  >
                    <TrendingUpIcon className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={`/verification/${c.id}`}
                    className="inline-flex items-center gap-1 px-2 py-2 rounded-md border border-slate-200 text-xs font-medium text-slate-500 hover:border-teal/40 hover:text-teal transition-colors"
                    title="Verification"
                  >
                    <SearchIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
