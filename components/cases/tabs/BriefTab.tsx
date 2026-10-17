'use client'

import { useState, useEffect } from 'react'
import { CopyIcon, CheckIcon, FileTextIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

interface BriefTabProps {
  caseId: number
}

export function BriefTab({ caseId }: BriefTabProps) {
  const [brief, setBrief] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/cases/${caseId}/brief`)
      .then((r) => r.json())
      .then((data) => {
        setBrief(data.brief ?? null)
      })
      .catch(() => {
        toast.error('Failed to load brief.')
      })
      .finally(() => setLoading(false))
  }, [caseId])

  async function handleCopy() {
    if (!brief) return
    try {
      await navigator.clipboard.writeText(brief)
      setCopied(true)
      toast.success('Brief copied to clipboard.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileTextIcon className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Case Brief</h3>
        </div>
        {!loading && brief && (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal transition-colors border border-slate-200 hover:border-teal/40 px-2.5 py-1.5 rounded-md"
          >
            {copied ? (
              <>
                <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                Copied!
              </>
            ) : (
              <>
                <CopyIcon className="w-3.5 h-3.5" />
                Copy to clipboard
              </>
            )}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-sm text-slate-400 animate-pulse">Generating brief…</div>
        </div>
      ) : brief ? (
        <>
          <ScrollArea className="h-[calc(100vh-22rem)] min-h-64 rounded-lg border border-slate-200 bg-slate-50">
            <pre className="p-5 text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap break-words">
              {brief}
            </pre>
          </ScrollArea>
          <p className="text-xs text-slate-400 italic px-1">
            This summary reflects records entered for this case. Verify it against original documents; it is not legal advice.
          </p>
        </>
      ) : (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-slate-400">Unable to generate brief.</p>
        </div>
      )}
    </div>
  )
}
