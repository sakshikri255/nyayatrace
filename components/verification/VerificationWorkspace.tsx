'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, FileSearchIcon, Bookmark, Search, GripVertical, GitBranch, LayoutTemplate, BriefcaseIcon, TrendingUpIcon, ScaleIcon, Bot } from 'lucide-react'
import { CaseChatDrawer } from './CaseChatDrawer'
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelGroupHandle } from 'react-resizable-panels'
import { DocumentPanel } from './DocumentPanel'
import { DocumentViewer } from './DocumentViewer'
import { FindingsPanel } from './FindingsPanel'
import { AnnotationsPanel } from './AnnotationsPanel'
import { TemporalTimeline } from './TemporalTimeline'
import type { DocumentRow, DocumentWithPages } from '@/lib/queries/documents'
import type { FindingWithSources } from '@/lib/queries/findings'
import type { CaseDetail } from '@/lib/queries/cases'
import { cn } from '@/lib/utils'

interface Props {
  caseData: CaseDetail
  initialDocuments: DocumentRow[]
  initialFindings: FindingWithSources[]
}

type MobileTab = 'documents' | 'viewer' | 'findings' | 'annotations' | 'timeline'
type RightTab = 'findings' | 'annotations' | 'timeline'

type LayoutPreset = '50/50' | 'full-doc' | 'inspection'
const LAYOUT_PRESETS: Record<LayoutPreset, [number, number, number]> = {
  '50/50':      [20, 50, 30],
  'full-doc':   [20, 65, 15],
  'inspection': [18, 38, 44],
}
const PRESET_LABELS: Record<LayoutPreset, string> = {
  '50/50':      '50 / 50',
  'full-doc':   'Full Doc',
  'inspection': 'Inspect',
}
const LAYOUT_KEY = 'nyaya_workspace_layout'

export function VerificationWorkspace({ caseData, initialDocuments, initialFindings }: Props) {
  const [documents, setDocuments] = useState<DocumentRow[]>(initialDocuments)
  const [findings, setFindings] = useState<FindingWithSources[]>(initialFindings)
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    initialDocuments[0]?.id ?? null
  )
  const [selectedFindingId, setSelectedFindingId] = useState<number | null>(null)
  const [documentPages, setDocumentPages] = useState<DocumentWithPages['pages']>([])
  const [loadingPages, setLoadingPages] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('documents')
  const [rightTab, setRightTab] = useState<RightTab>('findings')
  const [activePage, setActivePage] = useState<number>(1)
  const [activePreset, setActivePreset] = useState<LayoutPreset | null>(null)
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null)

  function applyPreset(preset: LayoutPreset) {
    const sizes = LAYOUT_PRESETS[preset]
    panelGroupRef.current?.setLayout(sizes)
    setActivePreset(preset)
    try { localStorage.setItem(LAYOUT_KEY, preset) } catch { /* ignore */ }
  }

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
    { id: 'timeline', label: 'Timeline' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-slate-200 bg-white px-4 py-3">
        <Link
          href="/verification"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal transition-colors shrink-0"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Cases</span>
        </Link>
        <div className="w-px h-5 bg-slate-200 shrink-0" />
        <div className="flex min-w-0 flex-[1_1_20rem] items-center gap-2">
          <FileSearchIcon className="w-4 h-4 text-teal shrink-0" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-mono text-xs font-semibold text-teal">
              {caseData.caseNumber}
            </span>
            <span className="block truncate text-sm font-semibold text-slate-800">
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

        {/* Ask AI button */}
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-teal/30 bg-teal/5 px-2.5 py-1.5 text-xs font-medium text-teal hover:bg-teal/10 transition-colors shrink-0"
        >
          <Bot className="w-3.5 h-3.5" />
          Ask AI
        </button>

        {/* Cross-feature quick links */}
        <div className="hidden md:flex items-center gap-1.5 ml-2">
          <Link
            href={`/cases/${caseData.id}`}
            title="Case Workspace"
            className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <BriefcaseIcon className="w-3 h-3" />
            Case
          </Link>
          <Link
            href={`/bail-briefs/${caseData.id}`}
            title="Bail & Parole Brief"
            className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <ScaleIcon className="w-3 h-3" />
            Bail
          </Link>
          <Link
            href={`/case-progress/${caseData.id}`}
            title="Case Progress"
            className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <TrendingUpIcon className="w-3 h-3" />
            Progress
          </Link>
        </div>
      </header>

      {/* AI Chat Drawer */}
      <CaseChatDrawer
        caseId={caseData.id}
        caseTitle={caseData.title}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />

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
      <div className="hidden lg:flex flex-1 flex-col overflow-hidden">
        {/* Preset layout buttons */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-b border-slate-200 shrink-0">
          <LayoutTemplate className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] text-slate-400 font-medium mr-1">Layout:</span>
          {(Object.keys(LAYOUT_PRESETS) as LayoutPreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              className={cn(
                'rounded px-2.5 py-1 text-[11px] font-semibold transition-colors border',
                activePreset === preset
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              {PRESET_LABELS[preset]}
            </button>
          ))}
        </div>
        <PanelGroup ref={panelGroupRef} direction="horizontal" className="flex-1 w-full">
          {/* Panel 1: Documents Tree */}
          <Panel defaultSize={22} minSize={14} maxSize={35} className="flex flex-col bg-white overflow-hidden">
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

          {/* Panel 2: Document Viewer */}
          <Panel defaultSize={48} minSize={28} className="flex flex-col bg-slate-50 overflow-hidden">
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

          {/* Panel 3: Findings, Notes, Timeline */}
          <Panel defaultSize={30} minSize={16} maxSize={50} className="flex flex-col bg-white overflow-hidden">
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
                Notes
              </button>
              <button
                type="button"
                onClick={() => setRightTab('timeline')}
                className={cn(
                  'flex-1 rounded py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                  rightTab === 'timeline'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <GitBranch className="h-3.5 w-3.5" />
                Timeline
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
              ) : rightTab === 'annotations' ? (
                <AnnotationsPanel
                  caseId={caseData.id}
                  documentId={selectedDocumentId}
                  currentPage={activePage}
                />
              ) : (
                <TemporalTimeline caseId={caseData.id} />
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

        {mobileTab === 'timeline' && (
          <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            <TemporalTimeline caseId={caseData.id} />
          </div>
        )}
      </div>
    </div>
  )
}
