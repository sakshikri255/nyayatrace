import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
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
import { PageTransition } from '@/components/layout/PageTransition'

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
    <PageTransition>
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Back nav */}
      <Link
        href="/cases"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal transition-colors mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        All Cases
      </Link>

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
                <span className="text-sm text-slate-400">
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
            <EditCaseDialog caseData={caseData} />
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
        caseData={caseData}
        documents={documents}
        findings={findingList}
        hearings={hearingList}
        orders={orderList}
        conditions={conditionList}
      />
    </div>
    </PageTransition>
  )
}
