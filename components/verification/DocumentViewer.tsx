'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon, AlertTriangleIcon, ArrowRightIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { DocumentRow, DocumentWithPages } from '@/lib/queries/documents'
import type { FindingWithSources } from '@/lib/queries/findings'

interface Props {
  document: DocumentRow | null
  pages: DocumentWithPages['pages']
  loadingPages: boolean
  selectedFinding: FindingWithSources | null
  onSwitchDocument: (docId: number) => void
}

/**
 * Highlights occurrences of `passage` within `text` by surrounding them with
 * <mark> spans. Returns an array of React elements.
 */
function highlightPassage(text: string, passage: string | null | undefined, isActive: boolean) {
  if (!passage || !isActive) {
    return [<span key="full">{text}</span>]
  }

  const idx = text.indexOf(passage)
  if (idx === -1) {
    // Fuzzy: try first 50 chars of passage
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
      animate={{ backgroundColor: 'rgba(13,148,136,0.15)' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
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
}: Props) {
  const [currentPage, setCurrentPage] = useState(1)
  const highlightRef = useRef<HTMLDivElement>(null)

  // Reset to first page when document changes
  useEffect(() => {
    setCurrentPage(1)
  }, [document?.id])

  // Scroll to highlighted passage when finding changes
  useEffect(() => {
    if (!selectedFinding) return
    const timer = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
    return () => clearTimeout(timer)
  }, [selectedFinding?.id])

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
  if (document.processingStatus === 'pending' || document.processingStatus === 'processing' || loadingPages) {
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

  // ── No pages (complete but empty) ─────────────────────────────────────────
  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
        <p className="text-sm text-slate-500">No extracted text available for this document.</p>
      </div>
    )
  }

  const totalPages = pages.length
  const page = pages[currentPage - 1]

  // Determine active passage for this page
  const primarySource = selectedFinding?.sources.find((s) => s.role === 'primary')
  const compSource = selectedFinding?.sources.find((s) => s.role === 'comparison')

  // Check if the selected finding's primary source is from a different document
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Viewer header */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-600 truncate">{document.originalName}</p>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1 ml-3 shrink-0">
            <button
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 font-medium px-1 tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Cross-document prompt */}
      {isFromDifferentDocument && primarySource && (
        <div className="flex-shrink-0 mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 flex items-start gap-2">
          <AlertTriangleIcon className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-800 font-medium">
              This passage is from a different document
              {primarySource.pageNumber != null && ` (Page ${primarySource.pageNumber})`}.
            </p>
            <button
              onClick={() => onSwitchDocument(primarySource.documentId)}
              className="inline-flex items-center gap-1 mt-1 text-xs text-amber-700 font-semibold hover:underline"
            >
              Switch to that document <ArrowRightIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Page content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Page {page.pageNumber}
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Poor quality notice */}
        {page.quality === 'poor' && (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
            <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Poor scan quality — text may be incomplete or contain errors.
            </p>
          </div>
        )}

        {page.quality === 'unreadable' && (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
            <AlertTriangleIcon className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700">
              Page is unreadable — text extraction was not possible.
            </p>
          </div>
        )}

        {/* Extracted text */}
        <div
          ref={activePassage ? highlightRef : undefined}
          className={cn(
            'font-mono text-sm leading-relaxed text-charcoal whitespace-pre-wrap break-words',
            page.quality === 'unreadable' && 'opacity-50 italic'
          )}
        >
          {page.extractedText
            ? highlightPassage(page.extractedText, activePassage, selectedFinding !== null)
            : (
              <span className="text-slate-400 italic text-xs">No text extracted for this page.</span>
            )}
        </div>
      </div>
    </div>
  )
}
