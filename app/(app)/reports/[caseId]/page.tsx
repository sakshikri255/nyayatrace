import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, BriefcaseIcon, TrendingUpIcon, ScaleIcon, SearchIcon } from 'lucide-react'
import { CaseBriefView, type CaseBriefData } from '@/components/reports/CaseBriefView'
import { getCaseById } from '@/lib/queries/cases'

export const dynamic = 'force-dynamic'

interface Props {
  params: { caseId: string }
}

export default async function ReportDetailPage({ params }: Props) {
  const caseId = parseInt(params.caseId, 10)
  if (isNaN(caseId)) notFound()

  const caseData = getCaseById(caseId)
  if (!caseData) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/cases/${caseId}/brief`, { cache: 'no-store' })

  if (res.status === 404) notFound()
  if (!res.ok) {
    throw new Error(`Failed to load brief: ${res.status}`)
  }

  const data: CaseBriefData = await res.json()

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Back + cross-feature nav */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          All Reports
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">Also view in:</span>
          <Link
            href={`/cases/${caseId}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <BriefcaseIcon className="w-3.5 h-3.5" />
            Case Workspace
          </Link>
          <Link
            href={`/verification/${caseId}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <SearchIcon className="w-3.5 h-3.5" />
            Verification
          </Link>
          <Link
            href={`/case-progress/${caseId}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <TrendingUpIcon className="w-3.5 h-3.5" />
            Case Progress
          </Link>
          <Link
            href={`/bail-briefs/${caseId}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <ScaleIcon className="w-3.5 h-3.5" />
            Bail &amp; Parole
          </Link>
        </div>
      </div>

      <CaseBriefView data={data} />
    </div>
  )
}
