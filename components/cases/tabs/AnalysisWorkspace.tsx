'use client'

import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import {
  AlertTriangle,
  Check,
  CircleAlert,
  FileText,
  File as FileIcon,
  LoaderCircle,
  Printer,
  RefreshCw,
  Save,
  GitCompare,
  Search,
  Calendar,
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
import { ExtractedQuotesSection } from '@/components/cases/ExtractedQuotesSection'
import { cn } from '@/lib/utils'
import { sanitizeExtractedValue } from '@/lib/ocrSanitizer'
import { categorizeLegalText, cleanOcrRegex, cleanOcrText } from '@/lib/legalSanitizer'
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
      <span className="inline-flex max-w-full flex-wrap items-center gap-1.5">
        <FileText className="h-3 w-3 shrink-0 text-emerald-700" />
        <span className="break-words">{source.documentName}</span>
        <span className="shrink-0 text-emerald-700 font-semibold">· p. {source.pageNumber}</span>
      </span>
    </CitationHoverCard>
  )
}

type AnalysisSectionId = 'overview' | 'data' | 'summary' | 'documents' | 'facts' | 'citations'

export function AnalysisWorkspace({
  caseData,
  documents,
  onUploadDocuments,
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
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false)
  const notesDraftRef = useRef(notesDraft)
  const lastAutoSaveAttemptRef = useRef<string | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const [selectedSource, setSelectedSource] = useState<(EvidenceReference & { relatedFinding?: string }) | null>(null)
  
  // Interactive features
  const [activeSection, setActiveSection] = useState<AnalysisSectionId>('overview')
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
      .map((entity) => {
        const normalizedValue = sanitizeExtractedValue(entity.value, entity.field).value
        const value = cleanOcrRegex(normalizedValue)
        return `[${entity.field}]: ${value} (Source: ${entity.source.documentName}, p. ${entity.source.pageNumber})`
      })
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

  notesDraftRef.current = notesDraft

  useEffect(() => {
    if (!notesDrawerOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNotesDrawerOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [notesDrawerOpen])

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
      // Collect text fields displayed throughout the analysis.
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
        // Uploaded documents and extracted facts
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
        // Page review notes
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

  const saveNotes = useCallback(async (showToast = true) => {
    if (!selectedRun || !isDirty || savingNotes) return
    const notesToSave = notesDraft
    setSavingNotes(true)
    try {
      const response = await fetch(`/api/cases/${caseData.id}/analysis/${selectedRun.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes: notesToSave }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Review notes could not be saved.')
      setRuns((previous) => previous.map((run) => run.id === data.id ? { ...run, reviewNotes: data.reviewNotes } : run))
      setIsDirty(notesDraftRef.current !== notesToSave)
      if (showToast) toast.success('Your notes have been saved.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Review notes could not be saved.')
    } finally {
      setSavingNotes(false)
    }
  }, [caseData.id, isDirty, notesDraft, savingNotes, selectedRun])

  useEffect(() => {
    if (!isDirty || !selectedRun || savingNotes || lastAutoSaveAttemptRef.current === notesDraft) return
    const timeout = window.setTimeout(() => {
      lastAutoSaveAttemptRef.current = notesDraft
      void saveNotes(false)
    }, 800)
    return () => window.clearTimeout(timeout)
  }, [isDirty, notesDraft, saveNotes, savingNotes, selectedRun])

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

  const filteredDocuments = useMemo(() => {
    if (!documents) return []
    if (!searchQuery.trim()) return documents
    const query = searchQuery.toLowerCase()
    return documents.filter((doc) =>
      doc.originalName.toLowerCase().includes(query)
    )
  }, [documents, searchQuery])
  const pageCount = synopsis?.sourceIndex.length ?? 0
  const readablePageCount = synopsis?.sourceIndex.filter((source) => source.readable).length ?? 0
  const pagesNeedingReview = Math.max(0, pageCount - readablePageCount)
  const ocrReadability = pageCount > 0 ? Math.round((readablePageCount / pageCount) * 100) : 0
  const groundCount = new Set(
    (synopsis?.facts ?? []).map((fact) => categorizeLegalText(fact.passage).category)
  ).size
  const filingDate = synopsis?.chronology.find((entry) => /\b(?:filed|filing)\b/i.test(entry.passage))?.date

  return (
    <div className="min-w-0 space-y-5 pb-12">
      {/* ── Security & Privacy Notice (User-Friendly Tip) ───────────────── */}
      <div className="flex items-start gap-3 rounded-xl border border-teal-200/80 bg-teal-50/70 p-4 text-xs leading-relaxed text-teal-950 shadow-xs">
        <Sparkles className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
        <div className="flex-1">
          <span className="font-semibold text-teal-900">Secure Local Analysis: </span>
          All facts, dates, and comparisons are read directly from your uploaded case files. When AI is enabled, only text from authorized files is sent for summarization.
        </div>
      </div>

      {/* ── Main Toolbar: Header & Run Controls ───────────────────────── */}
      <div className="analysis-controls flex min-w-0 flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all sm:p-7 md:flex-row md:items-center">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">
            Case Analysis &amp; Synopsis
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {caseData.title || synopsis?.caseOverview.title || 'Case analysis'}
            </h1>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-500">
              {caseData.caseNumber || synopsis?.caseOverview.reference || `Case #${caseData.id}`}
            </span>
          </div>
          <p className="mt-1.5 max-w-xl border-b border-slate-100 pb-3 text-xs font-medium text-slate-600">
            Locally organized case facts, source citations, and procedural context for review.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => window.print()}
            disabled={!synopsis}
            className="gap-2 border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <Printer className="h-4 w-4 text-slate-500" /> Print / Export PDF
          </Button>

          <Button
            variant="outline"
            onClick={() => setNotesDrawerOpen(true)}
            disabled={!selectedRun}
            className="gap-2 border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <FileText className="h-4 w-4 text-slate-500" /> Notes &amp; Strategy
          </Button>

          <Button
            onClick={analyseDocuments}
            disabled={analysing || !hasReadableDocuments}
            className="gap-2 bg-teal text-white shadow-xs transition-all hover:bg-teal-light"
          >
            {analysing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {analysing
              ? 'Analyzing files…'
              : useAi
              ? `Analyze with ${aiProvider === 'gemini' ? 'Gemini AI' : 'OpenAI'}`
              : selectedRun
              ? 'Re-analyze'
              : 'Start Analysis'}
          </Button>
        </div>
      </div>

      {/* ── AI Provider Configuration (Clean & Friendly Toggle) ──────────── */}
      <div className="analysis-controls rounded-2xl border border-slate-200 bg-white p-6 text-xs shadow-sm transition-all sm:p-7">
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
        <div className="analysis-print print-content space-y-5 pb-6">
          
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
                      <p className="text-[11px] font-medium italic text-slate-700">No new findings detected in this run.</p>
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
                      <p className="text-[11px] font-medium italic text-slate-700">No differences removed.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {resolvedFindings.map((rf, i) => (
                          <li key={i} className="rounded border border-slate-200 bg-slate-50 p-2 text-[11px] font-medium text-slate-700 line-through">
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

          {/* ── High-Impact Metric Cards (At a Glance) ─────────────────── */}
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all sm:p-7">
            <h3 className="mb-5 border-b border-slate-100 pb-3 text-base font-bold text-slate-900">At a Glance</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-md sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50">
                  <FileText className="h-4 w-4 text-sky-700" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Documents</span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {documents.length} Uploaded File{documents.length === 1 ? '' : 's'}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-600">{pageCount} Pages Processed</p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-md sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50">
                  <FileCheck className="h-4 w-4 text-teal" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Evidence</span>
              </div>
              <p className="text-xl font-bold text-slate-900">{synopsis.facts.length} Facts Extracted</p>
              <p className="mt-1 text-xs font-medium text-slate-600">Categorized across {groundCount} legal grounds</p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-md sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <FileSpreadsheet className="h-4 w-4 text-indigo-700" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Fact Matrix</span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {keyEntities.length} Key Data Point{keyEntities.length === 1 ? '' : 's'}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-600">Structured values with source citations</p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-md sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">OCR Readability</span>
              </div>
              <p className="text-xl font-bold text-slate-900">{ocrReadability}% Readable</p>
              <p className="mt-1 text-xs font-medium text-slate-600">{pagesNeedingReview} Pages Needing Review</p>
            </div>
          </div>
          </section>

          {/* ── Sub-Navigation & Quick Search Filter ─────────────────────── */}
          <nav aria-label="Analysis sections" className="analysis-controls flex flex-col justify-between gap-3 border-y border-slate-200/80 py-3 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'overview', label: '1. Case Overview' },
                { id: 'data', label: '2. Key Case Data & Fact Matrix' },
                { id: 'summary', label: '3. Executive Summary' },
                { id: 'documents', label: '4. Uploaded Documents & Files' },
                { id: 'facts', label: '5. Key Facts & Quotes Extracted' },
                { id: 'citations', label: '6. Page Citations & Source Index' },
              ].map((tab) => (
                <a
                  key={tab.id}
                  href={`#analysis-section-${tab.id}`}
                  onClick={(event) => {
                    event.preventDefault()
                    setActiveSection(tab.id as AnalysisSectionId)
                    document.getElementById(`analysis-section-${tab.id}`)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                  }}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                    activeSection === tab.id
                      ? 'bg-teal text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  )}
                >
                  {tab.label}
                </a>
              ))}
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
          </nav>

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
            <section id="analysis-section-overview" className="scroll-mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all sm:p-7">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                <h3 className="flex-1 text-base font-bold text-slate-900">1. Case Overview</h3>
              </div>

              <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Building2 className="h-4 w-4 text-teal" />
                    <span className="text-xs font-semibold">Court</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{t('overview.court', synopsis.caseOverview.court || 'Not specified')}</p>
                </div>

                <div className="bg-white p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <MapPin className="h-4 w-4 text-teal" />
                    <span className="text-xs font-semibold">Jurisdiction</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{t('overview.jurisdiction', synopsis.caseOverview.jurisdiction || 'Not specified')}</p>
                </div>

                <div className="bg-white p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Clock className="h-4 w-4 text-teal" />
                    <span className="text-xs font-semibold">Current Status</span>
                  </div>
                  <p className="text-sm font-medium capitalize text-slate-900">
                    {t('overview.status', synopsis.caseOverview.status === 'unspecified' ? 'Active / In Progress' : (synopsis.caseOverview.status || 'Active'))}
                  </p>
                </div>

                <div className="bg-white p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Calendar className="h-4 w-4 text-teal" />
                    <span className="text-xs font-semibold">Filing Date</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {filingDate
                      ? new Date(`${filingDate}T00:00:00`).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Not recorded'}
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

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 2: KEY CASE DATA & FACT MATRIX (TABULAR VIEW)          */}
          {/* ═════════════════════════════════════════════════════════════ */}
            <section id="analysis-section-data" className="scroll-mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all sm:p-7">
              <div className="mb-5 flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
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

              {/* Category filters */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Category Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: 'all', label: `All (${keyEntities.length})` },
                      { id: 'charges', label: `⚖️ Charges (${keyEntities.filter((k) => k.category === 'charges').length})` },
                      { id: 'person', label: `👤 People (${keyEntities.filter((k) => k.category === 'person').length})` },
                      { id: 'datetime', label: `📅 Dates (${keyEntities.filter((k) => k.category === 'datetime').length})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setEntityCategoryFilter(tab.id as typeof entityCategoryFilter)}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
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
                  <div className="relative min-w-[220px] sm:max-w-xs sm:flex-1">
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
              <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {filteredKeyEntities.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No key values match your current filter. Try clearing the search.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed text-left text-xs text-slate-700">
                      <thead className="bg-slate-100/75 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                        <tr>
                          <th scope="col" className="w-[23%] px-4 py-3">Case Parameter / Field</th>
                          <th scope="col" className="w-[35%] px-4 py-3">Extracted Key Value</th>
                          <th scope="col" className="w-[23%] px-4 py-3">Verified Source</th>
                          <th scope="col" className="w-[19%] px-4 py-3 text-right">Actions</th>
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
                          const normalizedValue = sanitizeExtractedValue(item.value, item.field)
                          const extractedValue = {
                            ...normalizedValue,
                            value: normalizedValue.value === 'Not Specified'
                              ? normalizedValue.value
                              : cleanOcrRegex(normalizedValue.value),
                          }

                          return (
                            <tr
                              key={`${item.field}-${idx}`}
                              className="group transition-colors hover:bg-slate-50/80"
                            >
                              {/* Field Name & Category */}
                              <td className="px-4 py-3 align-top">
                                <div className="flex items-start gap-2">
                                  <div className="mt-0.5">{categoryStyle.icon}</div>
                                  <div>
                                    <span className="block text-xs font-semibold leading-snug text-slate-900">
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
                              <td className="max-w-md whitespace-normal break-words px-4 py-3 align-top">
                                <div className="flex flex-col gap-1">
                                  {extractedValue.value === 'Not Specified' ? (
                                    <span className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-normal text-slate-500">
                                      Not Specified
                                    </span>
                                  ) : (
                                    <span className="inline-block w-fit rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-900">
                                      {extractedValue.value}
                                    </span>
                                  )}
                                  {extractedValue.isNormalized && (
                                    <span className="w-fit rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] text-emerald-600">
                                      Verified Citation Standard
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Verified Source (Clickable) */}
                              <td className="px-4 py-3 align-top">
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      window.dispatchEvent(new CustomEvent('openPdfPage', {
                                        detail: { page: item.source.pageNumber },
                                      }))
                                      openSource(item.source, item.field)
                                    }}
                                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-850 transition-colors hover:border-teal-300 hover:bg-teal-100"
                                    title="Click to view original source page in document"
                                  >
                                    <FileText className="h-3 w-3 text-teal-600 shrink-0" />
                                    <span className="truncate max-w-[150px]">{item.source.documentName}</span>
                                    <span className="text-teal-700 font-bold shrink-0">· p. {item.source.pageNumber}</span>
                                  </button>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3 align-top text-right">
                                <div className="flex flex-wrap items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(extractedValue.value, item.field)}
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer",
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
                                    className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 transition-colors hover:bg-teal-100 cursor-pointer"
                                    title="View in Document Preview"
                                  >
                                    <Eye className="h-3 w-3 text-teal-600" />
                                    <span>View Page</span>
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

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 3: EXECUTIVE SUMMARY                                  */}
          {/* ═════════════════════════════════════════════════════════════ */}
            <section id="analysis-section-summary" className="scroll-mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all sm:p-7">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                <h3 className="flex-1 text-base font-bold text-slate-900">3. Executive Summary</h3>
                <span className="text-xs font-medium text-slate-600">(At a glance)</span>
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

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 4: UPLOADED DOCUMENTS & FILES                         */}
          {/* ═════════════════════════════════════════════════════════════ */}
            <section id="analysis-section-documents" className="scroll-mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all sm:p-7">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  <h3 className="text-base font-bold text-slate-900">4. Uploaded Documents &amp; Files</h3>
                  <span className="text-xs font-medium text-slate-600">
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
                      className="min-w-0 space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-md sm:p-5"
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
                              <span className="text-xs font-medium text-slate-700">
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
                          {cleanOcrText(t(`docSummary.${filteredDocuments.indexOf(doc)}.summary`, (summary.summary as { passage?: string })?.passage || ''))}
                        </p>
                      )}

                      {aiDocSummary && (
                        <div className="text-xs text-teal-900 bg-teal-50/70 p-2.5 rounded-lg border border-teal-200/60 space-y-1">
                          <span className="font-semibold block">AI Summary:</span>
                          <p>{t(`aiDocSummary.${(synopsis.aiAnalysis?.documentSummaries ?? []).indexOf(aiDocSummary)}`, aiDocSummary.summary)}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px] font-medium text-slate-700">
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

            </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 5: KEY FACTS & QUOTES EXTRACTED                       */}
          {/* ═════════════════════════════════════════════════════════════ */}
            <section id="analysis-section-facts" className="scroll-mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all sm:p-7">
              <h3 className="mb-4 border-b border-slate-100 pb-3 text-base font-bold text-slate-900">5. Key Facts &amp; Quotes Extracted</h3>
              <ExtractedQuotesSection
                rawQuotes={filteredFacts.map((fact, index) => ({
                  ...fact,
                  passage: t(`fact.${index}`, fact.passage),
                }))}
                onOpen={openSource}
              />
            </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 6: PAGE CITATIONS & SOURCE INDEX                     */}
          {/* ═════════════════════════════════════════════════════════════ */}
            <section id="analysis-section-citations" className="scroll-mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all sm:p-7">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <h3 className="text-base font-bold text-slate-900">6. Page Citations &amp; Source Index</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <span aria-hidden="true">🟢</span>
                  {synopsis.sourceIndex.filter((s) => s.readable).length} of {synopsis.sourceIndex.length} Pages Verified
                  <span className="text-emerald-600">·</span>
                  {synopsis.sourceIndex.length > 0 && synopsis.sourceIndex.every((source) => source.readable)
                    ? 'High Quality OCR'
                    : 'Review Scan Quality'}
                </span>
              </div>

              {synopsis.missingOrUnclear.length > 0 && (
                <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Pages or records needing review
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                      {synopsis.missingOrUnclear.map((item, idx) => (
                        <li key={idx}>{t(`missing.${idx}`, item)}</li>
                      ))}
                    </ul>
                </div>
              )}

              {synopsis.sourceIndex.length === 0 ? (
                <p className="text-xs font-medium text-slate-600">No page references available.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-5">
                  {synopsis.sourceIndex.map((source, index) => {
                    const pageFact = synopsis.facts.find(
                      (fact) => fact.documentId === source.documentId && fact.pageNumber === source.pageNumber
                    )
                    const category = categorizeLegalText(pageFact?.passage ?? '').category
                    const topicPresentation = {
                      JURISDICTION: { label: '🚨 Jurisdiction', border: 'border-l-red-500' },
                      COMPENSATION: { label: '💰 Compensation', border: 'border-l-amber-500' },
                      PROCEDURE: { label: '📜 Procedural', border: 'border-l-blue-500' },
                      LIMITATION: { label: '📅 Limitation', border: 'border-l-emerald-500' },
                      GENERAL: { label: '📋 Overview', border: 'border-l-slate-300' },
                    }[category]

                    return (
                      <button
                        key={`${source.documentId}-${source.pageNumber}-${index}`}
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('openPdfPage', {
                            detail: { page: source.pageNumber },
                          }))
                          openSource({
                            documentId: source.documentId,
                            documentName: source.documentName,
                            pageNumber: source.pageNumber,
                            passage: 'Viewing source page.',
                          })
                        }}
                        className={`group flex min-w-0 cursor-pointer flex-col gap-2 rounded-xl border border-l-4 border-slate-200/80 bg-slate-50/80 p-4 text-left transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-md sm:p-5 ${topicPresentation.border}`}
                      >
                        <div className="flex w-full min-w-0 items-start justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-slate-700">
                            <FileIcon className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-600" />
                            <span className="truncate">{source.documentName}</span>
                          </span>
                          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-600">
                            p. {source.pageNumber}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-medium text-slate-600">
                            p. {source.pageNumber} · {topicPresentation.label}
                          </span>
                          <span
                            className={cn(
                              'h-2 w-2 shrink-0 rounded-full',
                              source.readable ? 'bg-emerald-500' : 'bg-rose-500'
                            )}
                            title={source.readable ? 'Verified page' : 'Page needs scan review'}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>

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

      <button
        type="button"
        aria-label="Close notes and strategy"
        tabIndex={notesDrawerOpen ? 0 : -1}
        className={`fixed inset-0 z-40 bg-slate-950/50 transition-opacity duration-300 ${
          notesDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!notesDrawerOpen}
        onClick={() => setNotesDrawerOpen(false)}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="notes-drawer-title"
        aria-hidden={!notesDrawerOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl transition-[transform,visibility] duration-300 ease-in-out ${
          notesDrawerOpen ? 'visible translate-x-0 delay-0' : 'invisible translate-x-full delay-300'
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 id="notes-drawer-title" className="text-base font-bold text-slate-900">
              Notes &amp; Strategy
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Saved with analysis version {selectedRun?.version ?? '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNotesDrawerOpen(false)}
            aria-label="Close notes and strategy"
            tabIndex={notesDrawerOpen ? 0 : -1}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <p className="text-sm leading-relaxed text-slate-600">
            Record court notes, verification details, and hearing strategy for this analysis.
          </p>
          <Textarea
            value={notesDraft}
            onChange={(event) => {
              setNotesDraft(event.target.value)
              setIsDirty(true)
            }}
            placeholder="Type court notes or strategy…"
            className="min-h-64 flex-1 resize-y border-slate-200 text-sm focus:border-teal"
            maxLength={20000}
            disabled={!selectedRun}
            tabIndex={notesDrawerOpen ? 0 : -1}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500" role="status">
              {!selectedRun
                ? 'Start an analysis before adding notes.'
                : savingNotes
                  ? 'Saving…'
                  : isDirty
                    ? 'Changes will save automatically.'
                    : 'All changes saved.'}
            </span>
            <Button
              size="sm"
              onClick={() => void saveNotes()}
              disabled={!selectedRun || !isDirty || savingNotes}
              tabIndex={notesDrawerOpen ? 0 : -1}
              className="gap-2 bg-teal text-white hover:bg-teal-light"
            >
              {savingNotes ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </div>
      </aside>
    </div>
  )
}