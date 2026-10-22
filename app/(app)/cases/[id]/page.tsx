import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, TrendingUpIcon, ScaleIcon, SearchIcon, FileTextIcon, ClockIcon } from 'lucide-react'
import { getCaseById } from '@/lib/queries/cases'
import { getDocumentsByCaseId } from '@/lib/queries/documents'
import { getFindingsByCaseId } from '@/lib/queries/findings'
import { getHearingsByCaseId } from '@/lib/queries/hearings'
import { db } from '@/lib/db'
import { judicialOrders, bailConditions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
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
  const orderList = db
    .select()
    .from(judicialOrders)
    .where(eq(judicialOrders.caseId, id))
    .orderBy(judicialOrders.orderDate)
    .all()
  const conditionList = db
    .select()
    .from(bailConditions)
    .where(eq(bailConditions.caseId, id))
    .all()

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Back nav + cross-feature shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
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
            href={`/case-progress/${caseData.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <TrendingUpIcon className="w-3.5 h-3.5" />
            Progress
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
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 mb-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-teal tracking-tight">
                {caseData.caseNumber}
              </span>
              <CaseStatusBadge status={caseData.status} />
              <CaseTypeBadge caseType={caseData.caseType} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              {caseData.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              {caseData.court && (
                <span className="text-sm text-slate-500">
                  <span className="text-slate-400 font-medium">Court:</span>{' '}
                  {caseData.court}
                </span>
              )}
              {caseData.jurisdiction && (
                <span className="text-sm text-slate-500">
                  <span className="text-slate-400 font-medium">Jurisdiction:</span>{' '}
                  {caseData.jurisdiction}
                </span>
              )}
              {caseData.judge && (
                <span className="text-sm text-slate-500">
                  <span className="text-slate-400 font-medium">Judge:</span>{' '}
                  {caseData.judge}
                </span>
              )}
              {caseData.createdAt && (
                <span className="text-sm text-slate-400" suppressHydrationWarning>
                  Filed{' '}
                  {new Date(caseData.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>
          {/* Quick stats strip */}
          <div className="flex flex-wrap items-center justify-end gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <EditCaseDialog caseData={caseData} />
              <DeleteCaseDialog
                caseId={caseData.id}
                caseNumber={caseData.caseNumber}
                caseTitle={caseData.title}
                redirectAfterDelete
              />
            </div>
            <div className="flex gap-4 text-center">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-slate-800">{documents.length}</span>
              <span className="text-xs text-slate-500">Documents</span>
            </div>
            <div className="w-px bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-slate-800">{findingList.length}</span>
              <span className="text-xs text-slate-500">Findings</span>
            </div>
            <div className="w-px bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-slate-800">{hearingList.length}</span>
              <span className="text-xs text-slate-500">Hearings</span>
            </div>
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
        orders={orderList}
        conditions={conditionList}
      />
    </div>
  )
}
