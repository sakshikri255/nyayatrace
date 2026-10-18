'use client'

import { useState, useCallback } from 'react'
import { CopyIcon, SparklesIcon, CheckIcon, FileEditIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { BailBriefData } from '@/lib/queries/cases'

interface DraftApplicationTabProps {
  data: BailBriefData
}

function buildTemplate(data: BailBriefData): string {
  const c = data.case
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  const courtName = c.court ?? '[Court Name]'
  const caseNumber = c.caseNumber
  const caseTitle = c.title

  // Derive accused name from title if possible (e.g., "State v. Raju Sharma" → "Raju Sharma")
  const vMatch = caseTitle.match(/(?:vs?\.?\s+|v\/s\.?\s+)(.+)/i)
  const accusedName = vMatch ? vMatch[1].trim() : caseTitle

  const remandDate = c.remandDate ?? '[Date of First Remand]'
  const statutoryDays = c.statutoryPeriodDays ?? 60
  const chargesheetFiled = Boolean(c.chargesheetFiled)
  const section = (c as { applicableLaw?: string | null }).applicableLaw === 'crpc'
    ? 'Section 167(2) of the Code of Criminal Procedure, 1973'
    : 'Section 187 of the Bharatiya Nagarik Suraksha Sanhita, 2023'

  const lines: string[] = [
    `IN THE ${courtName.toUpperCase()}`,
    ``,
    `BAIL APPLICATION NO. _____ / ${new Date().getFullYear()}`,
    ``,
    `IN THE MATTER OF:`,
    ``,
    `${caseTitle}`,
    `Case No.: ${caseNumber}`,
    ``,
    `APPLICATION FOR BAIL UNDER ${section.toUpperCase()}`,
    ``,
    `MOST RESPECTFULLY SHOWETH:`,
    ``,
    `1. That the Applicant/Accused, ${accusedName}, is in judicial custody in the above-captioned matter.`,
    ``,
    `2. That the Applicant was first remanded to judicial custody on ${remandDate}.`,
    ``,
    `3. That as per ${section}, an accused person is entitled to be released on bail if the investigating agency fails to file a chargesheet within ${statutoryDays} days of first remand.`,
    ``,
    chargesheetFiled
      ? `4. That the police chargesheet/final report has been filed in this matter.`
      : `4. That to date, no chargesheet/final report has been filed by the investigating agency within the prescribed ${statutoryDays}-day period, thereby entitling the Applicant to default bail as a matter of indefeasible right.`,
    ``,
    `5. That the Applicant undertakes to abide by all terms and conditions that this Hon'ble Court may impose and shall not tamper with evidence or influence witnesses.`,
    ``,
    data.conditions.length > 0
      ? `6. That the Applicant is willing to comply with the following bail conditions already on record:\n   ${data.conditions.map((cond, i) => `${i + 1}. ${cond.conditionText}`).join('\n   ')}`
      : `6. That the Applicant is willing to comply with such bail conditions as this Hon'ble Court may deem fit to impose.`,
    ``,
    `PRAYER`,
    ``,
    `It is, therefore, most respectfully prayed that this Hon'ble Court may be pleased to:`,
    ``,
    `(a) Release the Applicant on bail on such terms and conditions as this Hon'ble Court deems fit;`,
    `(b) Pass such other and further orders as this Hon'ble Court may deem just and proper in the facts and circumstances of the case.`,
    ``,
    `AND FOR THIS ACT OF KINDNESS, THE APPLICANT SHALL FOREVER PRAY.`,
    ``,
    `Date: ${today}`,
    `Place: [Place]`,
    ``,
    `                                        Respectfully submitted,`,
    `                                        [Advocate Name]`,
    `                                        Enrollment No.: [Enrl. No.]`,
    `                                        Counsel for the Applicant`,
    ``,
    `────────────────────────────────────────────────────────────────────────`,
    `IMPORTANT NOTICE: This is a machine-generated draft for reference only.`,
    `Verify all facts, dates, and sections against original documents before filing.`,
  ]

  return lines.join('\n')
}

export function DraftApplicationTab({ data }: DraftApplicationTabProps) {
  const [draftText, setDraftText] = useState(() => buildTemplate(data))
  const [copied, setCopied] = useState(false)
  const [enhancing, setEnhancing] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(draftText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Draft copied to clipboard.')
    } catch {
      toast.error('Could not copy text.')
    }
  }, [draftText])

  const handleEnhance = useCallback(async () => {
    setEnhancing(true)
    try {
      const res = await fetch(`/api/cases/${data.case.id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: draftText }),
      })
      const json = await res.json() as { enhanced?: string; error?: string }
      if (!res.ok || json.error) throw new Error(json.error ?? 'AI enhancement failed')
      setDraftText(json.enhanced!)
      toast.success('Draft enhanced by AI.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI enhancement failed')
    } finally {
      setEnhancing(false)
    }
  }, [draftText, data.case.id])

  return (
    <div className="flex flex-col gap-4">
      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
        <FileEditIcon className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-blue-900">Working Draft</p>
          <p className="text-xs text-blue-800 mt-0.5">
            This is a machine-generated draft pre-filled from your case records. It is not legal advice.
            Verify all facts, dates, and statutory sections against original documents before use.
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-slate-500">
          Pre-filled from case: <span className="font-medium text-slate-700">{data.case.caseNumber}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnhance}
            disabled={enhancing}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
              enhancing
                ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                : 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
            )}
          >
            <SparklesIcon className={cn('w-3.5 h-3.5', enhancing && 'animate-pulse')} />
            {enhancing ? 'Enhancing…' : 'Enhance with AI'}
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>

      {/* Draft editor */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Draft Text</span>
          <span className="text-xs text-slate-400 ml-auto">You can edit this text directly</span>
        </div>
        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          className="w-full min-h-[520px] resize-y p-4 text-sm font-mono text-slate-800 bg-slate-50 border-0 focus:outline-none leading-relaxed"
          spellCheck={false}
        />
      </div>
    </div>
  )
}
