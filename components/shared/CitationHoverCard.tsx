'use client'

import React, { useState } from 'react'
import { FileText, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CitationHoverCardProps {
  documentId: number
  documentName: string
  pageNumber: number
  passage?: string | null
  role?: 'primary' | 'comparison' | string
  onOpen?: (source: { documentId: number; pageNumber: number }) => void
  children?: React.ReactNode
}

export function CitationHoverCard({
  documentId,
  documentName,
  pageNumber,
  passage,
  role = 'primary',
  onOpen,
  children,
}: CitationHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onOpen) {
      onOpen({ documentId, pageNumber })
    } else {
      window.open(`/api/documents/${documentId}/file#page=${pageNumber}`, '_blank')
    }
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-mono rounded-full px-3 py-1 mt-3 w-fit transition-colors"
      >
        <FileText className="h-3.5 w-3.5 shrink-0" />
        {children || `${documentName}, p. ${pageNumber}`}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-xl transition-all duration-150 animate-in fade-in zoom-in-95">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase shrink-0',
                  role === 'primary' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                )}
              >
                {role}
              </span>
              <span className="truncate text-xs font-semibold text-slate-800" title={documentName}>
                {documentName}
              </span>
            </div>
            <span className="shrink-0 text-[11px] font-medium text-slate-500">p. {pageNumber}</span>
          </div>

          <div className="mt-2 text-xs leading-relaxed text-slate-600 max-h-32 overflow-y-auto">
            {passage ? (
              <p className="italic text-slate-700">“{passage}”</p>
            ) : (
              <p className="text-slate-400">Source verified in document page text.</p>
            )}
          </div>

          <div className="mt-2.5 flex justify-end pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={handleOpen}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900"
            >
              Open Page in Viewer <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
