'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  FileTextIcon,
  ImageIcon,
  UploadCloudIcon,
  FileIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  LoaderIcon,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DocumentRow } from '@/lib/queries/documents'

interface PageQuality {
  id: number
  pageNumber: number
  quality: 'good' | 'poor' | 'unreadable'
}

const QUALITY_COLORS: Record<string, string> = {
  good: 'bg-emerald-500',
  poor: 'bg-amber-400',
  unreadable: 'bg-red-500',
}

function PageQualityBar({ docId, processingStatus }: { docId: number; processingStatus: string }) {
  const [pageQuality, setPageQuality] = useState<PageQuality[] | null>(null)
  const [reprocessing, setReprocessing] = useState<number | null>(null)

  useEffect(() => {
    if (processingStatus !== 'complete') return
    fetch(`/api/documents/${docId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.pages) {
          setPageQuality(data.pages as PageQuality[])
        }
      })
      .catch(() => {})
  }, [docId, processingStatus])

  if (!pageQuality || pageQuality.length === 0) return null

  const readable = pageQuality.filter((p) => p.quality === 'good').length
  const hasUnreadable = pageQuality.some((p) => p.quality === 'unreadable')
  const displayPages = pageQuality.slice(0, 30)
  const extra = pageQuality.length - 30

  async function handleReprocess(pageId: number) {
    setReprocessing(pageId)
    try {
      const res = await fetch(`/api/documents/${docId}/reprocess-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId }),
      })
      if (res.ok) {
        const updated = await res.json() as PageQuality
        setPageQuality((prev) => prev ? prev.map((p) => p.id === pageId ? updated : p) : prev)
        toast.success('Page reprocessed.')
      } else {
        toast.error('Reprocess failed.')
      }
    } catch {
      toast.error('Reprocess failed.')
    } finally {
      setReprocessing(null)
    }
  }

  return (
    <div className="mt-1.5 px-0">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-[10px] text-slate-400">
          {readable}/{pageQuality.length} pages readable
        </span>
        {hasUnreadable && (
          <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
        )}
      </div>
      <div className="flex items-center flex-wrap gap-0.5">
        {displayPages.map((p) => (
          <div key={p.id} className="group relative">
            <button
              title={`Page ${p.pageNumber} — ${p.quality}`}
              className={cn(
                'w-1.5 h-1.5 rounded-[1px] transition-transform group-hover:scale-150',
                QUALITY_COLORS[p.quality]
              )}
              onClick={(e) => {
                e.stopPropagation()
                if (p.quality === 'poor' || p.quality === 'unreadable') {
                  handleReprocess(p.id)
                }
              }}
            />
            {(p.quality === 'poor' || p.quality === 'unreadable') && reprocessing !== p.id && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 hidden group-hover:flex items-center gap-1 bg-slate-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap pointer-events-none">
                <RefreshCw className="w-2.5 h-2.5" />
                Re-process
              </div>
            )}
            {reprocessing === p.id && (
              <LoaderIcon className="absolute -top-1 -left-0.5 w-2.5 h-2.5 animate-spin text-teal" />
            )}
          </div>
        ))}
        {extra > 0 && (
          <span className="text-[10px] text-slate-400 ml-0.5">+{extra}</span>
        )}
      </div>
    </div>
  )
}

interface Props {
  caseId: number
  documents: DocumentRow[]
  selectedDocumentId: number | null
  onSelectDocument: (id: number) => void
  onDocumentAdded: (doc: DocumentRow) => void
  onDocumentUpdated: (doc: DocumentRow) => void
}

const STATUS_CONFIG = {
  pending: {
    label: 'Queued',
    className: 'bg-slate-100 text-slate-500',
    icon: null,
  },
  processing: {
    label: 'Processing…',
    className: 'bg-blue-100 text-blue-600 animate-pulse',
    icon: null,
  },
  complete: {
    label: 'Ready',
    className: 'bg-emerald-100 text-emerald-700',
    icon: <CheckCircle2Icon className="w-3 h-3" />,
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-600',
    icon: <AlertCircleIcon className="w-3 h-3" />,
  },
} as const

function DocIcon({ fileType }: { fileType: DocumentRow['fileType'] }) {
  if (fileType === 'image') return <ImageIcon className="w-4 h-4 text-indigo-400" />
  if (fileType === 'scan') return <FileIcon className="w-4 h-4 text-amber-400" />
  return <FileTextIcon className="w-4 h-4 text-teal" />
}

function getDocCategoryBadge(name: string) {
  if (name.includes('Police') || name.includes('FIR') || name.includes('Panchnama')) {
    return { label: 'POLICE RECORD', className: 'bg-blue-50 text-blue-700 border-blue-200' }
  }
  if (name.includes('Witness') || name.includes('PW-') || name.includes('Deposition')) {
    return { label: 'WITNESS', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  }
  if (name.includes('Forensic') || name.includes('Toxicology') || name.includes('RFSL')) {
    return { label: 'FORENSIC PROOF', className: 'bg-amber-50 text-amber-700 border-amber-200' }
  }
  if (name.includes('Digital') || name.includes('Cyber') || name.includes('Biometric') || name.includes('CDR')) {
    return { label: 'CYBER PROOF', className: 'bg-teal-50 text-teal-700 border-teal-200' }
  }
  return null
}

export function DocumentPanel({
  caseId,
  documents,
  selectedDocumentId,
  onSelectDocument,
  onDocumentAdded,
  onDocumentUpdated,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Track which docs need polling (non-terminal status)
  const pollTimers = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map())

  const startPolling = useCallback(
    (docId: number) => {
      if (pollTimers.current.has(docId)) return
      const timer = setInterval(async () => {
        try {
          const res = await fetch(`/api/documents/${docId}`)
          if (!res.ok) return
          const data = (await res.json()) as DocumentRow
          onDocumentUpdated(data)
          if (data.processingStatus === 'complete') {
            toast.success(`Document processed: ${data.originalName}`)
            clearInterval(timer)
            pollTimers.current.delete(docId)
          } else if (data.processingStatus === 'failed') {
            toast.error(`Processing failed: ${data.originalName}`)
            clearInterval(timer)
            pollTimers.current.delete(docId)
          }
        } catch {
          // noop
        }
      }, 2000)
      pollTimers.current.set(docId, timer)
    },
    [onDocumentUpdated]
  )

  // Start polling for any non-terminal docs on mount
  useEffect(() => {
    documents.forEach((doc) => {
      if (doc.processingStatus === 'pending' || doc.processingStatus === 'processing') {
        startPolling(doc.id)
      }
    })
    return () => {
      pollTimers.current.forEach((timer) => clearInterval(timer))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Watch for newly added docs that need polling
  useEffect(() => {
    documents.forEach((doc) => {
      if (doc.processingStatus === 'pending' || doc.processingStatus === 'processing') {
        startPolling(doc.id)
      }
    })
  }, [documents, startPolling])

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('caseId', String(caseId))

      try {
        const res = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const err = (await res.json()) as { error?: string }
          toast.error(err.error ?? 'Upload failed')
          return
        }

        const doc = (await res.json()) as DocumentRow
        onDocumentAdded(doc)
        onSelectDocument(doc.id)
        startPolling(doc.id)
        toast.success('Upload started — processing document…')
      } catch {
        toast.error('Failed to upload document')
      } finally {
        setUploading(false)
      }
    },
    [caseId, onDocumentAdded, onSelectDocument, startPolling]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) uploadFile(file)
    },
    [uploadFile]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) uploadFile(file)
      e.target.value = ''
    },
    [uploadFile]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Documents
        </span>
        <span className="text-xs text-slate-400">{documents.length}</span>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 px-4 text-center">
            <FileTextIcon className="w-8 h-8 text-slate-200 mb-3" />
            <p className="text-xs text-slate-400">No documents yet. Upload one below.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {documents.map((doc) => {
              const statusCfg = STATUS_CONFIG[doc.processingStatus] ?? STATUS_CONFIG.pending
              const isActive = doc.id === selectedDocumentId
              const catBadge = getDocCategoryBadge(doc.originalName)
              return (
                <li key={doc.id}>
                  <button
                    className={cn(
                      'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50',
                      isActive && 'border-l-2 border-teal bg-teal/5 hover:bg-teal/5'
                    )}
                    onClick={() => onSelectDocument(doc.id)}
                  >
                    <div className="mt-0.5 shrink-0">
                      <DocIcon fileType={doc.fileType} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm font-medium truncate leading-snug',
                          isActive ? 'text-teal' : 'text-slate-700'
                        )}
                      >
                        {doc.originalName}
                      </p>
                      <div className="flex items-center flex-wrap gap-1.5 mt-1">
                        {catBadge && (
                          <span className={cn('text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider', catBadge.className)}>
                            {catBadge.label}
                          </span>
                        )}
                        {doc.pageCount != null && doc.pageCount > 0 && (
                          <span className="text-xs text-slate-400">
                            {doc.pageCount}p
                          </span>
                        )}
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium',
                            statusCfg.className
                          )}
                        >
                          {statusCfg.icon}
                          {doc.processingStatus === 'processing' && (
                            <LoaderIcon className="w-2.5 h-2.5 animate-spin" />
                          )}
                          {statusCfg.label}
                        </span>
                      </div>
                      {doc.processingStatus === 'complete' && (
                        <PageQualityBar docId={doc.id} processingStatus={doc.processingStatus} />
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Upload zone */}
      <div className="shrink-0 border-t border-slate-200 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          className={cn(
            'w-full flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed transition-colors py-4 px-3 text-center',
            dragging
              ? 'border-teal bg-teal/5'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100',
            uploading && 'opacity-60 pointer-events-none'
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <LoaderIcon className="w-5 h-5 text-teal animate-spin" />
          ) : (
            <UploadCloudIcon className="w-5 h-5 text-slate-400" />
          )}
          <p className="text-xs text-slate-500 font-medium">
            {uploading ? 'Uploading…' : 'Drop file or click to upload'}
          </p>
          <p className="text-xs text-slate-400">PDF, JPG, PNG</p>
        </button>
      </div>
    </div>
  )
}
