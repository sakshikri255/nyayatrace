'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, FileSearchIcon, Bookmark, Search, GripVertical } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { DocumentPanel } from './DocumentPanel'
import { DocumentViewer } from './DocumentViewer'
import { FindingsPanel } from './FindingsPanel'
import { AnnotationsPanel } from './AnnotationsPanel'
import type { DocumentRow, DocumentWithPages } from '@/lib/queries/documents'
import type { FindingWithSources } from '@/lib/queries/findings'
import type { CaseDetail } from '@/lib/queries/cases'
import { cn } from '@/lib/utils'

interface Props {
  caseData: CaseDetail
  initialDocuments: DocumentRow[]
  initialFindings: FindingWithSources[]
}

type MobileTab = 'documents' | 'viewer' | 'findings' | 'annotations'
type RightTab = 'findings' | 'annotations'

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
  const [rightTab, setRightTab] = useState<RightTab>('findings')
  const [activePage, setActivePage] = useState<number>(1)

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

      const primarySource = finding.sources.find((s) => s.role === 'primary')
      if (primarySource && primarySource.documentId !== selectedDocumentId) {
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
    { id: 'annotations', label: 'Notes' },
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

      {/* ── Mobile Tab Strip (Small screens only) ───────────────────────── */}
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

      {/* ── Desktop Resizable Workspace (lg screens) ──────────────────── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full w-full">
          {/* Panel 1: Documents Tree (Default 22%) */}
          <Panel defaultSize={22} minSize={16} maxSize={35} className="flex flex-col bg-white overflow-hidden">
            <DocumentPanel
              caseId={caseData.id}
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={handleSelectDocument}
              onDocumentAdded={handleDocumentAdded}
              onDocumentUpdated={handleDocumentUpdated}
            />
          </Panel>

          {/* Resizer 1 */}
          <PanelResizeHandle className="w-1.5 bg-slate-200 hover:bg-teal transition-colors cursor-col-resize flex items-center justify-center group">
            <GripVertical className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
          </PanelResizeHandle>

          {/* Panel 2: Document Viewer (Default 48%) */}
          <Panel defaultSize={48} minSize={30} className="flex flex-col bg-slate-50 overflow-hidden">
            <DocumentViewer
              document={selectedDocument}
              pages={documentPages}
              loadingPages={loadingPages}
              selectedFinding={selectedFinding}
              onSwitchDocument={handleSelectDocument}
              allDocuments={documents}
              allFindings={findings}
              onPageChange={setActivePage}
            />
          </Panel>

          {/* Resizer 2 */}
          <PanelResizeHandle className="w-1.5 bg-slate-200 hover:bg-teal transition-colors cursor-col-resize flex items-center justify-center group">
            <GripVertical className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
          </PanelResizeHandle>

          {/* Panel 3: Findings & Evidence Annotations Tabs (Default 30%) */}
          <Panel defaultSize={30} minSize={20} maxSize={45} className="flex flex-col bg-white overflow-hidden">
            {/* Tab switch header */}
            <div className="flex border-b border-slate-200 bg-slate-50 p-1 shrink-0">
              <button
                type="button"
                onClick={() => setRightTab('findings')}
                className={cn(
                  'flex-1 rounded py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                  rightTab === 'findings'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <Search className="h-3.5 w-3.5" />
                Findings ({findings.length})
              </button>
              <button
                type="button"
                onClick={() => setRightTab('annotations')}
                className={cn(
                  'flex-1 rounded py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                  rightTab === 'annotations'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <Bookmark className="h-3.5 w-3.5" />
                Evidence Notes
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {rightTab === 'findings' ? (
                <FindingsPanel
                  findings={findings}
                  selectedFindingId={selectedFindingId}
                  onSelectFinding={handleSelectFinding}
                  onFindingUpdate={handleFindingUpdate}
                />
              ) : (
                <AnnotationsPanel
                  caseId={caseData.id}
                  documentId={selectedDocumentId}
                  currentPage={activePage}
                />
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* ── Mobile Viewport ────────────────────────────────────────────── */}
      <div className="flex lg:hidden flex-1 overflow-hidden">
        {mobileTab === 'documents' && (
          <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            <DocumentPanel
              caseId={caseData.id}
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={handleSelectDocument}
              onDocumentAdded={handleDocumentAdded}
              onDocumentUpdated={handleDocumentUpdated}
            />
          </div>
        )}

        {mobileTab === 'viewer' && (
          <div className="w-full h-full flex flex-col bg-slate-50 overflow-hidden">
            <DocumentViewer
              document={selectedDocument}
              pages={documentPages}
              loadingPages={loadingPages}
              selectedFinding={selectedFinding}
              onSwitchDocument={handleSelectDocument}
              allDocuments={documents}
              allFindings={findings}
              onPageChange={setActivePage}
            />
          </div>
        )}

        {mobileTab === 'findings' && (
          <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            <FindingsPanel
              findings={findings}
              selectedFindingId={selectedFindingId}
              onSelectFinding={handleSelectFinding}
              onFindingUpdate={handleFindingUpdate}
            />
          </div>
        )}

        {mobileTab === 'annotations' && (
          <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            <AnnotationsPanel
              caseId={caseData.id}
              documentId={selectedDocumentId}
              currentPage={activePage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
