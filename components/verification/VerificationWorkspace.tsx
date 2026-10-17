'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, FileSearchIcon } from 'lucide-react'
import { DocumentPanel } from './DocumentPanel'
import { DocumentViewer } from './DocumentViewer'
import { FindingsPanel } from './FindingsPanel'
import type { DocumentRow, DocumentWithPages } from '@/lib/queries/documents'
import type { FindingWithSources } from '@/lib/queries/findings'
import type { CaseDetail } from '@/lib/queries/cases'

interface Props {
  caseData: CaseDetail
  initialDocuments: DocumentRow[]
  initialFindings: FindingWithSources[]
}

type MobileTab = 'documents' | 'viewer' | 'findings'

export function VerificationWorkspace({ caseData, initialDocuments, initialFindings }: Props) {
  const [documents, setDocuments] = useState<DocumentRow[]>(initialDocuments)
  const [findings, setFindings] = useState<FindingWithSources[]>(initialFindings)
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    initialDocuments[0]?.id ?? null
  )
  const [selectedFindingId, setSelectedFindingId] = useState<number | null>(null)
  const [documentPages, setDocumentPages] = useState<DocumentWithPages['pages']>([])
  const [loadingPages, setLoadingPages] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('documents')

  const needsReview = findings.filter((f) => f.reviewStatus === 'needs_review').length
  const verified = findings.filter((f) => f.reviewStatus === 'verified').length

  const handleSelectDocument = useCallback(async (docId: number) => {
    setSelectedDocumentId(docId)
    setLoadingPages(true)
    try {
      const res = await fetch(`/api/documents/${docId}`)
      if (res.ok) {
        const data = (await res.json()) as DocumentWithPages
        setDocumentPages(data.pages)
      }
    } catch {
      // noop — page may not be loaded yet
    } finally {
      setLoadingPages(false)
    }
  }, [])

  const handleSelectFinding = useCallback(
    async (findingId: number) => {
      setSelectedFindingId(findingId)
      const finding = findings.find((f) => f.id === findingId)
      if (!finding) return

      // If the primary source is from a different document, switch to it
      const primarySource = finding.sources.find((s) => s.role === 'primary')
      if (primarySource && primarySource.documentId !== selectedDocumentId) {
        // Don't auto-switch — DocumentViewer shows the prompt. But on mobile switch to viewer tab.
        setMobileTab('viewer')
        return
      }
      setMobileTab('viewer')
    },
    [findings, selectedDocumentId]
  )

  const handleFindingUpdate = useCallback((updated: FindingWithSources) => {
    setFindings((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
  }, [])

  const handleDocumentAdded = useCallback((doc: DocumentRow) => {
    setDocuments((prev) => [...prev, doc])
  }, [])

  const handleDocumentUpdated = useCallback((updated: DocumentRow) => {
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
  }, [])

  const selectedDocument = documents.find((d) => d.id === selectedDocumentId) ?? null
  const selectedFinding = findings.find((f) => f.id === selectedFindingId) ?? null

  const TABS: { id: MobileTab; label: string }[] = [
    { id: 'documents', label: 'Documents' },
    { id: 'viewer', label: 'Viewer' },
    { id: 'findings', label: `Findings (${findings.length})` },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4">
        <Link
          href="/verification"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal transition-colors shrink-0"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Cases</span>
        </Link>
        <div className="w-px h-5 bg-slate-200 shrink-0" />
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileSearchIcon className="w-4 h-4 text-teal shrink-0" />
          <div className="min-w-0">
            <span className="font-mono text-xs font-semibold text-teal mr-2">
              {caseData.caseNumber}
            </span>
            <span className="text-sm font-semibold text-slate-800 truncate">
              {caseData.title}
            </span>
          </div>
        </div>
        {/* Stat strip */}
        <div className="hidden sm:flex items-center gap-4 shrink-0 text-center">
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-slate-700 leading-none">{findings.length}</span>
            <span className="text-xs text-slate-400 mt-0.5">Findings</span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-amber-600 leading-none">{needsReview}</span>
            <span className="text-xs text-slate-400 mt-0.5">Pending</span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-emerald-600 leading-none">{verified}</span>
            <span className="text-xs text-slate-400 mt-0.5">Verified</span>
          </div>
        </div>
      </header>

      {/* ── Mobile tab strip ───────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex lg:hidden border-b border-slate-200 bg-white">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
              mobileTab === tab.id
                ? 'text-teal border-teal'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Desktop three-panel layout ─────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Panel — 24% */}
        <div
          className={`${mobileTab === 'documents' ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-[24%] border-r border-slate-200 bg-white overflow-hidden`}
        >
          <DocumentPanel
            caseId={caseData.id}
            documents={documents}
            selectedDocumentId={selectedDocumentId}
            onSelectDocument={handleSelectDocument}
            onDocumentAdded={handleDocumentAdded}
            onDocumentUpdated={handleDocumentUpdated}
          />
        </div>

        {/* Document Viewer — 48% */}
        <div
          className={`${mobileTab === 'viewer' ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-[48%] border-r border-slate-200 bg-slate-50 overflow-hidden`}
        >
          <DocumentViewer
            document={selectedDocument}
            pages={documentPages}
            loadingPages={loadingPages}
            selectedFinding={selectedFinding}
            onSwitchDocument={handleSelectDocument}
          />
        </div>

        {/* Findings Panel — 28% */}
        <div
          className={`${mobileTab === 'findings' ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-[28%] bg-white overflow-hidden`}
        >
          <FindingsPanel
            findings={findings}
            selectedFindingId={selectedFindingId}
            onSelectFinding={handleSelectFinding}
            onFindingUpdate={handleFindingUpdate}
          />
        </div>
      </div>
    </div>
  )
}
