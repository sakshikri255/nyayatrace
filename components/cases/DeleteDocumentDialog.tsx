'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface DeleteDocumentDialogProps {
  documentId: number
  documentName: string
  onDeleted?: () => void
  variant?: 'icon' | 'button'
  className?: string
}

export function DeleteDocumentDialog({
  documentId,
  documentName,
  onDeleted,
  variant = 'icon',
  className,
}: DeleteDocumentDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDeleting(true)

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error ?? 'Failed to delete document.')
      }

      toast.success(`Document "${documentName}" deleted successfully.`)
      setOpen(false)

      if (onDeleted) {
        onDeleted()
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete document.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(true)
          }}
          title={`Delete ${documentName}`}
          className={cn(
            'inline-flex items-center justify-center p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors',
            className
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="sr-only">Delete Document</span>
        </button>
      ) : (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className={cn(
            'border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 gap-1.5 text-xs h-8 font-medium shadow-sm transition-all',
            className
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <DialogHeader className="p-0">
              <DialogTitle className="text-lg font-bold text-slate-900">
                Delete Document
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-1">
                Are you sure you want to delete this document?
              </DialogDescription>
            </DialogHeader>

            <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left">
              <span className="text-xs text-slate-400 block font-medium">Selected file:</span>
              <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                {documentName}
              </p>
            </div>

            <p className="text-xs text-rose-600 font-medium leading-relaxed">
              This will permanently delete the uploaded file from disk, its extracted OCR text, page records, and any annotations linked to this document.
            </p>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white border-0 gap-1.5"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
