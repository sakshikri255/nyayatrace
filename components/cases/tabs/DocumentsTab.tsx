'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloudIcon, FileTextIcon, ImageIcon, FileIcon, RefreshCwIcon } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import type { DocumentRow } from '@/lib/queries/documents'
import { cn } from 'cn'

interface DocumentsTabProps {
  caseId: number
  initialDocuments: DocumentRow[]
}

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-slate-100 text-slate-600' },
  processing: { label: 'Processing', className: 'bg-amber-100 text-amber-700 animate-pulse' },
  complete: { label: 'Complete', className: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'Failed', className: 'bg-rose-100 text-rose-700' },
} as const

function FileTypeIcon({ type }: { type: string }) {
  if (type === 'pdf') return <FileTextIcon className="w-4 h-4 text-rose-500" />
  if (type === 'image') return <ImageIcon className="w-4 h-4 text-sky-500" />
  return <FileIcon className="w-4 h-4 text-slate-400" />
}

export function DocumentsTab({ caseId, initialDocuments }: DocumentsTabProps) {
  const router = useRouter()
  const [documents, setDocuments] = useState<DocumentRow[]>(initialDocuments)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ name: string; value: number }[]>([])

  useEffect(() => {
    setDocuments(initialDocuments)
  }, [initialDocuments])

  function updateProgress(name: string, value: number) {
    setUploadProgress((current) =>
      current.map((item) => item.name === name ? { ...item, value } : item)
    )
  }

  function sendFile(file: File): Promise<DocumentRow> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('caseId', String(caseId))
      const request = new XMLHttpRequest()
      request.open('POST', '/api/documents')
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          updateProgress(file.name, Math.round((event.loaded / event.total) * 100))
        }
      }
      request.onerror = () => reject(new Error('Network error during upload.'))
      request.onload = () => {
        const response = JSON.parse(request.responseText || '{}')
        if (request.status >= 200 && request.status < 300) resolve(response)
        else reject(new Error(response.error ?? 'Upload failed.'))
      }
      request.send(formData)
    })
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return
    setUploading(true)
    setUploadProgress(files.map((file) => ({ name: file.name, value: 0 })))

    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!['pdf', 'jpg', 'jpeg', 'png'].includes(extension ?? '')) {
        toast.error(`${file.name}: only PDF, JPEG, and PNG files are supported.`)
        continue
      }
      if (file.size === 0 || file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name}: files must be between 1 byte and 20 MB.`)
        continue
      }

      try {
        const document = await sendFile(file)
        setDocuments((current) => [...current, document])
        if (document.processingStatus === 'failed') {
          toast.warning(`${file.name} was saved, but text could not be extracted.`)
        } else {
          toast.success(`${file.name} uploaded and processed.`)
        }
      } catch (error) {
        toast.error(`${file.name}: ${error instanceof Error ? error.message : 'Upload failed.'}`)
      }
    }

    setUploading(false)
    setUploadProgress([])
    router.refresh()
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    await uploadFiles(Array.from(e.dataTransfer.files))
  }

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files) await uploadFiles(Array.from(files))
    e.target.value = ''
  }

  async function handleRefresh() {
    try {
      const data = await fetch(`/api/documents?caseId=${caseId}`).then((r) => r.json())
      setDocuments(data)
    } catch {
      toast.error('Failed to refresh documents.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
        Upload only public records or records you are authorized to process. This app has no login or access controls; do not upload confidential or restricted files.
      </p>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 transition-colors cursor-pointer',
          dragging
            ? 'border-teal bg-teal/5'
            : 'border-slate-300 bg-slate-50 hover:border-teal/60 hover:bg-teal/5',
          uploading && 'pointer-events-none opacity-60'
        )}
      >
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          onChange={handleFileInput}
          disabled={uploading}
        />
        <UploadCloudIcon className="w-8 h-8 text-slate-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600">
            {uploading ? 'Uploading…' : 'Drop a file here, or click to browse'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">PDF, JPEG, PNG · 20 MB maximum per file</p>
        </div>
      </div>

      {uploadProgress.length > 0 && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4" aria-live="polite">
          {uploadProgress.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex justify-between gap-3 text-xs text-slate-600">
                <span className="truncate">{item.name}</span>
                <span>{item.value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-teal transition-[width]" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Documents ({documents.length})
          </h3>
          <button
            onClick={handleRefresh}
            className="text-slate-400 hover:text-teal transition-colors"
            title="Refresh"
          >
            <RefreshCwIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {documents.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No documents yet. Upload one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-100">
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Name</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide w-20">Type</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide w-24">Size</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide w-16 text-center">Pages</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide w-28">Status</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide w-32">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const cfg = statusConfig[doc.processingStatus] ?? statusConfig.pending
                return (
                  <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <FileTypeIcon type={doc.fileType} />
                        <span className="font-medium text-slate-700 truncate max-w-xs">
                          {doc.originalName}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-xs text-slate-500 uppercase">{doc.fileType}</span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-500">
                      {doc.fileSize < 1024 * 1024
                        ? `${Math.max(1, Math.round(doc.fileSize / 1024))} KB`
                        : `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="text-xs text-slate-500">{doc.pageCount ?? '—'}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                      {doc.processingError && (
                        <p className="mt-1 max-w-xs text-xs text-rose-600">{doc.processingError}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-xs text-slate-400">
                        {doc.uploadDate
                          ? formatDistanceToNow(new Date(doc.uploadDate), { addSuffix: true })
                          : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
