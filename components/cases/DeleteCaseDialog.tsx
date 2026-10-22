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

interface DeleteCaseDialogProps {
  caseId: number
  caseNumber: string
  caseTitle: string
  variant?: 'button' | 'icon'
  redirectAfterDelete?: boolean
  onDeleted?: () => void
  className?: string
}

export function DeleteCaseDialog({
  caseId,
  caseNumber,
  caseTitle,
  variant = 'button',
  redirectAfterDelete = false,
  onDeleted,
  className,
}: DeleteCaseDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDeleting(true)

    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error ?? 'Failed to delete case.')
      }

      toast.success(`Case "${caseNumber}" deleted successfully.`)
      setOpen(false)

      if (onDeleted) {
        onDeleted()
      }

      if (redirectAfterDelete) {
        router.push('/cases')
      } else {
        router.refresh()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete case.')
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
          title={`Delete case ${caseNumber}`}
          className={cn(
            'inline-flex items-center justify-center p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors',
            className
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="sr-only">Delete Case</span>
        </button>
      ) : (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className={cn(
            'h-auto gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm transition-all hover:bg-red-100 hover:text-red-700 hover:border-red-200',
            className
          )}
        >
          <Trash2 className="h-4 w-4" />
          Delete case
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        {open && (
          <DialogContent className="sm:max-w-md p-6">
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <DialogHeader className="p-0">
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Delete Case
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-1">
                  Are you sure you want to permanently delete this case?
                </DialogDescription>
              </DialogHeader>

              <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left">
                <span className="font-mono text-xs font-semibold text-teal tracking-tight block">
                  {caseNumber}
                </span>
                <p className="text-sm font-medium text-slate-800 line-clamp-2 mt-0.5">
                  {caseTitle}
                </p>
              </div>

              <p className="text-xs text-rose-600 font-medium leading-relaxed">
                This will permanently delete all associated uploaded documents, extracted OCR text, AI synopsis, discrepancy findings, hearings, and judicial orders. This action cannot be undone.
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
                    Delete Case
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
