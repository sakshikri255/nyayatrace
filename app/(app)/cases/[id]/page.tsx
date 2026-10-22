import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, ScaleIcon, SearchIcon, FileTextIcon, ClockIcon } from 'lucide-react'
import { getCaseById } from '@/lib/queries/cases'
import { getDocumentsByCaseId } from '@/lib/queries/documents'
import { getFindingsByCaseId } from '@/lib/queries/findings'
import { getHearingsByCaseId, getCaseHearingsPerMonth } from '@/lib/queries/hearings'
import { CaseStatusBadge, CaseTypeBadge } from '@/components/cases/CaseStatusBadge'
import { CaseDetailTabs } from '@/components/cases/CaseDetailTabs'
import { EditCaseDialog } from '@/components/cases/EditCaseDialog'
import { DeleteCaseDialog } from '@/components/cases/DeleteCaseDialog'
export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

export default function CaseDetailPage({ params }: PageProps) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) notFound()

  const caseData = getCaseById(id)
  if (!caseData) notFound()

  const documents = getDocumentsByCaseId(id)
  const findingList = getFindingsByCaseId(id)
  const hearingList = getHearingsByCaseId(id)
  const hearingChartData = getCaseHearingsPerMonth(id)
  return (
    <div className="min-h-full w-full min-w-0 space-y-6 bg-[#F8FAFC] p-6 sm:p-8 dark:bg-slate-900">
      {/* Back nav + cross-feature shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          All Cases
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/cases/${caseData.id}?tab=chronology`}
            className="inline-flex items-center gap-1.5 rounded-md border border-teal/40 bg-teal/10 px-2.5 py-1.5 text-xs font-semibold text-teal hover:bg-teal/20 transition-colors shadow-2xs"
          >
            <ClockIcon className="w-3.5 h-3.5" />
            Checkpoints &amp; Chronology
          </Link>
          <Link
            href={`/bail-briefs/${caseData.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <ScaleIcon className="w-3.5 h-3.5" />
            Bail &amp; Parole
          </Link>
          <Link
            href={`/verification/${caseData.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <SearchIcon className="w-3.5 h-3.5" />
            Verification
          </Link>
          <Link
            href={`/reports/${caseData.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <FileTextIcon className="w-3.5 h-3.5" />
            Report
          </Link>
        </div>
      </div>

      {/* Case header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all dark:border-slate-700/80 dark:bg-slate-800/80 dark:shadow-md sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold leading-tight text-slate-900 dark:text-slate-100">
                {caseData.title}
              </h1>
              <span className="rounded-md border border-slate-200/80 bg-slate-100 px-3 py-1 font-mono text-xs font-medium text-slate-700">
                {caseData.caseNumber}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CaseStatusBadge status={caseData.status} />
              <CaseTypeBadge caseType={caseData.caseType} />
              {caseData.court && (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                  <span className="font-medium text-slate-700">Court:</span>{' '}
                  {caseData.court}
                </span>
              )}
              {caseData.jurisdiction && (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                  <span className="font-medium text-slate-700">Jurisdiction:</span>{' '}
                  {caseData.jurisdiction}
                </span>
              )}
              {caseData.judge && (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                  <span className="font-medium text-slate-700">Judge:</span>{' '}
                  {caseData.judge}
                </span>
              )}
              {caseData.createdAt && (
                <span className="rounded-md border border-slate-200/80 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700" suppressHydrationWarning>
                  Record created{' '}
                  {new Date(caseData.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <EditCaseDialog caseData={caseData} />
              <DeleteCaseDialog
                caseId={caseData.id}
                caseNumber={caseData.caseNumber}
                caseTitle={caseData.title}
                redirectAfterDelete
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <CaseDetailTabs
        key={caseData.id}
        caseData={caseData}
        documents={documents}
        findings={findingList}
        hearings={hearingList}
        hearingChartData={hearingChartData}
      />
    </div>
  )
}
