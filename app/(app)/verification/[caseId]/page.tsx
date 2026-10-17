import { notFound } from 'next/navigation'
import { getCaseById } from '@/lib/queries/cases'
import { getDocumentsByCaseId } from '@/lib/queries/documents'
import { getFindingsByCaseId, getFindingWithSources } from '@/lib/queries/findings'
import { VerificationWorkspace } from '@/components/verification/VerificationWorkspace'
import type { FindingWithSources } from '@/lib/queries/findings'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { caseId: string }
}

export default function VerificationWorkspacePage({ params }: PageProps) {
  const caseId = parseInt(params.caseId, 10)
  if (isNaN(caseId)) notFound()

  const caseData = getCaseById(caseId)
  if (!caseData) notFound()

  const documents = getDocumentsByCaseId(caseId)
  const findingRows = getFindingsByCaseId(caseId)

  // Enrich each finding with its sources
  const findings: FindingWithSources[] = findingRows.map((f) => {
    const withSources = getFindingWithSources(f.id)
    return withSources ?? { ...f, sources: [] }
  })

  return (
    // Use a fixed viewport-height container so the workspace fills the screen
    // and each panel scrolls independently (instead of relying on the outer main scroll)
    <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden">
      <VerificationWorkspace
        caseData={caseData}
        initialDocuments={documents}
        initialFindings={findings}
      />
    </div>
  )
}
