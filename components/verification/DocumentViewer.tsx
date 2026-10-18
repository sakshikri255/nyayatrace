'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  Columns,
  Maximize2,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DocumentRow, DocumentWithPages } from '@/lib/queries/documents'
import type { FindingWithSources } from '@/lib/queries/findings'

interface Props {
  document: DocumentRow | null
  pages: DocumentWithPages['pages']
  loadingPages: boolean
  selectedFinding: FindingWithSources | null
  onSwitchDocument: (docId: number) => void
  allDocuments?: DocumentRow[]
  allFindings?: FindingWithSources[]
  onPageChange?: (page: number) => void
}

function highlightPassage(text: string, passage: string | null | undefined, isActive: boolean) {
  if (!passage || !isActive) {
    return [<span key="full">{text}</span>]
  }

  const idx = text.indexOf(passage)
  if (idx === -1) {
    const short = passage.slice(0, 50)
    const shortIdx = text.indexOf(short)
    if (shortIdx === -1) return [<span key="full">{text}</span>]
    return [
      <span key="before">{text.slice(0, shortIdx)}</span>,
      <HighlightSpan key="match" text={text.slice(shortIdx, shortIdx + short.length)} />,
      <span key="after">{text.slice(shortIdx + short.length)}</span>,
    ]
  }

  return [
    <span key="before">{text.slice(0, idx)}</span>,
    <HighlightSpan key="match" text={text.slice(idx, idx + passage.length)} />,
    <span key="after">{text.slice(idx + passage.length)}</span>,
  ]
}

function HighlightSpan({ text }: { text: string }) {
  return (
    <motion.mark
      className="bg-transparent border-l-2 border-teal rounded-sm px-0.5 not-italic"
      initial={{ backgroundColor: 'transparent' }}
      animate={{ backgroundColor: 'rgba(13,148,136,0.18)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {text}
    </motion.mark>
  )
}

export function DocumentViewer({
  document,
  pages,
  loadingPages,
  selectedFinding,
  onSwitchDocument,
  allDocuments = [],
  allFindings = [],
  onPageChange,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1)
  const [dualView, setDualView] = useState(false)
  const [secondaryDocId, setSecondaryDocId] = useState<number | null>(null)
  const [secondaryPages, setSecondaryPages] = useState<DocumentWithPages['pages']>([])
  const [secondaryPage, setSecondaryPage] = useState(1)
  const [loadingSecondary, setLoadingSecondary] = useState(false)
  const highlightRef = useRef<HTMLDivElement>(null)

  // Notify parent on page change
  const handlePageSelect = useCallback(
    (p: number) => {
      setCurrentPage(p)
      onPageChange?.(p)
    },
    [onPageChange]
  )

  // Reset to first page when document changes
  useEffect(() => {
    handlePageSelect(1)
  }, [document?.id, handlePageSelect])

  // If a finding is selected and it has a comparison document, auto-configure dual view
  useEffect(() => {
    if (!selectedFinding) return

    const primarySource = selectedFinding.sources.find((s) => s.role === 'primary')
    const compSource = selectedFinding.sources.find((s) => s.role === 'comparison')

    if (primarySource && compSource && primarySource.documentId !== compSource.documentId) {
      if (document?.id === primarySource.documentId) {
        setSecondaryDocId(compSource.documentId)
        if (compSource.pageNumber) setSecondaryPage(compSource.pageNumber)
      } else if (document?.id === compSource.documentId) {
        setSecondaryDocId(primarySource.documentId)
        if (primarySource.pageNumber) setSecondaryPage(primarySource.pageNumber)
      }
    }

    if (primarySource?.documentId === document?.id && primarySource?.pageNumber) {
      handlePageSelect(primarySource.pageNumber)
    }

    const timer = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
    return () => clearTimeout(timer)
  }, [selectedFinding, document?.id, handlePageSelect])

  // Load secondary document pages when secondaryDocId changes in dual view
  useEffect(() => {
    if (!secondaryDocId) return
    let active = true
    setLoadingSecondary(true)
    fetch(`/api/documents/${secondaryDocId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DocumentWithPages | null) => {
        if (active && data) {
          setSecondaryPages(data.pages)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingSecondary(false)
      })

    return () => {
      active = false
    }
  }, [secondaryDocId])

  // ── No document selected ─────────────────────────────────────────────────
  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          <ChevronRightIcon className="w-6 h-6 text-slate-300" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Select a document to view extracted text</p>
          <p className="text-xs text-slate-400 mt-1">
            Click any document in the left panel to load its content here.
          </p>
        </div>
      </div>
    )
  }

  // ── Document is processing ────────────────────────────────────────────────
  if (
    document.processingStatus === 'pending' ||
    document.processingStatus === 'processing' ||
    loadingPages
  ) {
    return (
      <div className="flex flex-col h-full p-4 gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Processing document…
        </div>
        <Skeleton className="flex-1 rounded-lg" />
      </div>
    )
  }

  // ── Failed ────────────────────────────────────────────────────────────────
  if (document.processingStatus === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
        <AlertTriangleIcon className="w-8 h-8 text-red-300" />
        <p className="text-sm font-medium text-slate-600">Processing failed</p>
        <p className="text-xs text-slate-400">
          The document could not be processed. Try uploading again.
        </p>
      </div>
    )
  }

  // ── No pages ──────────────────────────────────────────────────────────────
  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
        <p className="text-sm text-slate-500">No extracted text available for this document.</p>
      </div>
    )
  }

  const totalPages = pages.length
  const page = pages[currentPage - 1] || pages[0]

  // Discrepancy Map for Scrubber Bar
  const pageDiscrepancies = new Map<number, { severity: 'high' | 'medium' | 'low'; count: number }>()
  for (const f of allFindings) {
    for (const src of f.sources) {
      if (src.documentId === document.id && src.pageNumber) {
        const cur = pageDiscrepancies.get(src.pageNumber)
        if (!cur) {
          pageDiscrepancies.set(src.pageNumber, { severity: f.severity, count: 1 })
        } else {
          cur.count += 1
          if (f.severity === 'high') cur.severity = 'high'
        }
      }
    }
  }

  // Determine active passage for primary pane
  const primarySource = selectedFinding?.sources.find((s) => s.role === 'primary')
  const compSource = selectedFinding?.sources.find((s) => s.role === 'comparison')

  const isFromDifferentDocument =
    selectedFinding != null &&
    primarySource != null &&
    primarySource.documentId !== document.id

  const activePassage =
    primarySource?.documentId === document.id
      ? primarySource?.passage
      : compSource?.documentId === document.id
      ? compSource?.passage
      : null

  // Secondary document handling
  const secondaryDoc = allDocuments.find((d) => d.id === secondaryDocId) ?? null
  const secondaryCurrentPage = secondaryPages[secondaryPage - 1] || secondaryPages[0]
  const secondaryPassage =
    secondaryDoc && compSource?.documentId === secondaryDoc.id
      ? compSource?.passage
      : primarySource?.documentId === secondaryDoc?.id
      ? primarySource?.passage
      : null

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* ── Viewer Header ────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-slate-200 flex items-center justify-between bg-white gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-teal shrink-0" />
          <span className="text-xs font-semibold text-slate-700 truncate" title={document.originalName}>
            {document.originalName}
          </span>
          {document.language && (
            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-mono text-slate-500 uppercase">
              {document.language}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Dual View Toggle */}
          <Button
            size="sm"
            variant={dualView ? 'default' : 'outline'}
            onClick={() => {
              const next = !dualView
              setDualView(next)
              if (next && !secondaryDocId) {
                const other = allDocuments.find((d) => d.id !== document.id)
                if (other) setSecondaryDocId(other.id)
              }
            }}
            className={cn(
              'h-7 px-2.5 text-xs gap-1',
              dualView ? 'bg-teal text-white hover:bg-teal-light' : 'border-slate-300 text-slate-600'
            )}
            title="Toggle side-by-side synchronized document comparison"
          >
            <Columns className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{dualView ? 'Dual View' : 'Compare'}</span>
          </Button>

          {/* Primary page pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 px-1 py-0.5">
              <button
                className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                onClick={() => handlePageSelect(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-slate-600 font-medium px-1 tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button
                className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                onClick={() => handlePageSelect(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cross-document prompt */}
      {isFromDifferentDocument && primarySource && (
        <div className="flex-shrink-0 mx-4 mt-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2">
          <AlertTriangleIcon className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-800 font-medium">
              This passage is from another document
              {primarySource.pageNumber != null && ` (Page ${primarySource.pageNumber})`}.
            </p>
            <button
              onClick={() => onSwitchDocument(primarySource.documentId)}
              className="inline-flex items-center gap-1 mt-0.5 text-xs text-amber-700 font-semibold hover:underline"
            >
              Switch to primary source <ArrowRightIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Content Area with Minimap Scrubber ────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Document Content or Dual View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Pane A: Primary Document */}
          <div className={cn('flex-1 flex flex-col overflow-y-auto px-5 py-4', dualView && 'border-r border-slate-200')}>
            {dualView && (
              <div className="mb-2 pb-1 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
                <span>Primary Document (p. {currentPage})</span>
                <span className="text-teal font-bold">{document.originalName}</span>
              </div>
            )}

            {page?.quality === 'poor' && (
              <div className="mb-2 flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">
                <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Poor OCR scan quality — text may contain transcription artifacts.</span>
              </div>
            )}

            <div
              ref={activePassage ? highlightRef : undefined}
              className="font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap break-words"
            >
              {page?.extractedText
                ? highlightPassage(page.extractedText, activePassage, selectedFinding !== null)
                : <span className="text-slate-400 italic">No text extracted for page {currentPage}.</span>}
            </div>
          </div>

          {/* Pane B: Comparison Document (Dual View) */}
          {dualView && (
            <div className="flex-1 flex flex-col overflow-y-auto px-5 py-4 bg-slate-50/60">
              <div className="mb-2 pb-1 border-b border-slate-200 flex items-center justify-between gap-2">
                <select
                  value={secondaryDocId ?? ''}
                  onChange={(e) => {
                    const id = Number(e.target.value)
                    setSecondaryDocId(id)
                    setSecondaryPage(1)
                  }}
                  className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 max-w-[200px] truncate"
                >
                  {allDocuments.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.originalName}
                    </option>
                  ))}
                </select>

                {secondaryPages.length > 1 && (
                  <div className="flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1 py-0.5 text-[11px]">
                    <button
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      onClick={() => setSecondaryPage((p) => Math.max(1, p - 1))}
                      disabled={secondaryPage === 1}
                    >
                      <ChevronLeftIcon className="w-3 h-3" />
                    </button>
                    <span className="px-1 text-slate-600 font-medium">
                      {secondaryPage} / {secondaryPages.length}
                    </span>
                    <button
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      onClick={() => setSecondaryPage((p) => Math.min(secondaryPages.length, p + 1))}
                      disabled={secondaryPage === secondaryPages.length}
                    >
                      <ChevronRightIcon className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {loadingSecondary ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading comparison text...</div>
              ) : secondaryCurrentPage ? (
                <div className="font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap break-words">
                  {secondaryCurrentPage.extractedText
                    ? highlightPassage(
                        secondaryCurrentPage.extractedText,
                        secondaryPassage,
                        selectedFinding !== null
                      )
                    : <span className="text-slate-400 italic">No text extracted.</span>}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Select a document to compare side-by-side.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Document Scrubber Minimap Rail ──────────────────────────── */}
        {totalPages > 1 && (
          <div
            className="w-8 shrink-0 border-l border-slate-200 bg-white flex flex-col items-center py-2 gap-1 overflow-y-auto"
            title="Page Scrubber Minimap (Click any dot to jump to page)"
          >
            {pages.map((p) => {
              const isCurrent = p.pageNumber === currentPage
              const disc = pageDiscrepancies.get(p.pageNumber)

              return (
                <button
                  key={p.pageNumber}
                  type="button"
                  onClick={() => handlePageSelect(p.pageNumber)}
                  className={cn(
                    'group relative flex h-4 w-5 items-center justify-center rounded transition-all',
                    isCurrent ? 'bg-teal/20 text-teal-800 font-bold' : 'hover:bg-slate-100 text-slate-400'
                  )}
                  title={`Page ${p.pageNumber}${disc ? ` (${disc.count} discrepancy)` : ''}`}
                >
                  {disc ? (
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        disc.severity === 'high'
                          ? 'bg-rose-500 ring-2 ring-rose-200'
                          : 'bg-amber-500 ring-2 ring-amber-200'
                      )}
                    />
                  ) : (
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        isCurrent ? 'bg-teal' : 'bg-slate-300 group-hover:bg-slate-400'
                      )}
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
