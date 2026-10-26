'use client'

import type { CaseDetail } from '@/lib/queries/cases'
import type { DocumentRow } from '@/lib/queries/documents'
import type { FindingRow } from '@/lib/queries/findings'
import type { HearingRow } from '@/lib/queries/hearings'
import { DocumentsTab } from './DocumentsTab'
import { OverviewTab } from './OverviewTab'

interface UploadsTabProps {
  caseData: CaseDetail
  documents: DocumentRow[]
  findings: FindingRow[]
  hearings: HearingRow[]
  onGoToAnalysis?: () => void
}

/**
 * Unified "Uploads" tab: shows the document upload zone and file list first,
 * followed by the case overview summary below.
 */
export function UploadsTab({
  caseData,
  documents,
  findings,
  hearings,
  onGoToAnalysis,
}: UploadsTabProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* ── Section 1: Document Upload & File List ──────────────── */}
      <DocumentsTab caseId={caseData.id} initialDocuments={documents} />

      {/* ── Section 2: Case Overview (stats, findings, hearings) ── */}
      <div className="border-t border-slate-200 pt-6 dark:border-slate-700/80">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Case Overview
        </h2>
        <OverviewTab
          caseData={caseData}
          documents={documents}
          findings={findings}
          hearings={hearings}
          onGoToAnalysis={onGoToAnalysis}
        />
      </div>
    </div>
  )
}
