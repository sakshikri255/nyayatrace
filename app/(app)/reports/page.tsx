import Link from 'next/link'
import { FileText, TrendingUpIcon, SearchIcon, ScaleIcon, BriefcaseIcon } from 'lucide-react'
import { getAllCases } from '@/lib/queries/cases'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const statusConfig: Record<string, { label: string; className: string }> = {
  active:  { label: 'Active',  className: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700'     },
  closed:  { label: 'Closed',  className: 'bg-slate-100 text-slate-600'     },
  stayed:  { label: 'Stayed',  className: 'bg-purple-100 text-purple-700'   },
  unspecified: { label: 'Not specified', className: 'bg-slate-100 text-slate-500' },
}

const caseTypeConfig: Record<string, { label: string; className: string }> = {
  bail:     { label: 'Bail',     className: 'bg-teal-50 text-teal-700 border border-teal-200'       },
  parole:   { label: 'Parole',   className: 'bg-violet-50 text-violet-700 border border-violet-200' },
  criminal: { label: 'Criminal', className: 'bg-rose-50 text-rose-700 border border-rose-200'       },
  civil:    { label: 'Civil',    className: 'bg-blue-50 text-blue-700 border border-blue-200'       },
  unspecified: { label: 'Not specified', className: 'bg-slate-50 text-slate-600 border border-slate-200' },
}

export default function ReportsPage() {
  const cases = getAllCases()

  return (
    <div className="min-h-full bg-offwhite">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Review case records and source-linked analysis saved from uploaded documents.
            Verify all extracted information against its original source.
          </p>
        </div>

        {/* Case grid */}
        {cases.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">No cases available for reports.</p>
            <Link href="/cases?new=1" className="mt-3 inline-block text-sm font-medium text-teal-700 underline">Create a case</Link>
          </div>
        ) : <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-grid">
          {cases.map((c) => {
            const statusCfg = statusConfig[c.status] ?? statusConfig.unspecified
            const typeCfg = caseTypeConfig[c.caseType] ?? caseTypeConfig.unspecified

            return (
              <div
                key={c.id}
                className="animate-fade-up bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                {/* Case number + badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-500 tracking-wide">
                    {c.caseNumber}
                  </span>
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', typeCfg.className)}>
                    {typeCfg.label}
                  </span>
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', statusCfg.className)}>
                    {statusCfg.label}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-sm font-semibold text-slate-900 leading-snug">{c.title}</h2>

                {/* Metadata row */}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {c.documentCount} document{c.documentCount !== 1 ? 's' : ''}
                  </span>
                  <span>{c.findingCount} finding{c.findingCount !== 1 ? 's' : ''}</span>
                  {c.court && <span className="truncate max-w-[12rem]">{c.court}</span>}
                </div>

                {/* Actions row */}
                <div className="mt-auto pt-2 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/reports/${c.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
                  >
                    Generate Brief →
                  </Link>
                  <Link
                    href={`/cases/${c.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-md border border-slate-200 text-xs font-medium text-slate-500 hover:border-teal/40 hover:text-teal transition-colors"
                    title="Case Workspace"
                  >
                    <BriefcaseIcon className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={`/verification/${c.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-md border border-slate-200 text-xs font-medium text-slate-500 hover:border-teal/40 hover:text-teal transition-colors"
                    title="Verification Workspace"
                  >
                    <SearchIcon className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={`/case-progress/${c.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-md border border-slate-200 text-xs font-medium text-slate-500 hover:border-teal/40 hover:text-teal transition-colors"
                    title="Case Progress"
                  >
                    <TrendingUpIcon className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={`/bail-briefs/${c.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-md border border-slate-200 text-xs font-medium text-slate-500 hover:border-teal/40 hover:text-teal transition-colors"
                    title="Bail & Parole Brief"
                  >
                    <ScaleIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>}

        {cases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No cases found</p>
          </div>
        )}
      </div>
    </div>
  )
}
