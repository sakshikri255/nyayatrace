import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
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
      {/* Breadcrumb */}
      <div className="mb-5">
        <Link
          href="/case-progress"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Case Progress
        </Link>
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
