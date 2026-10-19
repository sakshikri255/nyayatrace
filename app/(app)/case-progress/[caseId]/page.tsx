import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon, BriefcaseIcon, ScaleIcon, SearchIcon, FileTextIcon } from 'lucide-react'
import { getCaseById, getBailBriefData } from '@/lib/queries/cases'
import { getHearingsByCaseId, getCaseHearingsPerMonth } from '@/lib/queries/hearings'
import { CaseProgressView } from '@/components/progress/CaseProgressView'
export const runtime = 'nodejs'

interface CaseProgressDetailPageProps {
  params: Promise<{ caseId: string }>
}

export default async function CaseProgressDetailPage({ params }: CaseProgressDetailPageProps) {
  const { caseId: caseIdStr } = await params
  const caseId = parseInt(caseIdStr, 10)

  if (isNaN(caseId)) notFound()

  const caseDetail = getCaseById(caseId)
  if (!caseDetail) notFound()

  const hearings = getHearingsByCaseId(caseId)
  const chartData = getCaseHearingsPerMonth(caseId)

  // Use getBailBriefData for orders (it already fetches judicial orders for the case)
  const briefData = getBailBriefData(caseId)
  const orders = briefData?.orders ?? []

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      {/* Breadcrumb + cross-feature links */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/case-progress"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Case Progress
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/cases/${caseId}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <BriefcaseIcon className="w-3.5 h-3.5" />
            Case Workspace
          </Link>
          <Link
            href={`/bail-briefs/${caseId}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <ScaleIcon className="w-3.5 h-3.5" />
            Bail &amp; Parole
          </Link>
          <Link
            href={`/verification/${caseId}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <SearchIcon className="w-3.5 h-3.5" />
            Verification
          </Link>
          <Link
            href={`/reports/${caseId}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <FileTextIcon className="w-3.5 h-3.5" />
            Report
          </Link>
        </div>
      </div>

      <CaseProgressView
        caseDetail={caseDetail}
        hearings={hearings}
        chartData={chartData}
        orders={orders}
      />
    </div>
  )
}
