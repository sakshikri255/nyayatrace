'use client'

import { useState, useCallback } from 'react'
import { CopyIcon, SparklesIcon, CheckIcon, FileEditIcon, RefreshCw, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { BailBriefData } from '@/lib/queries/cases'
import type { BailDraftContent } from '@/app/api/cases/[id]/bail-draft/generate/route'

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

const SECTION_LABELS: Record<keyof BailDraftContent, string> = {
  title: 'Application Title',
  courtHeader: 'Court Header & Case Details',
  caseBackground: 'Case Background',
  statutoryGrounds: 'Statutory Grounds',
  discrepancyArguments: 'Discrepancy Arguments',
  chronology: 'Hearing Chronology',
  prayer: 'Prayer',
  signatoryBlock: 'Signatory Block',
}

function draftContentToText(content: BailDraftContent): string {
  return Object.values(content).join('\n\n')
}

export function DraftApplicationTab({ data }: DraftApplicationTabProps) {
  const [draftText, setDraftText] = useState(() => buildTemplate(data))
  const [structuredDraft, setStructuredDraft] = useState<BailDraftContent | null>(null)
  const [draftVersion, setDraftVersion] = useState<number | null>(null)
  const [draftEngine, setDraftEngine] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [viewMode, setViewMode] = useState<'text' | 'sections'>('text')

  const handleCopy = useCallback(async () => {
    const textToCopy = structuredDraft ? draftContentToText(structuredDraft) : draftText
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Draft copied to clipboard.')
    } catch {
      toast.error('Could not copy text.')
    }
  }, [draftText, structuredDraft])

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/cases/${data.case.id}/bail-draft/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json() as { content?: BailDraftContent; engine?: string; version?: number; error?: string }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Generation failed')
      setStructuredDraft(json.content!)
      setDraftVersion(json.version ?? null)
      setDraftEngine(json.engine ?? null)
      setViewMode('sections')
      toast.success(`Draft generated${json.engine && json.engine !== 'template' ? ` via ${json.engine}` : ' from template'}.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Draft generation failed')
    } finally {
      setGenerating(false)
    }
  }, [data.case.id])

  const handleEnhance = useCallback(async () => {
    setGenerating(true)
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
      setGenerating(false)
    }
  }, [draftText, data.case.id])

  function updateSection(key: keyof BailDraftContent, value: string) {
    if (!structuredDraft) return
    setStructuredDraft({ ...structuredDraft, [key]: value })
  }

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
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500">
            Case: <span className="font-medium text-slate-700">{data.case.caseNumber}</span>
          </p>
          {draftVersion && (
            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              v{draftVersion} · {draftEngine}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
              generating
                ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                : 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100'
            )}
          >
            <Wand2 className={cn('w-3.5 h-3.5', generating && 'animate-pulse')} />
            {generating ? 'Generating…' : 'Generate Draft'}
          </button>
          {!structuredDraft && (
            <button
              onClick={handleEnhance}
              disabled={generating}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                generating
                  ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                  : 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
              )}
            >
              <SparklesIcon className={cn('w-3.5 h-3.5', generating && 'animate-pulse')} />
              {generating ? 'Enhancing…' : 'Enhance with AI'}
            </button>
          )}
          {structuredDraft && (
            <div className="flex items-center rounded-md border border-slate-200 overflow-hidden">
              <button
                onClick={() => setViewMode('sections')}
                className={cn('px-2.5 py-1.5 text-xs font-medium transition-colors', viewMode === 'sections' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50')}
              >
                Sections
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={cn('px-2.5 py-1.5 text-xs font-medium transition-colors border-l border-slate-200', viewMode === 'text' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50')}
              >
                Full Text
              </button>
            </div>
          )}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>

      {/* Draft editor — sections view */}
      {structuredDraft && viewMode === 'sections' ? (
        <div className="flex flex-col gap-3">
          {(Object.keys(structuredDraft) as (keyof BailDraftContent)[]).map((key) => (
            <div key={key} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  {SECTION_LABELS[key]}
                </span>
              </div>
              <textarea
                value={structuredDraft[key]}
                onChange={(e) => updateSection(key, e.target.value)}
                className="w-full resize-y p-3 text-sm font-mono text-slate-800 bg-white border-0 focus:outline-none leading-relaxed min-h-[60px]"
                style={{ height: Math.max(60, (structuredDraft[key].split('\n').length + 1) * 20) }}
                spellCheck={false}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Full text editor */
        <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Draft Text</span>
            <span className="text-xs text-slate-400 ml-auto">You can edit this text directly</span>
            {structuredDraft && (
              <button
                type="button"
                onClick={() => {
                  setDraftText(draftContentToText(structuredDraft))
                  setStructuredDraft(null)
                  setViewMode('text')
                }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset to plain
              </button>
            )}
          </div>
          <textarea
            value={structuredDraft ? draftContentToText(structuredDraft) : draftText}
            onChange={(e) => {
              if (structuredDraft) return // read-only in section mode
              setDraftText(e.target.value)
            }}
            readOnly={!!structuredDraft}
            className="w-full min-h-[520px] resize-y p-4 text-sm font-mono text-slate-800 bg-slate-50 border-0 focus:outline-none leading-relaxed"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  )
}
