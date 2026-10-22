'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  AlertTriangle,
  Check,
  CircleAlert,
  FileText,
  LoaderCircle,
  Printer,
  RefreshCw,
  Save,
  GitCompare,
  Search,
  Calendar,
  Gavel,
  Layers,
  Sparkles,
  Clock,
  Building2,
  MapPin,
  CheckCircle2,
  X,
  Quote,
  ShieldAlert,
  FileCheck,
  FolderOpen,
  ExternalLink,
  Copy,
  User,
  Scale,
  Eye,
  FileSpreadsheet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { CitationHoverCard } from '@/components/shared/CitationHoverCard'
import { cn } from '@/lib/utils'
import type { CaseDetail } from '@/lib/queries/cases'
import type { FindingWithSources } from '@/lib/queries/findings'
import type { DocumentRow } from '@/lib/queries/documents'
import type { CaseSynopsis, EvidenceReference, KeyEntity } from '@/lib/analysis/synopsis'

// All 22 languages in the Eighth Schedule to the Constitution of India
const INDIAN_LANGUAGES = [
  { value: 'English',    label: 'English' },
  { value: 'Hindi',      label: 'हिंदी (Hindi)' },
  { value: 'Bengali',    label: 'বাংলা (Bengali)' },
  { value: 'Telugu',     label: 'తెలుగు (Telugu)' },
  { value: 'Marathi',    label: 'मराठी (Marathi)' },
  { value: 'Tamil',      label: 'தமிழ் (Tamil)' },
  { value: 'Gujarati',   label: 'ગુજરાતી (Gujarati)' },
  { value: 'Kannada',    label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'Malayalam',  label: 'മലയാളം (Malayalam)' },
  { value: 'Odia',       label: 'ଓଡ଼ିଆ (Odia)' },
  { value: 'Punjabi',    label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { value: 'Assamese',   label: 'অসমীয়া (Assamese)' },
  { value: 'Maithili',   label: 'मैथिली (Maithili)' },
  { value: 'Urdu',       label: 'اردو (Urdu)' },
  { value: 'Sanskrit',   label: 'संस्कृत (Sanskrit)' },
  { value: 'Kashmiri',   label: 'کٲشُر (Kashmiri)' },
  { value: 'Konkani',    label: 'कोंकणी (Konkani)' },
  { value: 'Sindhi',     label: 'سنڌي (Sindhi)' },
  { value: 'Nepali',     label: 'नेपाली (Nepali)' },
  { value: 'Manipuri',   label: 'মৈতৈলোন্ (Manipuri)' },
  { value: 'Dogri',      label: 'डोगरी (Dogri)' },
  { value: 'Bodo',       label: 'बड़ो (Bodo)' },
  { value: 'Santhali',   label: 'ᱥᱟᱱᱛᱟᱲᱤ (Santhali)' },
]

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
  onGoToChronology?: () => void
}

function sourceHref(source: Pick<EvidenceReference, 'documentId' | 'pageNumber'>) {
  return `/api/documents/${source.documentId}/file#page=${source.pageNumber}`
}

function SourceBadge({
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
      <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 border border-teal-200/70 hover:bg-teal-100 hover:border-teal-300 transition-colors">
        <FileText className="h-3 w-3 text-teal-600 shrink-0" />
        <span className="truncate max-w-[200px]">{source.documentName}</span>
        <span className="text-teal-600 font-semibold">· p. {source.pageNumber}</span>
      </span>
    </CitationHoverCard>
  )
}

type TabSection = 'all' | 'summary' | 'data' | 'conflicts' | 'evidence' | 'orders'

export function AnalysisWorkspace({
  caseData,
  documents,
  onUploadDocuments,
  onGoToChronology,
}: AnalysisWorkspaceProps) {
  const [runs, setRuns] = useState<AnalysisRun[]>([])
  const [current, setCurrent] = useState(false)
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [aiProviders, setAiProviders] = useState({ gemini: false, openai: false })
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>('gemini')
  const [useAi, setUseAi] = useState(false)
  const [language, setLanguage] = useState('English')
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [translating, setTranslating] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [selectedSource, setSelectedSource] = useState<(EvidenceReference & { relatedFinding?: string }) | null>(null)
  
  // Interactive features
  const [activeSection, setActiveSection] = useState<TabSection>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [entityCategoryFilter, setEntityCategoryFilter] = useState<'all' | 'charges' | 'person' | 'datetime' | 'location' | 'evidence' | 'custody'>('all')
  const [tableSearchQuery, setTableSearchQuery] = useState('')

  function copyToClipboard(text: string, label: string) {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
    }
    setCopiedKey(label)
    toast.success(`Copied "${text.length > 35 ? text.slice(0, 32) + '…' : text}" to clipboard`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  function copyAllKeyEntities(entities: KeyEntity[]) {
    if (!entities.length) return
    const text = entities
      .map((e) => `[${e.field}]: ${e.value} (Source: ${e.source.documentName}, p. ${e.source.pageNumber})`)
      .join('\n')
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
    }
    toast.success(`Copied all ${entities.length} key values to clipboard!`)
  }

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

  // t() returns the translated version of a field if available, else original
  function t(key: string, fallback: string): string {
    return translations[key] ?? fallback
  }

  // Reset translations when language changes back to English or synopsis changes
  function handleLanguageChange(lang: string) {
    setLanguage(lang)
    setTranslations({})
  }

  async function translateSynopsis() {
    if (!synopsis || language === 'English') return
    setTranslating(true)
    try {
      // Collect all text fields from sections 1-9
      const fields: Record<string, string> = {
        // Section 1 – Case Overview
        'overview.caseType': synopsis.caseOverview.caseType || '',
        'overview.status': synopsis.caseOverview.status || '',
        'overview.court': synopsis.caseOverview.court || '',
        'overview.jurisdiction': synopsis.caseOverview.jurisdiction || '',
        'overview.userNotes': synopsis.caseOverview.userNotes || '',
        // Section 3 – Executive Summary
        'executiveSynopsis': synopsis.executiveSynopsis || '',
        'aiAnalysis.executiveSummary': synopsis.aiAnalysis?.executiveSummary || '',
        // Section 4 – Timeline previews (first 3)
        ...Object.fromEntries(
          synopsis.chronology.slice(0, 6).map((ev, i) => [`chronology.${i}`, ev.passage || ''])
        ),
        // Section 5 – Conflicts
        ...Object.fromEntries(
          synopsis.potentialInconsistencies.flatMap((issue, i) => [
            [`conflict.${i}.explanation`, issue.explanation || ''],
            [`conflict.${i}.field`, issue.field || ''],
            ...issue.values.map((v, vi) => [`conflict.${i}.val.${vi}`, v]),
          ])
        ),
        // Section 6 – Document summaries & facts
        ...Object.fromEntries(
          synopsis.documentSummaries.flatMap((ds, i) => [
            [`docSummary.${i}.apparentType`, ds.apparentType || ''],
            [`docSummary.${i}.summary`, (ds.summary as { passage?: string })?.passage || ''],
          ])
        ),
        ...Object.fromEntries(
          (synopsis.aiAnalysis?.documentSummaries ?? []).map((ds, i) => [`aiDocSummary.${i}`, ds.summary || ''])
        ),
        ...Object.fromEntries(
          synopsis.facts.slice(0, 8).map((f, i) => [`fact.${i}`, f.passage || ''])
        ),
        // Section 7 – Court orders
        ...Object.fromEntries(
          synopsis.ordersAndProceduralHistory.map((o, i) => [`order.${i}`, o.passage || ''])
        ),
        // Section 8 – Missing/unclear
        ...Object.fromEntries(
          synopsis.missingOrUnclear.map((m, i) => [`missing.${i}`, m])
        ),
      }

      const response = await fetch(`/api/cases/${caseData.id}/analysis/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, fields }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Translation failed.')
      setTranslations(data.translated ?? {})
      toast.success(`Translated to ${language} successfully!`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Translation failed.')
    } finally {
      setTranslating(false)
    }
  }

  async function analyseDocuments() {
    setAnalysing(true)
    setTranslations({}) // reset translations on new analysis
    try {
      const response = await fetch(`/api/cases/${caseData.id}/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useAi, aiProvider, language }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Analysis could not be started.')
      const savedRun: AnalysisRun = data
      setRuns((previous) => [savedRun, ...previous.filter((run) => run.id !== savedRun.id)])
      setSelectedRunId(savedRun.id)
      setCurrent(savedRun.status === 'complete')
      setNotesDraft(savedRun.reviewNotes ?? '')
      setIsDirty(false)
      if (savedRun.status === 'failed') toast.error(savedRun.error ?? 'No readable text was found in documents.')
      else toast.success(`Analysis version ${savedRun.version} generated successfully!`)
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
      toast.success('Your notes have been saved.')
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
      toast.success(
        reviewStatus === 'verified'
          ? 'Marked as verified difference.'
          : reviewStatus === 'not_a_discrepancy'
          ? 'Dismissed as not a conflict.'
          : 'Flagged for further review.'
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Finding could not be updated.')
    }
  }

  // Extracted Key Values & Data Matrix (with fallback extraction)
  const keyEntities: KeyEntity[] = useMemo(() => {
    if (!synopsis) return []
    if (synopsis.keyEntities && synopsis.keyEntities.length > 0) {
      return synopsis.keyEntities
    }
    // Fallback extraction from facts in case older analysis snapshot did not have keyEntities
    const fallbackList: KeyEntity[] = []
    for (const fact of synopsis.facts) {
      const text = fact.passage || ''
      const firMatch = text.match(/\bFIR\s*(?:No\.?|Number)\s*[:\-]?\s*([0-9A-Z/_-]+)/i)
      if (firMatch && !fallbackList.some((k) => k.field === 'FIR / Crime Number')) {
        fallbackList.push({
          category: 'charges',
          field: 'FIR / Crime Number',
          value: firMatch[1].trim(),
          source: fact,
          contextSnippet: 'Official police crime registration number',
        })
      }
      const psMatch = text.match(/\bPolice\s*Station\s*[:\-]?\s*([A-Za-z\s]+?)(?:\||\n|;|\.|\s{2,})/i)
      if (psMatch && !fallbackList.some((k) => k.field === 'Police Station')) {
        fallbackList.push({
          category: 'location',
          field: 'Police Station',
          value: psMatch[1].trim(),
          source: fact,
          contextSnippet: 'Jurisdictional police station handling the investigation',
        })
      }
      const distMatch = text.match(/\bDistrict\s*[:\-]?\s*([A-Za-z\s]+?)(?:\||\n|;|\.|\s{2,})/i)
      if (distMatch && !fallbackList.some((k) => k.field === 'District / Jurisdiction')) {
        fallbackList.push({
          category: 'location',
          field: 'District / Jurisdiction',
          value: distMatch[1].trim(),
          source: fact,
          contextSnippet: 'Judicial district having territorial jurisdiction',
        })
      }
      const secMatch = text.match(/\bActs?\s*&\s*Sections?\s*[:\-]?\s*([^\n;]{3,130})/i) || text.match(/\b(?:Sections?|U\/s)\s*[:\-]?\s*([^\n;]{3,110})/i)
      if (secMatch && !fallbackList.some((k) => k.field === 'Applicable Penal Sections')) {
        fallbackList.push({
          category: 'charges',
          field: 'Applicable Penal Sections',
          value: secMatch[1].trim(),
          source: fact,
          contextSnippet: 'Substantive penal charges and corresponding criminal sections',
        })
      }
      const occMatch = text.match(/(?:Date\s*and\s*Time\s*of\s*Occurrence|Incident\s*Date\s*and\s*Time|Time\s*of\s*Incident)\s*[:\-]?\s*([^\n;]{4,80})/i)
      if (occMatch && !fallbackList.some((k) => k.field === 'Incident Date & Time')) {
        fallbackList.push({
          category: 'datetime',
          field: 'Incident Date & Time',
          value: occMatch[1].trim(),
          source: fact,
          contextSnippet: 'Alleged time and date when offense took place',
        })
      }
      const placeMatch = text.match(/(?:Place\s*of\s*Occurrence|Incident\s*Location|Location\s*of\s*Incident)\s*[:\-]?\s*([^\n;]{3,100})/i)
      if (placeMatch && !fallbackList.some((k) => k.field === 'Place of Incident')) {
        fallbackList.push({
          category: 'location',
          field: 'Place of Incident',
          value: placeMatch[1].trim(),
          source: fact,
          contextSnippet: 'Geographic location and distance from police station',
        })
      }
      const accMatch = text.match(/(?:Name\s*of\s*Accused|Accused(?:\s*Name)?)\s*[:\-]?\s*([^\n;|]{2,80})/i)
      if (accMatch && !fallbackList.some((k) => k.field === 'Accused Person')) {
        fallbackList.push({
          category: 'person',
          field: 'Accused Person',
          value: accMatch[1].trim(),
          source: fact,
          contextSnippet: 'Named individual facing prosecution',
        })
      }
      const vicMatch = text.match(/(?:Victim|Deceased)\s*[:\-]?\s*([A-Za-z\s]{2,40})(?:\s+collapsed|\s+died|\s+injured|\s+was|\.|\n|$)/i) ||
                       text.match(/\bvictim\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
      if (vicMatch && !fallbackList.some((k) => k.field === 'Victim / Deceased')) {
        fallbackList.push({
          category: 'person',
          field: 'Victim / Deceased',
          value: vicMatch[1].trim(),
          source: fact,
          contextSnippet: 'Aggrieved or deceased party cited in police record',
        })
      }
      const compMatch = text.match(/\bComplainant(?:\s*\/\s*Informant)?\s*[:\-]?\s*([^\n;]{2,60})/i)
      if (compMatch && !fallbackList.some((k) => k.field === 'Complainant / Informant')) {
        fallbackList.push({
          category: 'person',
          field: 'Complainant / Informant',
          value: compMatch[1].trim(),
          source: fact,
          contextSnippet: 'Officer or citizen who lodged the initial complaint',
        })
      }
      const arrMatch = text.match(/(?:Date\s*of\s*Arrest|Arrested\s*on)\s*[:\-]?\s*([^\n;|]{4,60})/i)
      if (arrMatch && !fallbackList.some((k) => k.field === 'Date & Time of Arrest')) {
        fallbackList.push({
          category: 'custody',
          field: 'Date & Time of Arrest',
          value: arrMatch[1].trim(),
          source: fact,
          contextSnippet: 'Official police detention timestamp',
        })
      }
      const remMatch = text.match(/(?:Remand\s*Period|Police\s*Custody|Judicial\s*Custody)\s*[:\-]?\s*([^\n;|]{3,60})/i)
      if (remMatch && !fallbackList.some((k) => k.field === 'Remand / Custody Orders')) {
        fallbackList.push({
          category: 'custody',
          field: 'Remand / Custody Orders',
          value: remMatch[1].trim(),
          source: fact,
          contextSnippet: 'Duration of police custody authorized by court',
        })
      }
    }
    return fallbackList
  }, [synopsis])

  const filteredKeyEntities = useMemo(() => {
    return keyEntities.filter((item) => {
      const matchesCategory = entityCategoryFilter === 'all' || item.category === entityCategoryFilter
      const query = tableSearchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        item.field.toLowerCase().includes(query) ||
        item.value.toLowerCase().includes(query) ||
        (item.contextSnippet && item.contextSnippet.toLowerCase().includes(query)) ||
        item.source.documentName.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [keyEntities, entityCategoryFilter, tableSearchQuery])


  const filteredFacts = useMemo(() => {
    if (!synopsis) return []
    if (!searchQuery.trim()) return synopsis.facts
    const query = searchQuery.toLowerCase()
    return synopsis.facts.filter((item) =>
      item.passage.toLowerCase().includes(query) ||
      item.documentName.toLowerCase().includes(query)
    )
  }, [synopsis, searchQuery])

  const filteredInconsistencies = useMemo(() => {
    if (!synopsis) return []
    if (!searchQuery.trim()) return synopsis.potentialInconsistencies
    const query = searchQuery.toLowerCase()
    return synopsis.potentialInconsistencies.filter((item) =>
      item.field.toLowerCase().includes(query) ||
      item.values.some((v) => v.toLowerCase().includes(query)) ||
      (item.explanation && item.explanation.toLowerCase().includes(query)) ||
      item.sources.some((s) => s.documentName.toLowerCase().includes(query) || s.passage.toLowerCase().includes(query))
    )
  }, [synopsis, searchQuery])

  const filteredDocuments = useMemo(() => {
    if (!documents) return []
    if (!searchQuery.trim()) return documents
    const query = searchQuery.toLowerCase()
    return documents.filter((doc) =>
      doc.originalName.toLowerCase().includes(query)
    )
  }, [documents, searchQuery])

  const filteredOrders = useMemo(() => {
    if (!synopsis) return []
    if (!searchQuery.trim()) return synopsis.ordersAndProceduralHistory
    const query = searchQuery.toLowerCase()
    return synopsis.ordersAndProceduralHistory.filter((item) =>
      item.passage.toLowerCase().includes(query) ||
      item.documentName.toLowerCase().includes(query)
    )
  }, [synopsis, searchQuery])

  return (
    <div className="space-y-6 pb-12">
      {/* ── Security & Privacy Notice (User-Friendly Tip) ───────────────── */}
      <div className="flex items-start gap-3 rounded-xl border border-teal-200/80 bg-teal-50/70 p-4 text-xs leading-relaxed text-teal-950 shadow-xs">
        <Sparkles className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
        <div className="flex-1">
          <span className="font-semibold text-teal-900">Secure Local Analysis: </span>
          All facts, dates, and comparisons are read directly from your uploaded case files. When AI is enabled, only text from authorized files is sent for summarization.
        </div>
      </div>

      {/* ── Main Toolbar: Header & Run Controls ───────────────────────── */}
      <div className="analysis-controls flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-lg bg-teal-100/70 p-1.5 text-teal-800">
              <Layers className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Case Analysis &amp; Synopsis</h2>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 max-w-xl">
            Everything extracted from your case documents—organized into verified facts, chronological timeline, document breakdown, and cross-file differences.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => window.print()}
            disabled={!synopsis}
            className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Printer className="h-4 w-4 text-slate-500" /> Print / Save PDF
          </Button>

          <Button
            onClick={analyseDocuments}
            disabled={analysing || !hasReadableDocuments}
            className="gap-2 bg-teal text-white hover:bg-teal-light shadow-xs transition-all"
          >
            {analysing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {analysing
              ? 'Analyzing files…'
              : useAi
              ? `Analyze with ${aiProvider === 'gemini' ? 'Gemini AI' : 'OpenAI'}`
              : selectedRun
              ? 'Re-analyze Documents'
              : 'Start Analysis'}
          </Button>
        </div>
      </div>

      {/* ── AI Provider Configuration (Clean & Friendly Toggle) ──────────── */}
      <div className="analysis-controls rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-xs">
        {aiProviders.gemini || aiProviders.openai ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={useAi}
                onChange={(event) => setUseAi(event.target.checked)}
                className="h-4 w-4 rounded accent-teal cursor-pointer"
              />
              <span className="text-slate-800 font-medium">
                Include AI summary with citation checking ({aiProvider === 'gemini' ? 'Gemini' : 'OpenAI'})
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-3 pl-6 sm:pl-0">
              {/* Language selector — always visible */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium whitespace-nowrap">Output language:</span>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-slate-700 text-xs focus:ring-2 focus:ring-teal/30 focus:border-teal max-w-[180px]"
                >
                  {INDIAN_LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>

              {/* Translate existing content button — shows when non-English + synopsis loaded */}
              {language !== 'English' && synopsis && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={translateSynopsis}
                  disabled={translating}
                  className="h-7 gap-1.5 text-xs border-teal-300 text-teal-800 bg-teal-50 hover:bg-teal-100 cursor-pointer"
                  title={`Translate displayed analysis into ${language}`}
                >
                  {translating
                    ? <><LoaderCircle className="h-3 w-3 animate-spin" /> Translating…</>
                    : <><Sparkles className="h-3 w-3" /> Translate to {language}</>
                  }
                </Button>
              )}

              {/* AI provider picker — only when AI is enabled */}
              {useAi && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Provider:</span>
                  <select
                    value={aiProvider}
                    onChange={(event) => setAiProvider(event.target.value as 'gemini' | 'openai')}
                    className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-slate-700 text-xs focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  >
                    {aiProviders.gemini && <option value="gemini">Google Gemini</option>}
                    {aiProviders.openai && <option value="openai">OpenAI</option>}
                  </select>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500">
            <Sparkles className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              Local text extraction is active. To enable AI summaries, provide <code>GEMINI_API_KEY</code> or <code>OPENAI_API_KEY</code> in your environment.
            </span>
          </div>
        )}
      </div>

      {/* ── Empty States & Loading ────────────────────────────────────── */}
      {documents.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <FolderOpen className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">No documents uploaded yet</h3>
          <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto">
            Upload FIRs, petitions, orders, or statements to generate a comprehensive source-linked synopsis.
          </p>
          <Button onClick={onUploadDocuments} className="mt-5 gap-2 bg-teal text-white hover:bg-teal-light">
            <FolderOpen className="h-4 w-4" /> Go to Documents
          </Button>
        </div>
      ) : loading ? (
        <div className="py-16 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
          <LoaderCircle className="h-6 w-6 animate-spin text-teal" />
          <p>Loading analysis and findings…</p>
        </div>
      ) : selectedRun?.status === 'running' ? (
        <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50/80 p-5 text-sm text-teal-900 shadow-xs" role="status">
          <LoaderCircle className="h-5 w-5 animate-spin text-teal shrink-0" />
          <div>
            <p className="font-semibold">Analysis is running…</p>
            <p className="text-xs text-teal-700 mt-0.5">Extracting timeline, detecting differences, and organizing records. Results will appear automatically.</p>
          </div>
        </div>
      ) : !hasReadableDocuments && !selectedRun ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-xs">
          <p className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            No readable text found in documents
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Please check the processing status in the Documents tab or upload clearer text-based PDFs or higher quality scans.
          </p>
        </div>
      ) : !selectedRun ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-xs">
          <FileCheck className="h-10 w-10 text-teal mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">Your documents are ready for analysis</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Click &ldquo;Start Analysis&rdquo; above to extract a chronological timeline, find differences between statements, and compile an easy-to-read synopsis.
          </p>
          <Button onClick={analyseDocuments} className="mt-4 gap-2 bg-teal text-white hover:bg-teal-light">
            <RefreshCw className="h-4 w-4" /> Start Analysis
          </Button>
        </div>
      ) : selectedRun.status === 'failed' ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 shadow-xs">
          <div className="flex items-start gap-2.5">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold">Analysis Could Not Complete</p>
              <p className="text-xs text-rose-700 mt-0.5">{selectedRun.error ?? 'Unknown error during document processing.'}</p>
            </div>
          </div>
          <Button onClick={analyseDocuments} variant="outline" size="sm" className="mt-4 border-rose-300 text-rose-800 hover:bg-rose-100">
            Try Again
          </Button>
        </div>
      ) : synopsis ? (
        /* ── Full Analysis Report Container ────────────────────────────── */
        <div className="analysis-print rounded-2xl border border-slate-200 bg-white p-6 shadow-xs print-content space-y-7">
          
          {/* ── Version Header & Diff Bar ───────────────────────────────── */}
          <div className="analysis-controls flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold',
                current && selectedRun.id === runs[0]?.id
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              )}>
                {selectedRun.id !== runs[0]?.id || !current ? 'Previous Version' : 'Latest Version'}
              </span>
              <span className="text-xs text-slate-500">
                Version {selectedRun.version} · {selectedRun.createdAt ? new Date(selectedRun.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Date unavailable'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {runs.length > 1 && (
                <>
                  <label className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    Switch Version:
                    <select
                      value={selectedRun.id}
                      onChange={(event) => {
                        const next = runs.find((run) => run.id === Number(event.target.value))
                        setSelectedRunId(next?.id ?? null)
                        setNotesDraft(next?.reviewNotes ?? '')
                        setIsDirty(false)
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-slate-700 text-xs"
                    >
                      {runs.map((run) => (
                        <option key={run.id} value={run.id}>
                          Version {run.version} ({run.status})
                        </option>
                      ))}
                    </select>
                  </label>

                  <Button
                    size="sm"
                    variant={showDiff ? 'default' : 'outline'}
                    onClick={() => setShowDiff((prev) => !prev)}
                    className={cn('h-8 text-xs gap-1.5 border-slate-300', showDiff && 'bg-teal text-white')}
                  >
                    <GitCompare className="h-3.5 w-3.5" />
                    {showDiff ? 'Hide Version Diff' : 'Compare Versions'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* ── Version Diff Inspector (if open) ───────────────────────── */}
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
              <div className="rounded-xl border border-teal-300 bg-gradient-to-r from-teal-50/70 to-slate-50 p-4 text-xs">
                <div className="flex items-center justify-between border-b border-teal-200/60 pb-2.5">
                  <div className="flex items-center gap-2 font-bold text-teal-950">
                    <GitCompare className="h-4 w-4 text-teal" />
                    <span>Comparing Version {selectedRun.version} with Version {previousRun.version}</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    {selectedRun.findings.length} findings vs {previousRun.findings.length} findings
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white p-3 border border-emerald-200">
                    <span className="text-[11px] font-bold uppercase text-emerald-800 block mb-1.5">
                      + New Observations in Version {selectedRun.version} ({newFindings.length})
                    </span>
                    {newFindings.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No new findings detected in this run.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {newFindings.map((nf, i) => (
                          <li key={i} className="text-slate-700 bg-emerald-50/50 p-2 rounded text-[11px] border border-emerald-100">
                            <strong>[{nf.findingType}]</strong> {nf.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-lg bg-white p-3 border border-slate-200">
                    <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                      Resolved / Omitted Since Version {previousRun.version} ({resolvedFindings.length})
                    </span>
                    {resolvedFindings.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No differences removed.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {resolvedFindings.map((rf, i) => (
                          <li key={i} className="text-slate-400 line-through bg-slate-50 p-2 rounded text-[11px]">
                            [{rf.findingType}] {rf.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* ── Case Header ───────────────────────────────────────────── */}
          <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                NyayaTrace · Case Record Analysis
              </span>
              <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-medium text-slate-200">
                {caseData.caseNumber || synopsis.caseOverview.reference || 'Case #1'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
              {caseData.title || synopsis.caseOverview.title}
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Generated from {documents.length} uploaded files · {synopsis.sourceIndex.filter((s) => s.readable).length} readable pages
            </p>
          </div>

          {/* ── High-Impact Metric Cards (At a Glance) ─────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 transition-all hover:bg-slate-100/70">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <FileText className="h-4 w-4 text-slate-600" />
                <span className="text-[10px] uppercase font-bold text-slate-500">Files</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{documents.filter((d) => d.processingStatus === 'complete').length}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Processed</p>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 transition-all hover:bg-slate-100/70">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <FileCheck className="h-4 w-4 text-teal" />
                <span className="text-[10px] uppercase font-bold text-slate-500">Pages</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{synopsis.sourceIndex.filter((s) => s.readable).length}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Readable</p>
            </div>

            <div
              onClick={onGoToChronology}
              className={cn(
                "rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 transition-all hover:bg-slate-100/70",
                onGoToChronology && "cursor-pointer hover:border-teal-300 hover:bg-teal-50/50"
              )}
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-[10px] uppercase font-bold text-slate-500">Dates</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{synopsis.chronology.length}</p>
              <p className="mt-0.5 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Timeline events</span>
                {onGoToChronology && <span className="text-[10px] text-teal-700 font-semibold">View tab →</span>}
              </p>
            </div>

            <div className={cn(
              'rounded-xl border p-3.5 transition-all',
              synopsis.potentialInconsistencies.length > 0
                ? 'border-amber-200 bg-amber-50/70'
                : 'border-slate-200/90 bg-slate-50/70'
            )}>
              <div className="flex items-center justify-between mb-1">
                <AlertTriangle className={cn('h-4 w-4', synopsis.potentialInconsistencies.length > 0 ? 'text-amber-600' : 'text-slate-500')} />
                <span className={cn('text-[10px] uppercase font-bold', synopsis.potentialInconsistencies.length > 0 ? 'text-amber-700' : 'text-slate-500')}>Conflicts</span>
              </div>
              <p className={cn('text-2xl font-bold', synopsis.potentialInconsistencies.length > 0 ? 'text-amber-900' : 'text-slate-900')}>
                {synopsis.potentialInconsistencies.length}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">Differences found</p>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 transition-all hover:bg-slate-100/70">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-[10px] uppercase font-bold text-slate-500">Pending</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {selectedRun.findings.filter((f) => f.reviewStatus === 'needs_review').length}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">Needs review</p>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 transition-all hover:bg-slate-100/70">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] uppercase font-bold text-slate-500">Checked</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {selectedRun.findings.filter((f) => f.reviewStatus === 'verified').length}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">Verified</p>
            </div>
          </div>

          {/* ── Sub-Navigation & Quick Search Filter ─────────────────────── */}
          <div className="analysis-controls flex flex-col md:flex-row md:items-center justify-between gap-3 border-y border-slate-200/80 py-3">
            <div className="flex flex-wrap gap-1.5 items-center">
              {[
                { id: 'all', label: 'All Insights' },
                { id: 'summary', label: 'Overview & Summary' },
                { id: 'data', label: `📊 Key Data Table (${keyEntities.length})` },
                { id: 'conflicts', label: `Conflicts (${synopsis.potentialInconsistencies.length})` },
                { id: 'evidence', label: `Files & Facts (${synopsis.facts.length})` },
                { id: 'orders', label: 'Court Orders & Notes' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as TabSection)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                    activeSection === tab.id
                      ? 'bg-teal text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  )}
                >
                  {tab.label}
                </button>
              ))}

              {onGoToChronology && (
                <button
                  onClick={onGoToChronology}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Switch to the dedicated Checkpoints & Chronology tab"
                >
                  <Clock className="h-3 w-3 text-teal-600" />
                  Full Chronology Tab ↗
                </button>
              )}
            </div>

            {/* Quick in-page search input */}
            <div className="relative min-w-[240px] max-w-xs">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search facts, dates, names…"
                className="h-8 pl-8 pr-7 text-xs bg-slate-50 border-slate-200 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Search Result Feedback if filtered */}
          {searchQuery && (
            <div className="rounded-lg bg-teal-50/70 border border-teal-200/80 px-3.5 py-2 text-xs text-teal-900 flex items-center justify-between">
              <span>Showing results matching &ldquo;<strong>{searchQuery}</strong>&rdquo;</span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-teal-700 underline font-semibold hover:text-teal-900 cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 1: CASE OVERVIEW                                      */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {(activeSection === 'all' || activeSection === 'summary') && (
            <section className="space-y-3.5 pt-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                <h3 className="text-base font-bold text-slate-900">1. Case Overview</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <FolderOpen className="h-4 w-4 text-teal" />
                    <span className="text-xs font-semibold">Case Type</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 capitalize">
                    {t('overview.caseType', synopsis.caseOverview.caseType === 'unspecified' ? 'Not specified yet' : (synopsis.caseOverview.caseType || 'Not specified'))}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Clock className="h-4 w-4 text-teal" />
                    <span className="text-xs font-semibold">Current Status</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 capitalize">
                    {t('overview.status', synopsis.caseOverview.status === 'unspecified' ? 'Active / In Progress' : (synopsis.caseOverview.status || 'Active'))}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Building2 className="h-4 w-4 text-teal" />
                    <span className="text-xs font-semibold">Court</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {t('overview.court', synopsis.caseOverview.court || 'Not specified')}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <MapPin className="h-4 w-4 text-teal" />
                    <span className="text-xs font-semibold">Jurisdiction</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {t('overview.jurisdiction', synopsis.caseOverview.jurisdiction || 'Not specified')}
                  </p>
                </div>
              </div>

              {synopsis.caseOverview.userNotes && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Lawyer&apos;s Initial Case Notes
                  </span>
                  <p className="whitespace-pre-wrap leading-relaxed">{t('overview.userNotes', synopsis.caseOverview.userNotes)}</p>
                </div>
              )}
            </section>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 2: KEY CASE DATA & FACT MATRIX (TABULAR VIEW)          */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {(activeSection === 'all' || activeSection === 'data') && (
            <section className="space-y-4 pt-2 border-t border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900">2. Key Case Data &amp; Fact Matrix</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 border border-teal-200">
                      <FileSpreadsheet className="h-3 w-3 text-teal" />
                      {keyEntities.length} Key Value{keyEntities.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyAllKeyEntities(keyEntities)}
                    disabled={keyEntities.length === 0}
                    className="h-8 gap-1.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    title="Copy all extracted key values as formatted text"
                  >
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    Copy All Data
                  </Button>
                </div>
              </div>

              <p className="text-xs text-slate-500 max-w-2xl">
                Critical legal identifiers, penal sections, custody dates, and forensic items organized into structured tabular rows so key values never get lost in prose. Every entry is clickable to jump directly to its document page.
              </p>

              {/* Quick Highlight Cards Strip */}
              {keyEntities.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* FIR / Crime No */}
                  {(() => {
                    const fir = keyEntities.find((k) => k.field.includes('FIR'))
                    return fir ? (
                      <div
                        onClick={() => openSource(fir.source, fir.field)}
                        className="group rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                            <Scale className="h-3.5 w-3.5 text-teal" /> FIR / Crime No
                          </span>
                          <span className="text-[10px] text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Click to view →</span>
                        </div>
                        <p className="text-lg font-mono font-bold text-slate-900 tracking-tight">{fir.value}</p>
                        <p className="text-[11px] text-slate-500 mt-1 truncate">
                          {keyEntities.find((k) => k.field === 'Police Station')?.value ?? 'Police Station'} · p. {fir.source.pageNumber}
                        </p>
                      </div>
                    ) : null
                  })()}

                  {/* Accused Person */}
                  {(() => {
                    const acc = keyEntities.find((k) => k.field.includes('Accused'))
                    return acc ? (
                      <div
                        onClick={() => openSource(acc.source, acc.field)}
                        className="group rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-indigo-600" /> Accused
                          </span>
                          <span className="text-[10px] text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Click to view →</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 truncate" title={acc.value}>{acc.value.split(',')[0]}</p>
                        <p className="text-[11px] text-slate-500 mt-1 truncate">
                          {acc.value.split(',')[1] || acc.contextSnippet || 'Named in FIR'}
                        </p>
                      </div>
                    ) : null
                  })()}

                  {/* Charges / Penal Sections */}
                  {(() => {
                    const sec = keyEntities.find((k) => k.field.includes('Penal Sections'))
                    return sec ? (
                      <div
                        onClick={() => openSource(sec.source, sec.field)}
                        className="group rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                            <Scale className="h-3.5 w-3.5 text-rose-600" /> Penal Sections
                          </span>
                          <span className="text-[10px] text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Click to view →</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-2" title={sec.value}>{sec.value}</p>
                        <p className="text-[10px] text-slate-500 mt-1 truncate">
                          Substantive criminal sections cited
                        </p>
                      </div>
                    ) : null
                  })()}

                  {/* Arrest & Custody */}
                  {(() => {
                    const arrest = keyEntities.find((k) => k.field.includes('Arrest'))
                    const remand = keyEntities.find((k) => k.field.includes('Remand'))
                    const target = arrest || remand
                    return target ? (
                      <div
                        onClick={() => openSource(target.source, target.field)}
                        className="group rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" /> Custody / Remand
                          </span>
                          <span className="text-[10px] text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Click to view →</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {remand ? remand.value : arrest?.value}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 truncate">
                          {arrest ? `Arrest: ${arrest.value}` : 'Judicial Custody'}
                        </p>
                      </div>
                    ) : null
                  })()}
                </div>
              )}

              {/* Table Card */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                {/* Table Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {[
                      { id: 'all', label: `All (${keyEntities.length})` },
                      { id: 'charges', label: `⚖️ Charges (${keyEntities.filter((k) => k.category === 'charges').length})` },
                      { id: 'person', label: `👤 People (${keyEntities.filter((k) => k.category === 'person').length})` },
                      { id: 'custody', label: `🛡️ Custody (${keyEntities.filter((k) => k.category === 'custody').length})` },
                      { id: 'datetime', label: `📅 Dates (${keyEntities.filter((k) => k.category === 'datetime').length})` },
                      { id: 'location', label: `📍 Locations (${keyEntities.filter((k) => k.category === 'location').length})` },
                      { id: 'evidence', label: `🔍 Evidence (${keyEntities.filter((k) => k.category === 'evidence').length})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setEntityCategoryFilter(tab.id as typeof entityCategoryFilter)}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer',
                          entityCategoryFilter === tab.id
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Filter inside table */}
                  <div className="relative min-w-[220px]">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      value={tableSearchQuery}
                      onChange={(e) => setTableSearchQuery(e.target.value)}
                      placeholder="Filter parameters or values…"
                      className="h-7 pl-7 pr-6 text-xs bg-white border-slate-200 focus:border-teal"
                    />
                    {tableSearchQuery && (
                      <button
                        onClick={() => setTableSearchQuery('')}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* The Responsive Table */}
                {filteredKeyEntities.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No key values match your current filter. Try clearing the search.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100/75 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                        <tr>
                          <th scope="col" className="py-3 px-4 w-[24%]">Case Parameter / Field</th>
                          <th scope="col" className="py-3 px-4 w-[40%]">Extracted Key Value</th>
                          <th scope="col" className="py-3 px-4 w-[22%]">Verified Source</th>
                          <th scope="col" className="py-3 px-4 w-[14%] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredKeyEntities.map((item, idx) => {
                          const categoryStyle = {
                            charges: {
                              badge: 'bg-rose-50 text-rose-800 border-rose-200',
                              icon: <Scale className="h-3.5 w-3.5 text-rose-600 shrink-0" />,
                              label: 'Charge',
                            },
                            person: {
                              badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                              icon: <User className="h-3.5 w-3.5 text-indigo-600 shrink-0" />,
                              label: 'Person',
                            },
                            datetime: {
                              badge: 'bg-blue-50 text-blue-800 border-blue-200',
                              icon: <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />,
                              label: 'Date/Time',
                            },
                            custody: {
                              badge: 'bg-amber-50 text-amber-800 border-amber-200',
                              icon: <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />,
                              label: 'Custody',
                            },
                            location: {
                              badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                              icon: <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />,
                              label: 'Location',
                            },
                            evidence: {
                              badge: 'bg-purple-50 text-purple-800 border-purple-200',
                              icon: <FileCheck className="h-3.5 w-3.5 text-purple-600 shrink-0" />,
                              label: 'Evidence',
                            },
                            general: {
                              badge: 'bg-slate-100 text-slate-800 border-slate-200',
                              icon: <FileText className="h-3.5 w-3.5 text-slate-600 shrink-0" />,
                              label: 'General',
                            },
                          }[item.category] || {
                            badge: 'bg-slate-100 text-slate-800 border-slate-200',
                            icon: <FileText className="h-3.5 w-3.5 text-slate-600 shrink-0" />,
                            label: 'Data',
                          }

                          const isCopied = copiedKey === item.field

                          return (
                            <tr
                              key={`${item.field}-${idx}`}
                              className="hover:bg-teal-50/30 transition-colors group"
                            >
                              {/* Field Name & Category */}
                              <td className="py-3 px-4 align-top">
                                <div className="flex items-start gap-2">
                                  <div className="mt-0.5">{categoryStyle.icon}</div>
                                  <div>
                                    <span className="font-bold text-slate-900 block leading-snug">
                                      {item.field}
                                    </span>
                                    {item.contextSnippet && (
                                      <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                                        {item.contextSnippet}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Extracted Key Value */}
                              <td className="py-3 px-4 align-top">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={cn(
                                      "inline-block font-semibold text-xs py-1 px-2.5 rounded-lg border",
                                      item.category === 'charges'
                                        ? "bg-rose-50/80 text-rose-900 border-rose-200 font-mono"
                                        : item.category === 'custody'
                                        ? "bg-amber-50 text-amber-950 border-amber-200"
                                        : item.category === 'person'
                                        ? "bg-indigo-50/80 text-indigo-950 border-indigo-200"
                                        : item.category === 'datetime'
                                        ? "bg-blue-50/80 text-blue-950 border-blue-200 font-mono"
                                        : "bg-slate-100 text-slate-900 border-slate-200"
                                    )}>
                                      {item.value}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Verified Source (Clickable) */}
                              <td className="py-3 px-4 align-top">
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    onClick={() => openSource(item.source, item.field)}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-850 border border-teal-200/80 hover:bg-teal-100 hover:border-teal-300 transition-colors text-left cursor-pointer"
                                    title="Click to view original source page in document"
                                  >
                                    <FileText className="h-3 w-3 text-teal-600 shrink-0" />
                                    <span className="truncate max-w-[150px]">{item.source.documentName}</span>
                                    <span className="text-teal-700 font-bold shrink-0">· p. {item.source.pageNumber}</span>
                                  </button>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 align-top text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(item.value, item.field)}
                                    className={cn(
                                      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border",
                                      isCopied
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                        : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                                    )}
                                    title="Copy this value to clipboard"
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-600" />
                                        <span>Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3 text-slate-500" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openSource(item.source, item.field)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
                                    title="View in Document Preview"
                                  >
                                    <Eye className="h-3 w-3 text-teal-600" />
                                    <span>View</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 3: EXECUTIVE SUMMARY                                  */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {(activeSection === 'all' || activeSection === 'summary') && (
            <section className="space-y-3.5 pt-2 border-t border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                <h3 className="text-base font-bold text-slate-900">3. Executive Summary</h3>
                <span className="text-xs font-normal text-slate-500">(At a glance)</span>
              </div>

              {/* Standard Extracted Summary */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-teal-50 p-2 text-teal-700 shrink-0">
                    <Quote className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm leading-relaxed text-slate-800">
                      {t('executiveSynopsis', synopsis.executiveSynopsis)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-slate-700 font-medium">
                        <FileCheck className="h-3.5 w-3.5 text-teal" /> {documents.length} files reviewed
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-slate-700 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" /> {synopsis.chronology.length} dates recorded
                      </span>
                      {synopsis.potentialInconsistencies.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-amber-800 font-medium">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> {synopsis.potentialInconsistencies.length} conflicts flagged
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI-Generated Summary Card (if present) */}
              {synopsis.aiAnalysis && (
                <div className="rounded-xl border border-teal-200/90 bg-gradient-to-br from-teal-50/70 via-white to-slate-50/50 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-teal-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-teal" />
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                        AI-Grounded Synthesis
                      </span>
                    </div>
                    <span className="rounded-full bg-teal-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800">
                      {synopsis.aiAnalysis.provider} · {synopsis.aiAnalysis.model}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-800">
                    {t('aiAnalysis.executiveSummary', synopsis.aiAnalysis.executiveSummary)}
                  </p>

                  {synopsis.aiAnalysis.executiveSources.length > 0 && (
                    <div className="pt-2 border-t border-teal-100/70 space-y-2">
                      <span className="text-xs font-semibold text-teal-950 block">
                        Verified passages from uploaded files:
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {synopsis.aiAnalysis.executiveSources.map((source, index) => (
                          <div key={index} className="rounded-lg border border-slate-200/80 bg-white p-2.5 text-xs text-slate-700 space-y-1.5">
                            <p className="italic text-slate-600 line-clamp-2">
                              &ldquo;{source.quote}&rdquo;
                            </p>
                            <SourceBadge source={{ ...source, passage: source.quote }} onOpen={openSource} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 4: TIMELINE & CHRONOLOGY HIGHLIGHTS                   */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {(activeSection === 'all' || activeSection === 'summary') && (
            <section className="space-y-3.5 pt-2 border-t border-slate-200/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  <h3 className="text-base font-bold text-slate-900">4. Timeline &amp; Event Checkpoints</h3>
                  <span className="text-xs font-normal text-slate-500">
                    ({synopsis.chronology.length} date milestone{synopsis.chronology.length === 1 ? '' : 's'} recorded)
                  </span>
                </div>
                {onGoToChronology && (
                  <button
                    type="button"
                    onClick={onGoToChronology}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Open Complete Chronology &amp; Investigation Wall →
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-teal-200/80 bg-gradient-to-r from-teal-50/60 via-slate-50 to-white p-5 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-teal" />
                      Key Milestones Mapped Across Records
                    </h4>
                    <p className="mt-1 text-xs text-slate-600 max-w-xl">
                      {synopsis.chronology.length} chronological events were extracted from your case records. To prevent duplicate clutter, the full animated timeline, procedural checkpoints, and interactive investigation wall live in the dedicated tab.
                    </p>
                  </div>
                  {onGoToChronology && (
                    <Button
                      onClick={onGoToChronology}
                      size="sm"
                      className="shrink-0 gap-1.5 bg-teal text-white hover:bg-teal-light shadow-xs cursor-pointer"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Explore Timeline &amp; Wall
                    </Button>
                  )}
                </div>

                {synopsis.chronology.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-3 border-t border-teal-100">
                    {synopsis.chronology.slice(0, 3).map((event, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200/90 bg-white p-3 text-xs space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-teal-850 bg-teal-50 px-2 py-0.5 rounded text-[11px] border border-teal-200/60">
                            {event.date}
                          </span>
                          <span className="text-[10px] text-slate-400">p. {event.pageNumber}</span>
                        </div>
                        <p className="text-slate-700 line-clamp-2 text-[11px]">
                          {t(`chronology.${idx}`, event.passage)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 5: CONFLICTS & DIFFERENCES (POTENTIAL INCONSISTENCIES)*/}
          {/* ═════════════════════════════════════════════════════════════ */}
          {(activeSection === 'all' || activeSection === 'conflicts') && (
            <section className="space-y-3.5 pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <h3 className="text-base font-bold text-slate-900">5. Conflicts &amp; Differences Found</h3>
                  <span className="text-xs font-normal text-slate-500">
                    ({filteredInconsistencies.length} item{filteredInconsistencies.length === 1 ? '' : 's'})
                  </span>
                </div>
              </div>

              {filteredInconsistencies.length === 0 ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 text-sm text-emerald-900">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-semibold">No conflicting statements found</p>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        {documents.length <= 1
                          ? 'Only 1 file uploaded so cross-document comparison is not applicable. Upload related records to compare.'
                          : 'No conflicting dates, party names, or locations were detected between your uploaded documents.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInconsistencies.map((issue, index) => {
                    const finding = selectedRun.findings.find(
                      (item) => item.analysisRunId === selectedRun.id && item.extractedValue === issue.values[0]
                    ) ?? selectedRun.findings[index]

                    return (
                      <div
                        key={`${issue.field}-${index}`}
                        className="rounded-xl border border-amber-200/80 bg-white p-5 shadow-xs space-y-4"
                      >
                        {/* Header with field name & origin badge */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                            <span className="font-bold text-slate-900 text-sm capitalize">
                              Difference in: {issue.field}
                            </span>
                            <span className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              issue.origin === 'ai' ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-slate-100 text-slate-700'
                            )}>
                              {issue.origin === 'ai' ? 'AI Flagged' : 'Direct Text Comparison'}
                            </span>
                          </div>

                          {/* Review status badge */}
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold',
                            finding?.reviewStatus === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : finding?.reviewStatus === 'not_a_discrepancy'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          )}>
                            {finding?.reviewStatus === 'verified'
                              ? '✓ Verified Conflict'
                              : finding?.reviewStatus === 'not_a_discrepancy'
                              ? '✕ Dismissed (Not a conflict)'
                              : '⚠️ Needs Review'}
                          </span>
                        </div>

                        {/* Explanation in plain english */}
                        {issue.explanation && (
                          <p className="text-xs leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                            <strong>Note: </strong>{t(`conflict.${index}.explanation`, issue.explanation)}
                          </p>
                        )}

                        {/* Conflicting Values Comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {issue.sources.map((source, sIdx) => (
                            <div key={sIdx} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-700">Record #{sIdx + 1} states:</span>
                                <SourceBadge source={source} onOpen={(ref) => openSource(ref, finding?.description)} />
                              </div>
                              <p className="text-sm font-bold text-slate-900 bg-white p-2 rounded border border-slate-200">
                                {t(`conflict.${index}.val.${sIdx}`, issue.values[sIdx] || issue.values[0])}
                              </p>
                              {source.passage && (
                                <p className="text-xs text-slate-600 italic line-clamp-2">
                                  &ldquo;{source.passage}&rdquo;
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Interactive review buttons */}
                        {finding && (
                          <div className="analysis-controls flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                            <span className="text-slate-500 font-medium">Verify this difference:</span>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => reviewFinding(finding.id, 'verified')}
                                className={cn(
                                  'rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer',
                                  finding.reviewStatus === 'verified'
                                    ? 'bg-emerald-600 text-white'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                                )}
                              >
                                ✓ Looks Valid
                              </button>
                              <button
                                type="button"
                                onClick={() => reviewFinding(finding.id, 'needs_review')}
                                className={cn(
                                  'rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer',
                                  finding.reviewStatus === 'needs_review'
                                    ? 'bg-amber-600 text-white'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-800'
                                )}
                              >
                                ⚠️ Needs Review
                              </button>
                              <button
                                type="button"
                                onClick={() => reviewFinding(finding.id, 'not_a_discrepancy')}
                                className={cn(
                                  'rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer',
                                  finding.reviewStatus === 'not_a_discrepancy'
                                    ? 'bg-slate-700 text-white'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                )}
                              >
                                ✕ Not a Conflict
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 6: UPLOADED DOCUMENTS & EVIDENCE                      */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {(activeSection === 'all' || activeSection === 'evidence') && (
            <section className="space-y-4 pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  <h3 className="text-base font-bold text-slate-900">6. Uploaded Documents &amp; Files</h3>
                  <span className="text-xs font-normal text-slate-500">
                    ({filteredDocuments.length} file{filteredDocuments.length === 1 ? '' : 's'})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredDocuments.map((doc) => {
                  const summary = synopsis.documentSummaries.find((item) => item.documentId === doc.id)
                  const aiDocSummary = synopsis.aiAnalysis?.documentSummaries.find((item) => item.documentId === doc.id)

                  return (
                    <div
                      key={doc.id}
                      className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-slate-300 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="rounded-lg bg-slate-100 p-2 text-slate-600 mt-0.5">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => openSource(summary?.summary ?? {
                                documentId: doc.id,
                                documentName: doc.originalName,
                                pageNumber: 1,
                                passage: 'Previewing document.',
                              })}
                              className="text-left font-bold text-teal-800 hover:underline hover:text-teal-950 text-sm"
                            >
                              {doc.originalName}
                            </button>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                {t(`docSummary.${filteredDocuments.indexOf(doc)}.apparentType`, summary?.apparentType || 'General Record')}
                              </span>
                              <span className="text-xs text-slate-400">
                                {doc.pageCount ?? 1} page{doc.pageCount === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className={cn(
                          'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                          doc.processingStatus === 'complete'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800'
                        )}>
                          {doc.processingStatus === 'complete' ? 'Ready' : doc.processingStatus}
                        </span>
                      </div>

                      {/* Text snippet preview */}
                      {summary?.summary && (
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 line-clamp-2">
                          {t(`docSummary.${filteredDocuments.indexOf(doc)}.summary`, (summary.summary as { passage?: string })?.passage || '')}
                        </p>
                      )}

                      {aiDocSummary && (
                        <div className="text-xs text-teal-900 bg-teal-50/70 p-2.5 rounded-lg border border-teal-200/60 space-y-1">
                          <span className="font-semibold block">AI Summary:</span>
                          <p>{t(`aiDocSummary.${(synopsis.aiAnalysis?.documentSummaries ?? []).indexOf(aiDocSummary)}`, aiDocSummary.summary)}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                        <span>Processed: {doc.processedAt ? new Date(doc.processedAt).toLocaleDateString() : 'Ready'}</span>
                        <button
                          type="button"
                          onClick={() => openSource(summary?.summary ?? {
                            documentId: doc.id,
                            documentName: doc.originalName,
                            pageNumber: 1,
                            passage: 'Previewing document.',
                          })}
                          className="text-teal-700 hover:underline font-semibold cursor-pointer"
                        >
                          Preview File →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Verified Facts & Important Statements */}
              <div className="pt-4 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Quote className="h-4 w-4 text-teal" />
                  Key Facts &amp; Quotes Extracted
                </h4>

                {filteredFacts.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No key facts matching your query.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredFacts.slice(0, 8).map((fact, index) => (
                      <div key={index} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2">
                        <p className="text-xs text-slate-700 leading-relaxed">
                          &ldquo;{t(`fact.${index}`, fact.passage)}&rdquo;
                        </p>
                        <div className="flex justify-end">
                          <SourceBadge source={fact} onOpen={openSource} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 7: COURT ORDERS & PROCEDURAL HISTORY                  */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {(activeSection === 'all' || activeSection === 'orders') && (
            <section className="space-y-3.5 pt-2 border-t border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                <h3 className="text-base font-bold text-slate-900">7. Court Orders &amp; Procedural History</h3>
                <span className="text-xs font-normal text-slate-500">
                  ({filteredOrders.length} record{filteredOrders.length === 1 ? '' : 's'})
                </span>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-xs text-slate-500">
                  No prior court orders or procedural directions were found in the uploaded documents.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredOrders.map((order, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                          <Gavel className="h-4 w-4 text-teal" />
                          <span>Court Direction / Ruling</span>
                        </div>
                        <SourceBadge source={order} onOpen={openSource} />
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        &ldquo;{t(`order.${idx}`, order.passage)}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 8: MISSING OR UNCLEAR DETAILS                         */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {(activeSection === 'all' || activeSection === 'orders') && (
            <section className="space-y-3 pt-2 border-t border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <h3 className="text-base font-bold text-slate-900">8. Missing Details &amp; Unclear Scans</h3>
              </div>

              {synopsis.missingOrUnclear.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>All uploaded pages were clear and readable. No processing errors reported.</span>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2 text-xs text-amber-900">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Please check the following items:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    {synopsis.missingOrUnclear.map((item, idx) => (
                      <li key={idx}>{t(`missing.${idx}`, item)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 9: CASE REVIEW NOTES                                  */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {(activeSection === 'all' || activeSection === 'orders') && (
            <section className="space-y-3 pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  <h3 className="text-base font-bold text-slate-900">9. Lawyer&apos;s Review Notes</h3>
                </div>
                <span className="text-xs text-slate-400">Saved with this analysis version</span>
              </div>

              <div className="analysis-controls rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                <Textarea
                  value={notesDraft}
                  onChange={(event) => { setNotesDraft(event.target.value); setIsDirty(true) }}
                  placeholder="Type any lawyer notes, verification thoughts, or hearing strategy for this case version…"
                  rows={4}
                  className="bg-white border-slate-200 text-sm focus:border-teal"
                  maxLength={20000}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {isDirty ? '⚠️ Unsaved changes' : 'All notes saved for Version ' + selectedRun.version}
                  </span>
                  <Button
                    size="sm"
                    onClick={saveNotes}
                    disabled={!isDirty || savingNotes}
                    className="gap-2 bg-teal text-white hover:bg-teal-light cursor-pointer"
                  >
                    {savingNotes ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Notes
                  </Button>
                </div>
              </div>

              {!isDirty && selectedRun.reviewNotes && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  <span className="font-bold text-slate-900 block mb-1">Current Saved Note:</span>
                  {selectedRun.reviewNotes}
                </div>
              )}
            </section>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 10: PAGE CITATIONS & SOURCE INDEX                     */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {(activeSection === 'all' || activeSection === 'orders') && (
            <section className="space-y-3 pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <h3 className="text-base font-bold text-slate-900">10. Page Citations &amp; Source Index</h3>
                </div>
                <span className="text-xs text-slate-500">
                  {synopsis.sourceIndex.filter((s) => s.readable).length} of {synopsis.sourceIndex.length} pages verified
                </span>
              </div>

              {synopsis.sourceIndex.length === 0 ? (
                <p className="text-xs text-slate-500">No page references available.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {synopsis.sourceIndex.map((source, index) => (
                    <button
                      key={`${source.documentId}-${source.pageNumber}-${index}`}
                      type="button"
                      onClick={() => openSource({
                        documentId: source.documentId,
                        documentName: source.documentName,
                        pageNumber: source.pageNumber,
                        passage: 'Viewing source page.',
                      })}
                      className="flex items-center justify-between rounded-lg border border-slate-200/90 bg-slate-50/70 px-3 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:border-teal-200 transition-all text-left cursor-pointer"
                    >
                      <div className="truncate mr-1">
                        <span className="font-medium truncate block max-w-[120px]">{source.documentName}</span>
                        <span className="text-[10px] text-slate-400">p. {source.pageNumber}</span>
                      </div>
                      <span className={cn(
                        'h-2 w-2 rounded-full shrink-0',
                        source.readable ? 'bg-emerald-500' : 'bg-rose-500'
                      )} title={source.readable ? 'Readable' : 'Unreadable'} />
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Document Preview Modal ──────────────────────────────────── */}
          <Dialog open={selectedSource !== null} onOpenChange={(open) => { if (!open) setSelectedSource(null) }}>
            <DialogContent className="sm:max-w-5xl p-6 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 text-base">
                  <FileText className="h-5 w-5 text-teal" />
                  {selectedSource ? `${selectedSource.documentName} · Page ${selectedSource.pageNumber}` : 'Source Document'}
                </DialogTitle>
              </DialogHeader>

              {selectedSource && (
                <div className="space-y-4">
                  {selectedSource.relatedFinding && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                      <strong>Related Issue: </strong> {selectedSource.relatedFinding}
                    </div>
                  )}

                  <blockquote className="rounded-xl border-l-4 border-teal-500 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-800 italic">
                    &ldquo;{selectedSource.passage || 'No text snippet available for this page.'}&rdquo;
                  </blockquote>

                  <div className="h-[55vh] min-h-64 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {selectedDocument?.fileType === 'image' ? (
                      <img
                        src={`/api/documents/${selectedSource.documentId}/file`}
                        alt={`${selectedSource.documentName}, page ${selectedSource.pageNumber}`}
                        className="mx-auto h-full max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <iframe
                        title={`${selectedSource.documentName}, page ${selectedSource.pageNumber}`}
                        src={sourceHref(selectedSource)}
                        className="h-full w-full"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Double check this snippet against the original record.</span>
                    <a
                      href={sourceHref(selectedSource)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-700 hover:underline font-semibold"
                    >
                      Open file in new tab <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

        </div>
      ) : null}
    </div>
  )
}