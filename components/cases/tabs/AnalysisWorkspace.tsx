'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, CircleAlert, FileText, LoaderCircle, Printer, RefreshCw, Save, GitCompare } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { CitationHoverCard } from '@/components/shared/CitationHoverCard'
import { cn } from '@/lib/utils'
import type { CaseDetail } from '@/lib/queries/cases'
import type { FindingWithSources } from '@/lib/queries/findings'
import type { DocumentRow } from '@/lib/queries/documents'
import type { CaseSynopsis, EvidenceReference } from '@/lib/analysis/synopsis'

interface AnalysisRun {
  id: number
  version: number
  status: 'running' | 'complete' | 'failed'
  engine: string
  error: string | null
  reviewNotes: string
  createdAt: string | null
  synopsis: CaseSynopsis | null
  findings: FindingWithSources[]
}

interface AnalysisWorkspaceProps {
  caseData: CaseDetail
  documents: DocumentRow[]
  onUploadDocuments: () => void
}

function sourceHref(source: Pick<EvidenceReference, 'documentId' | 'pageNumber'>) {
  return `/api/documents/${source.documentId}/file#page=${source.pageNumber}`
}

function SourceLink({
  source,
  onOpen,
}: {
  source: EvidenceReference
  onOpen: (source: EvidenceReference) => void
}) {
  return (
    <CitationHoverCard
      documentId={source.documentId}
      documentName={source.documentName}
      pageNumber={source.pageNumber}
      passage={source.passage}
      onOpen={() => onOpen(source)}
    >
      <FileText className="h-3.5 w-3.5" />
      {source.documentName}, p. {source.pageNumber}
    </CitationHoverCard>
  )
}

function EvidenceList({
  items,
  emptyText,
  onOpen,
}: {
  items: EvidenceReference[]
  emptyText: string
  onOpen: (source: EvidenceReference) => void
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyText}</p>
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item, index) => (
        <article key={`${item.documentId}-${item.pageNumber}-${index}`} className="py-3 first:pt-0 last:pb-0">
          <p className="text-sm leading-6 text-slate-700">“{item.passage}”</p>
          <div className="mt-2"><SourceLink source={item} onOpen={onOpen} /></div>
        </article>
      ))}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-200 py-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  )
}

export function AnalysisWorkspace({ caseData, documents, onUploadDocuments }: AnalysisWorkspaceProps) {
  const [runs, setRuns] = useState<AnalysisRun[]>([])
  const [current, setCurrent] = useState(false)
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [aiProviders, setAiProviders] = useState({ gemini: false, openai: false })
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>('gemini')
  const [useAi, setUseAi] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [selectedSource, setSelectedSource] = useState<(EvidenceReference & { relatedFinding?: string }) | null>(null)
  const documentStateKey = documents
    .map((document) => `${document.id}:${document.processingStatus}:${document.processedAt ?? ''}`)
    .join('|')

  useEffect(() => {
    let active = true
    fetch(`/api/cases/${caseData.id}/analysis`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load saved analyses.')
        return response.json()
      })
      .then((data) => {
        if (!active) return
        setRuns(data.runs ?? [])
        setCurrent(Boolean(data.current))
        const providers = data.aiProviders ?? { gemini: false, openai: false }
        setAiProviders(providers)
        setAiProvider(providers.gemini ? 'gemini' : 'openai')
        setSelectedRunId(data.latestRunId ?? null)
        const latestRun = (data.runs ?? []).find((run: AnalysisRun) => run.id === data.latestRunId)
        setNotesDraft(latestRun?.reviewNotes ?? '')
      })
      .catch((error) => toast.error(error.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [caseData.id, documentStateKey])

  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? null
  const synopsis = selectedRun?.synopsis ?? null
  const selectedDocument = selectedSource
    ? documents.find((document) => document.id === selectedSource.documentId)
    : null
  const hasReadableDocuments = documents.some((document) => document.processingStatus === 'complete')

  function openSource(source: EvidenceReference, relatedFinding?: string) {
    setSelectedSource({ ...source, relatedFinding })
  }

  async function analyseDocuments() {
    setAnalysing(true)
    try {
      const response = await fetch(`/api/cases/${caseData.id}/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useAi, aiProvider }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Analysis could not be started.')
      const savedRun: AnalysisRun = data
      setRuns((previous) => [savedRun, ...previous.filter((run) => run.id !== savedRun.id)])
      setSelectedRunId(savedRun.id)
      setCurrent(savedRun.status === 'complete')
      setNotesDraft(savedRun.reviewNotes ?? '')
      setIsDirty(false)
      if (savedRun.status === 'failed') toast.error(savedRun.error ?? 'No readable text was found.')
      else toast.success(`Analysis version ${savedRun.version} saved.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Analysis failed.')
    } finally {
      setAnalysing(false)
    }
  }

  async function saveNotes() {
    if (!selectedRun || !isDirty) return
    setSavingNotes(true)
    try {
      const response = await fetch(`/api/cases/${caseData.id}/analysis/${selectedRun.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes: notesDraft }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Review notes could not be saved.')
      setRuns((previous) => previous.map((run) => run.id === data.id ? { ...run, reviewNotes: data.reviewNotes } : run))
      setIsDirty(false)
      toast.success('Review notes saved.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Review notes could not be saved.')
    } finally {
      setSavingNotes(false)
    }
  }

  async function reviewFinding(findingId: number, reviewStatus: 'verified' | 'needs_review' | 'not_a_discrepancy') {
    try {
      const response = await fetch(`/api/findings/${findingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewStatus, note: 'Reviewed in case synopsis.' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Finding could not be updated.')
      setRuns((previous) => previous.map((run) => run.id === selectedRunId
        ? { ...run, findings: run.findings.map((finding) => finding.id === findingId ? data : finding) }
        : run
      ))
      toast.success('Finding review saved.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Finding could not be updated.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
        Upload only public records or records you are authorized to use. This local application has no login or access control; do not upload confidential or restricted case files.
      </div>

      <div className="analysis-controls flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Case synopsis</h2>
          <p className="mt-1 text-xs text-slate-500">Local document extraction. No AI-generated facts or legal conclusions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()} disabled={!synopsis} className="gap-2">
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
          <Button
            onClick={analyseDocuments}
            disabled={analysing || !hasReadableDocuments}
            className="gap-2 bg-teal text-white hover:bg-teal-light"
          >
            {analysing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {analysing ? 'Extracting and saving…' : useAi ? `Analyse with ${aiProvider === 'gemini' ? 'Gemini' : 'OpenAI'}` : selectedRun ? 'Analyse again locally' : 'Analyse locally'}
          </Button>
        </div>
      </div>

      <div className="analysis-controls rounded-md border border-slate-200 bg-white px-4 py-3">
        {aiProviders.gemini || aiProviders.openai ? (
          <div className="flex flex-wrap items-start gap-x-4 gap-y-2 text-xs leading-5 text-slate-600">
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={useAi} onChange={(event) => setUseAi(event.target.checked)} className="mt-1 accent-teal" />
              <span><strong className="text-slate-800">Add a source-grounded AI summary.</strong> Extracted document text will be sent to the selected provider. Use this only for records authorized for that provider. Local extraction comparisons remain separate.</span>
            </label>
            <label className="flex items-center gap-2 whitespace-nowrap">
              Provider
              <select value={aiProvider} onChange={(event) => setAiProvider(event.target.value as 'gemini' | 'openai')} className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700">
                {aiProviders.gemini && <option value="gemini">Gemini</option>}
                {aiProviders.openai && <option value="openai">OpenAI</option>}
              </select>
            </label>
          </div>
        ) : (
          <p className="text-xs leading-5 text-slate-600"><strong className="text-slate-800">AI provider not configured.</strong> Local extraction analysis is available. To enable Gemini, set <code>GEMINI_API_KEY</code> on the server (or set <code>OPENAI_API_KEY</code> to use OpenAI), then restart NyayaTrace. Provider keys are never sent to the browser.</p>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">Upload documents to begin</h3>
          <p className="mt-1 text-sm text-slate-500">The synopsis will be built only from text extracted from this case’s files.</p>
          <Button variant="outline" onClick={onUploadDocuments} className="mt-4">Open documents</Button>
        </div>
      ) : loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading saved analysis…</p>
      ) : selectedRun?.status === 'running' ? (
        <div className="flex items-center gap-3 rounded-lg border border-teal-200 bg-teal-50 px-5 py-4 text-sm text-teal-900" role="status">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Analysis is running and will be saved when extraction comparisons finish.
        </div>
      ) : !hasReadableDocuments && !selectedRun ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          No document has readable extracted text yet. Check processing status or upload a text-based PDF / clearer image scan.
        </div>
      ) : !selectedRun ? (
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
          Documents are ready. Analyse them to save a source-linked synopsis for this case.
        </div>
      ) : selectedRun.status === 'failed' ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          <div className="flex items-start gap-2"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><p>{selectedRun.error ?? 'Analysis failed.'}</p></div>
          <p className="mt-2 text-xs">The failed run is saved in the version history. No synopsis was fabricated.</p>
        </div>
      ) : synopsis ? (
        <div className="analysis-print rounded-md border border-slate-200 bg-white px-5 py-2 shadow-sm print-content">
          <div className="analysis-controls flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 py-4">
            <div className="flex items-center gap-2 text-xs">
              <span className={`rounded-full px-2.5 py-1 font-semibold ${current && selectedRun.id === runs[0]?.id ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                {selectedRun.id !== runs[0]?.id || !current ? 'Outdated' : 'Current'}
              </span>
              <span className="text-slate-500">Version {selectedRun.version} · {selectedRun.createdAt ? new Date(selectedRun.createdAt).toLocaleString() : 'Date unavailable'}</span>
            </div>
            <div className="flex items-center gap-2">
              {runs.length > 1 && (
                <>
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    Saved versions
                    <select
                      value={selectedRun.id}
                      onChange={(event) => {
                        const next = runs.find((run) => run.id === Number(event.target.value))
                        setSelectedRunId(next?.id ?? null)
                        setNotesDraft(next?.reviewNotes ?? '')
                        setIsDirty(false)
                      }}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700"
                    >
                      {runs.map((run) => <option key={run.id} value={run.id}>Version {run.version} · {run.status}</option>)}
                    </select>
                  </label>
                  <Button
                    size="sm"
                    variant={showDiff ? 'default' : 'outline'}
                    onClick={() => setShowDiff((prev) => !prev)}
                    className={cn('h-7 text-xs gap-1 border-slate-300', showDiff && 'bg-teal text-white')}
                    title="Compare this run with previous run"
                  >
                    <GitCompare className="h-3 w-3" />
                    {showDiff ? 'Close Diff' : 'Compare Runs'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* ── Version Diff Inspector ────────────────────────────── */}
          {showDiff && runs.length > 1 && (() => {
            const previousRun = runs.find((r) => r.version === selectedRun.version - 1) || runs[runs.indexOf(selectedRun) + 1]
            if (!previousRun) return null

            const newFindings = selectedRun.findings.filter(
              (f) => !previousRun.findings.some((pf) => pf.findingType === f.findingType && pf.extractedValue === f.extractedValue)
            )
            const resolvedFindings = previousRun.findings.filter(
              (pf) => !selectedRun.findings.some((f) => f.findingType === pf.findingType && f.extractedValue === pf.extractedValue)
            )

            return (
              <div className="my-4 rounded-xl border border-teal-300 bg-gradient-to-r from-teal-50/70 to-slate-50 p-4 text-xs">
                <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
                  <div className="flex items-center gap-2 font-bold text-teal-900">
                    <GitCompare className="h-4 w-4 text-teal" />
                    <span>Run Diff: Version {selectedRun.version} vs Version {previousRun.version}</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    {selectedRun.findings.length} findings vs {previousRun.findings.length} findings
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* New findings */}
                  <div className="rounded-lg bg-white p-3 border border-emerald-200">
                    <span className="text-[11px] font-bold uppercase text-emerald-800 block mb-1.5">
                      + New Observations in Version {selectedRun.version} ({newFindings.length})
                    </span>
                    {newFindings.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No new findings detected in this run.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {newFindings.map((nf, i) => (
                          <li key={i} className="text-slate-700 bg-emerald-50/50 p-1.5 rounded text-[11px] border border-emerald-100">
                            <strong>[{nf.findingType}]</strong> {nf.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Resolved findings */}
                  <div className="rounded-lg bg-white p-3 border border-slate-200">
                    <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                      Resolved / Omitted Since Version {previousRun.version} ({resolvedFindings.length})
                    </span>
                    {resolvedFindings.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No discrepancies removed.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {resolvedFindings.map((rf, i) => (
                          <li key={i} className="text-slate-400 line-through bg-slate-50 p-1.5 rounded text-[11px]">
                            [{rf.findingType}] {rf.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {previousRun.reviewNotes !== selectedRun.reviewNotes && (
                  <div className="mt-3 p-2.5 rounded bg-white border border-slate-200 text-[11px]">
                    <strong className="text-slate-700 block mb-1">Notes Revision:</strong>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Version {previousRun.version} Notes:</span>
                        <p className="italic">{previousRun.reviewNotes || 'Empty'}</p>
                      </div>
                      <div>
                        <span className="text-teal-700 block text-[10px] font-semibold">Version {selectedRun.version} Notes:</span>
                        <p>{selectedRun.reviewNotes || 'Empty'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          <header className="py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">NyayaTrace · Local extraction analysis</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{synopsis.caseOverview.title}</h2>
            <p className="mt-1 text-sm text-slate-500">Reference: {synopsis.caseOverview.reference}</p>
          </header>

          <Section title="Analysis Summary">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
              {[
                { label: 'Documents processed', value: documents.filter((document) => document.processingStatus === 'complete').length },
                { label: 'Pages extracted', value: synopsis.sourceIndex.filter((source) => source.readable).length },
                { label: 'Timeline dates', value: synopsis.chronology.length },
                { label: 'Potential differences', value: synopsis.potentialInconsistencies.length },
                { label: 'Needs review', value: selectedRun.findings.filter((finding) => finding.reviewStatus === 'needs_review').length },
                { label: 'Verified', value: selectedRun.findings.filter((finding) => finding.reviewStatus === 'verified').length },
              ].map((metric) => (
                <div key={metric.label} className="rounded border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-xl font-semibold text-slate-900">{metric.value}</p>
                  <p className="mt-1 text-xs leading-4 text-slate-500">{metric.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Counts are calculated from this saved analysis and its current case documents.</p>
          </Section>

          <Section title="1. Case Overview">
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-slate-500">Case type</dt><dd className="mt-1 text-slate-800">{synopsis.caseOverview.caseType === 'unspecified' ? 'Not entered' : synopsis.caseOverview.caseType}</dd></div>
              <div><dt className="text-xs text-slate-500">Procedural status</dt><dd className="mt-1 text-slate-800">{synopsis.caseOverview.status === 'unspecified' ? 'Not entered' : synopsis.caseOverview.status}</dd></div>
              <div><dt className="text-xs text-slate-500">Court</dt><dd className="mt-1 text-slate-800">{synopsis.caseOverview.court || 'Not entered'}</dd></div>
              <div><dt className="text-xs text-slate-500">Jurisdiction</dt><dd className="mt-1 text-slate-800">{synopsis.caseOverview.jurisdiction || 'Not entered'}</dd></div>
            </dl>
            {synopsis.caseOverview.userNotes && <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{synopsis.caseOverview.userNotes}</p>}
            <p className="mt-3 text-xs text-slate-500">Case metadata above was entered by the user; it was not inferred from documents.</p>
          </Section>

          <Section title="2. Executive Synopsis">
            <p className="text-sm leading-6 text-slate-700">{synopsis.executiveSynopsis}</p>
            {synopsis.aiAnalysis && (
              <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-4">
                <p className="text-xs font-semibold uppercase text-teal-800">AI-generated summary · {synopsis.aiAnalysis.provider} · {synopsis.aiAnalysis.model}</p>
                <p className="mt-2 text-sm leading-6 text-slate-800">{synopsis.aiAnalysis.executiveSummary}</p>
                <p className="mt-3 text-xs font-medium text-teal-900">Source passages validated against extracted page text:</p>
                <div className="mt-2 space-y-2">
                  {synopsis.aiAnalysis.executiveSources.map((source, index) => (
                    <div key={`${source.documentId}-${source.pageNumber}-${index}`}>
                      <p className="text-xs italic text-slate-700">“{source.quote}”</p>
                      <SourceLink source={{ ...source, passage: source.quote }} onOpen={openSource} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-3 rounded border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
              This is a summary of extracted document text. Allegations and statements are reported content, not independently established findings.
            </p>
          </Section>

          <Section title="3. Facts and Important Statements">
            <EvidenceList items={synopsis.facts} emptyText="Not found in the uploaded documents." onOpen={openSource} />
          </Section>

          <Section title="4. Chronology of Events">
            {synopsis.chronology.length === 0 ? <p className="text-sm text-slate-500">No dates were found in the uploaded text.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-left text-sm">
                  <thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th className="py-2 pr-4">Date as written</th><th className="py-2 pr-4">Extracted event</th><th className="py-2 pr-4">Source</th><th className="py-2">Date handling</th></tr></thead>
                  <tbody>{synopsis.chronology.map((event, index) => <tr key={`${event.documentId}-${event.pageNumber}-${index}`} className="border-b border-slate-100 align-top"><td className="py-3 pr-4 font-medium text-slate-800">{event.date}</td><td className="py-3 pr-4 text-slate-600">{event.passage}</td><td className="py-3 pr-4"><SourceLink source={event} onOpen={openSource} /></td><td className="py-3 text-xs text-slate-500">{event.dateNote}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="5. Document Register">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th className="py-2 pr-3">Document</th><th className="py-2 pr-3">Apparent type</th><th className="py-2 pr-3">Pages</th><th className="py-2 pr-3">Extraction</th><th className="py-2 pr-3">Analysis</th><th className="py-2">Last processed</th></tr></thead>
                <tbody>{documents.map((document) => {
                  const summary = synopsis.documentSummaries.find((item) => item.documentId === document.id)
                  const aiDocumentSummary = synopsis.aiAnalysis?.documentSummaries.find((item) => item.documentId === document.id)
                  const included = Boolean(summary)
                  const analysisStatus = !selectedRun ? 'Not analyzed' : !included ? 'Not included' : current ? 'Current' : 'Outdated'
                  return (
                    <tr key={document.id} className="border-b border-slate-100 align-top">
                      <td className="py-3 pr-3"><button type="button" onClick={() => openSource(summary?.summary ?? { documentId: document.id, documentName: document.originalName, pageNumber: 1, passage: 'No extracted passage is available for this document.' })} className="text-left font-medium text-teal-700 underline underline-offset-2">{document.originalName}</button>{summary?.summary && <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Extractive preview: {summary.summary.passage}</p>}{aiDocumentSummary && <><p className="mt-2 text-xs font-medium text-teal-800">AI summary: {aiDocumentSummary.summary}</p><div className="mt-1 flex flex-wrap gap-x-3">{aiDocumentSummary.sources.map((source, index) => <SourceLink key={`${source.documentId}-${source.pageNumber}-${index}`} source={{ ...source, passage: source.quote }} onOpen={openSource} />)}</div></>}</td>
                      <td className="py-3 pr-3 text-slate-600">{summary?.apparentType ?? 'Could not be determined'}</td>
                      <td className="py-3 pr-3 text-slate-600">{document.pageCount ?? 0}</td>
                      <td className="py-3 pr-3"><span className={`rounded-full px-2 py-1 text-xs ${document.processingStatus === 'complete' ? 'bg-emerald-50 text-emerald-700' : document.processingStatus === 'failed' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}`}>{document.processingStatus}</span></td>
                      <td className="py-3 pr-3 text-xs text-slate-600">{analysisStatus}</td>
                      <td className="py-3 text-xs text-slate-500">{document.processedAt ? new Date(document.processedAt).toLocaleString() : 'Not processed'}</td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          </Section>

          <Section title="6. Important Statements and Evidence">
            <EvidenceList items={synopsis.importantStatements} emptyText="Not found in the uploaded documents." onOpen={openSource} />
          </Section>

          <Section title="7. Potential Inconsistencies">
            {synopsis.potentialInconsistencies.length === 0 ? <p className="text-sm text-slate-500">{documents.length === 1 ? 'Only one document is attached, so local cross-document comparison is not possible. Add related records or configure Gemini for a broader source-grounded analysis. ' : 'No explicitly labeled date, name, or location differences were detected. '}This does not verify that all records are consistent.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th className="py-2 pr-4">Field</th><th className="py-2 pr-4">Values found</th><th className="py-2 pr-4">Evidence</th><th className="py-2">Review</th></tr></thead>
                  <tbody>{synopsis.potentialInconsistencies.map((issue, index) => {
                    const finding = selectedRun.findings.find((item) => item.analysisRunId === selectedRun.id && item.extractedValue === issue.values[0]) ?? selectedRun.findings[index]
                    return <tr key={`${issue.field}-${index}`} className="border-b border-slate-100 align-top"><td className="py-3 pr-4 font-medium text-slate-800">{issue.field}<p className={`mt-1 text-[11px] font-normal ${issue.origin === 'ai' ? 'text-teal-700' : 'text-slate-500'}`}>{issue.origin === 'ai' ? 'AI suggested · requires human review' : 'Local labeled comparison'}</p>{issue.explanation && <p className="mt-2 max-w-xs text-xs font-normal leading-5 text-slate-600">{issue.explanation}</p>}</td><td className="py-3 pr-4 text-slate-700">{issue.values.join(' · ')}</td><td className="py-3 pr-4"><div className="flex flex-col gap-1">{issue.sources.map((source, sourceIndex) => <SourceLink key={`${source.documentId}-${source.pageNumber}-${sourceIndex}`} source={source} onOpen={(reference) => openSource(reference, finding?.description)} />)}</div></td><td className="py-3"><div className="flex flex-col gap-2"><span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700"><AlertTriangle className="h-3.5 w-3.5" />{finding?.reviewStatus === 'verified' ? 'Verified' : finding?.reviewStatus === 'not_a_discrepancy' ? 'Not a Discrepancy' : 'Needs Review'}</span>{finding && <div className="analysis-controls flex flex-wrap gap-1"><button onClick={() => reviewFinding(finding.id, 'verified')} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">Verify</button><button onClick={() => reviewFinding(finding.id, 'needs_review')} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">Needs review</button><button onClick={() => reviewFinding(finding.id, 'not_a_discrepancy')} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">Not a discrepancy</button></div>}</div></td></tr>
                  })}</tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="8. Missing or Unclear Information">
            {synopsis.missingOrUnclear.length === 0 ? <p className="text-sm text-slate-500">No unreadable pages were reported. Other missing details could not be determined from the uploaded text.</p> : <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{synopsis.missingOrUnclear.map((item) => <li key={item}>{item}</li>)}</ul>}
          </Section>

          <Section title="9. Orders and Procedural History">
            <EvidenceList items={synopsis.ordersAndProceduralHistory} emptyText="Not found in the uploaded documents." onOpen={openSource} />
          </Section>

          <Section title="10. Review Notes">
            <div className="analysis-controls space-y-2">
              <Textarea
                value={notesDraft}
                onChange={(event) => { setNotesDraft(event.target.value); setIsDirty(true) }}
                placeholder="Add your verification notes for this saved analysis."
                rows={4}
                maxLength={20000}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{isDirty ? 'Unsaved changes' : 'Saved with this analysis version'}</span>
                <Button size="sm" variant="outline" onClick={saveNotes} disabled={!isDirty || savingNotes} className="gap-2">
                  {savingNotes ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save notes
                </Button>
              </div>
            </div>
            {!isDirty && selectedRun.reviewNotes && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{selectedRun.reviewNotes}</p>}
          </Section>

          <Section title="11. Source Index">
            {synopsis.sourceIndex.length === 0 ? <p className="text-sm text-slate-500">No page references are available.</p> : (
              <ol className="grid gap-2 sm:grid-cols-2">{synopsis.sourceIndex.map((source, index) => <li key={`${source.documentId}-${source.pageNumber}-${index}`} className="flex items-center justify-between gap-3 rounded border border-slate-200 px-3 py-2"><SourceLink source={{ ...source, passage: '' }} onOpen={openSource} /><span className={`text-xs ${source.readable ? 'text-emerald-700' : 'text-rose-700'}`}>{source.readable ? <><Check className="mr-1 inline h-3.5 w-3.5" />Readable</> : 'Unclear'}</span></li>)}</ol>
            )}
          </Section>

          <p className="border-t border-slate-200 py-4 text-xs leading-5 text-slate-500">{synopsis.method} Extracted text is not independently verified and is not legal advice.</p>
        </div>
      ) : null}

      <Dialog open={selectedSource !== null} onOpenChange={(open) => { if (!open) setSelectedSource(null) }}>
        <DialogContent className="sm:max-w-5xl p-5">
          <DialogHeader>
            <DialogTitle>{selectedSource ? `${selectedSource.documentName} · Page ${selectedSource.pageNumber}` : 'Source document'}</DialogTitle>
          </DialogHeader>
          {selectedSource && (
            <div className="space-y-3">
              {selectedSource.relatedFinding && <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">Related finding: {selectedSource.relatedFinding}</p>}
              <blockquote className="border-l-2 border-teal-500 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">{selectedSource.passage || 'No extracted passage is available for this page.'}</blockquote>
              <div className="h-[55vh] min-h-64 overflow-hidden rounded border border-slate-200 bg-slate-100">
                {selectedDocument?.fileType === 'image' ? (
                  <img src={`/api/documents/${selectedSource.documentId}/file`} alt={`${selectedSource.documentName}, page ${selectedSource.pageNumber}`} className="mx-auto h-full max-h-full max-w-full object-contain" />
                ) : (
                  <iframe title={`${selectedSource.documentName}, page ${selectedSource.pageNumber}`} src={sourceHref(selectedSource)} className="h-full w-full" />
                )}
              </div>
              <p className="text-xs text-slate-500">Verify the extracted passage against the original page. OCR and PDF parsing may contain errors.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}