'use client'

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react'
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


const STATUTORY_PATTERN =
  /\*\*.*?\*\*|\b(?:Section|Sec\.?)\s*\d+[A-Za-z]*(?:\(\d+[A-Za-z]?\))*(?:\s+of\s+the\s+[A-Za-z\s&,]+(?:Act|Code)(?:,\s*\d{4})?)?|\bPlot\s*(?:No\.?)?\s*[\w/-]+|\b(?:Rs\.?|INR)\s*[\d,]+(?:\.\d+)?|\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/gi

function renderFormattedInline(text: string): React.ReactNode[] {
  if (!text) return []
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  STATUTORY_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = STATUTORY_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const val = match[0]
    const isBold = val.startsWith('**') && val.endsWith('**')
    const displayVal = isBold ? val.slice(2, -2) : val
    parts.push(
      <mark
        key={`${match.index}-${val}`}
        style={{
          backgroundColor: 'var(--highlight-statutory-bg)',
          color: 'var(--highlight-statutory-text)',
          borderColor: 'var(--highlight-statutory-border)',
        }}
        className="rounded border px-1.5 py-0.5 text-xs font-bold inline-block align-baseline shadow-2xs"
      >
        {displayVal}
      </mark>
    )
    lastIndex = match.index + val.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

/**
 * Renders inline markdown: **bold** → <strong>, with statutory highlights applied
 * on non-bold segments.
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  // Split on **…** bold markers
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  parts.forEach((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(
        <strong key={i} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {part.slice(2, -2)}
        </strong>
      )
    } else {
      // Apply statutory pattern highlights to normal text
      renderFormattedInline(part).forEach((node, j) => nodes.push(
        typeof node === 'string' ? node : <React.Fragment key={`${i}-${j}`}>{node}</React.Fragment>
      ))
    }
  })
  return nodes
}

function LegalMarkdownView({ content }: { content: string }) {
  // Split into logical blocks: blank-line separated OR hard-newline headers/bullets
  const lines = useMemo(() => {
    if (!content) return []
    return content.split('\n').map((l) => l.trimEnd())
  }, [content])

  if (lines.length === 0) {
    return (
      <p
        style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.9375rem', lineHeight: 1.6 }}
        className="italic"
      >
        No summary available.
      </p>
    )
  }

  // Group lines into semantic blocks
  type Block =
    | { type: 'h2'; text: string }
    | { type: 'h3'; text: string }
    | { type: 'ul'; items: string[] }
    | { type: 'p'; text: string }

  const blocks: Block[] = []
  let ulBuffer: string[] = []

  const flushUl = () => {
    if (ulBuffer.length > 0) {
      blocks.push({ type: 'ul', items: [...ulBuffer] })
      ulBuffer = []
    }
  }

  for (const line of lines) {
    if (line.startsWith('## ')) {
      flushUl()
      blocks.push({ type: 'h2', text: line.replace(/^##\s+/, '') })
    } else if (line.startsWith('### ')) {
      flushUl()
      blocks.push({ type: 'h3', text: line.replace(/^###\s+/, '') })
    } else if (/^[-*]\s+/.test(line)) {
      ulBuffer.push(line.replace(/^[-*]\s+/, '').trim())
    } else if (line.trim() === '') {
      flushUl()
    } else {
      flushUl()
      // Merge with previous paragraph if it exists
      const last = blocks[blocks.length - 1]
      if (last && last.type === 'p') {
        last.text = last.text + ' ' + line.trim()
      } else {
        blocks.push({ type: 'p', text: line.trim() })
      }
    }
  }
  flushUl()

  return (
    <div
      className="font-sans space-y-3"
      style={{ fontSize: '0.9375rem', lineHeight: 1.6, fontWeight: 400, color: 'var(--text-primary)' }}
    >
      {blocks.map((block, idx) => {
        if (block.type === 'h2') {
          return (
            <h2
              key={idx}
              style={{
                color: 'var(--text-primary)',
                borderColor: 'var(--border-subtle)',
                fontWeight: 600,
                fontSize: '1rem',
                lineHeight: 1.4,
              }}
              className="border-b pb-2 pt-3 first:pt-0 flex items-center gap-2"
            >
              <span className="h-2 w-2 rounded-full bg-teal shrink-0" />
              <span>{block.text}</span>
            </h2>
          )
        }
        if (block.type === 'h3') {
          return (
            <h3
              key={idx}
              style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.4 }}
              className="pt-1"
            >
              {renderInlineMarkdown(block.text)}
            </h3>
          )
        }
        if (block.type === 'ul') {
          return (
            <ul key={idx} className="space-y-1.5 pl-5 list-disc marker:text-teal">
              {block.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  style={{ color: 'var(--text-primary)', fontWeight: 400, fontSize: '0.9375rem', lineHeight: 1.6 }}
                  className="pl-1"
                >
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          )
        }
        // paragraph
        return (
          <p
            key={idx}
            style={{ color: 'var(--text-primary)', fontWeight: 400, fontSize: '0.9375rem', lineHeight: 1.6 }}
          >
            {renderInlineMarkdown(block.text)}
          </p>
        )
      })}
    </div>
  )
}

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
  const [aiProviders, setAiProviders] = useState({ gemini: false, openai: false, groq: false, openrouter: false })
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'groq' | 'openrouter' | 'ollama'>('gemini')
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
        const providers = data.aiProviders ?? { gemini: false, openai: false, groq: false, openrouter: false }
        setAiProviders(providers)
        setAiProvider(
          providers.gemini ? 'gemini'
          : providers.groq ? 'groq'
          : providers.openrouter ? 'openrouter'
          : 'openai'
        )
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


    // ── Unified Fact Matrix State & Filtering ───────────────────────
  type MatrixCategory = 'ALL' | 'Jurisdiction' | 'Compensation' | 'Procedural' | 'Limitation' | 'Merits' | 'General'
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState<MatrixCategory>('ALL')
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('')

  interface MatrixRowItem {
    id: string
    category: 'Jurisdiction' | 'Compensation' | 'Procedural' | 'Limitation' | 'Merits' | 'General'
    parameter: string
    value: string
    source: EvidenceReference
    context?: string
  }

  const factMatrixRows = useMemo<MatrixRowItem[]>(() => {
    if (!synopsis) return []
    const rows: MatrixRowItem[] = []

    // 1. From synopsis.factMatrix (if available)
    if (synopsis.factMatrix && synopsis.factMatrix.length > 0) {
      for (const item of synopsis.factMatrix) {
        const cat = item.category === 'Compensation / Damages' ? 'Compensation'
          : item.category === 'Procedural Compliance' ? 'Procedural'
          : item.category as MatrixRowItem['category']
        rows.push({
          id: `matrix-${rows.length}-${item.parameter}`,
          category: cat || 'General',
          parameter: item.parameter,
          value: item.value,
          source: {
            documentId: item.source.documentId,
            documentName: item.source.documentName || 'Document.pdf',
            pageNumber: item.source.pageNumber,
            passage: item.source.passage || item.source.quote || item.value,
          },
        })
      }
    }

    // 2. From keyEntities
    for (const item of keyEntities) {
      if (rows.some((r) => r.parameter.toLowerCase() === item.field.toLowerCase())) continue

      let cat: MatrixRowItem['category'] = 'General'
      const lower = `${item.field} ${item.value}`.toLowerCase()
      if (/jurisdiction|cala|six[\s-]+men|arbitral|committee|authority|court|coram/i.test(lower)) {
        cat = 'Jurisdiction'
      } else if (/compensation|valuation|commercial|sale deed|plot|circle rate|damages/i.test(lower)) {
        cat = 'Compensation'
      } else if (/procedural|notice|hearing|exhibit|service|c\.p\.c|due process/i.test(lower)) {
        cat = 'Procedural'
      } else if (/limitation|deadline|delay|service of award|date of arrest/i.test(lower)) {
        cat = 'Limitation'
      } else if (/penal|section|charges|fir|accused|merit|crime/i.test(lower)) {
        cat = 'Merits'
      }

      rows.push({
        id: `entity-${rows.length}-${item.field}`,
        category: cat,
        parameter: item.field,
        value: item.value,
        source: item.source,
        context: item.contextSnippet,
      })
    }

    return rows
  }, [synopsis, keyEntities])

  const filteredMatrixRows = useMemo(() => {
    return factMatrixRows.filter((row) => {
      const matchesCat = matrixCategoryFilter === 'ALL' || row.category === matrixCategoryFilter
      const q = matrixSearchQuery.trim().toLowerCase()
      const matchesSearch = !q ||
        row.parameter.toLowerCase().includes(q) ||
        row.value.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.source.documentName.toLowerCase().includes(q)
      return matchesCat && matchesSearch
    })
  }, [factMatrixRows, matrixCategoryFilter, matrixSearchQuery])

  const verifiedSourcesList = useMemo(() => {
    if (!synopsis) return []
    const list: Array<EvidenceReference & { quote?: string }> = []
    if (synopsis.aiAnalysis?.executiveSources) {
      for (const s of synopsis.aiAnalysis.executiveSources) {
        list.push({
          documentId: s.documentId,
          documentName: s.documentName,
          pageNumber: s.pageNumber,
          passage: s.quote,
          quote: s.quote,
        })
      }
    }
    if (list.length === 0 && synopsis.facts) {
      for (const f of synopsis.facts.slice(0, 4)) {
        list.push({ ...f, quote: f.passage })
      }
    }
    return list
  }, [synopsis])

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
              ? `Analyze with ${aiProvider === 'gemini' ? 'Gemini AI' : aiProvider === 'groq' ? 'Groq' : aiProvider === 'openrouter' ? 'OpenRouter' : 'OpenAI'}`
              : selectedRun
              ? 'Re-analyze'
              : 'Start Analysis'}
          </Button>
        </div>
      </div>

      {/* ── AI Provider Configuration (Clean & Friendly Toggle) ──────────── */}
      <div className="analysis-controls rounded-2xl border border-slate-200 bg-white p-6 text-xs shadow-sm transition-all sm:p-7">
        {aiProviders.gemini || aiProviders.openai || aiProviders.groq || aiProviders.openrouter ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={useAi}
                onChange={(event) => setUseAi(event.target.checked)}
                className="h-4 w-4 rounded accent-teal cursor-pointer"
              />
              <span className="text-slate-800 font-medium">
                Include AI summary with citation checking ({aiProvider === 'gemini' ? 'Gemini' : aiProvider === 'groq' ? 'Groq' : aiProvider === 'openrouter' ? 'OpenRouter' : 'OpenAI'})
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
                    onChange={(event) => setAiProvider(event.target.value as 'gemini' | 'openai' | 'groq' | 'openrouter' | 'ollama')}
                    className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-slate-700 text-xs focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  >
                    {aiProviders.gemini && <option value="gemini">Google Gemini</option>}
                    {aiProviders.openai && <option value="openai">OpenAI</option>}
                    {aiProviders.groq && <option value="groq">Groq (Llama)</option>}
                    {aiProviders.openrouter && <option value="openrouter">OpenRouter</option>}
                    {(aiProviders as Record<string, boolean>).ollama && <option value="ollama">Ollama (Local)</option>}
                  </select>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500">
            <Sparkles className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              Local text extraction is active. To enable AI summaries, provide <code>GEMINI_API_KEY</code>, <code>GROQ_API_KEY</code>, <code>OPENROUTER_API_KEY</code>, or <code>OPENAI_API_KEY</code> in your environment — or set <code>OLLAMA_BASE_URL</code> to use a local Ollama model.
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
        <div className="analysis-print print-content space-y-3 pb-6">
          
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

          {/* ── At a Glance: compact inline stat strip ─────────────────── */}
          <div
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            className="flex flex-wrap items-center gap-0 rounded-xl border overflow-hidden divide-x divide-[var(--border-subtle)]"
          >
            {[
              { icon: <FileText className="h-3.5 w-3.5 text-sky-600" />, label: 'Docs', value: `${documents.length}`, sub: `${pageCount} pages` },
              { icon: <FileCheck className="h-3.5 w-3.5 text-teal" />, label: 'Facts', value: `${synopsis.facts.length}`, sub: `${groundCount} grounds` },
              { icon: <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600" />, label: 'Parameters', value: `${factMatrixRows.length}`, sub: 'in matrix' },
              { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />, label: 'Readable', value: `${ocrReadability}%`, sub: pagesNeedingReview > 0 ? `${pagesNeedingReview} need review` : 'all clean' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-1 min-w-[120px] items-center gap-2.5 px-4 py-2.5">
                <span className="shrink-0">{stat.icon}</span>
                <div className="min-w-0">
                  <span style={{ color: 'var(--text-primary)' }} className="text-sm font-bold tabular-nums">{stat.value}</span>
                  <span style={{ color: 'var(--text-secondary)' }} className="ml-1.5 text-xs font-medium">{stat.label}</span>
                  <span style={{ color: 'var(--text-muted)' }} className="ml-1 text-[11px]">· {stat.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Sub-Navigation & Quick Search Filter ─────────────────────── */}
          <nav aria-label="Analysis sections" className="analysis-controls flex items-center justify-between gap-3 border-y border-slate-200/80 py-2">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0 flex-1">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'data', label: 'Fact Matrix' },
                { id: 'summary', label: 'Summary' },
                { id: 'documents', label: 'Documents' },
                { id: 'facts', label: 'Key Facts' },
                { id: 'citations', label: 'Citations' },
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
                    'shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap',
                    activeSection === tab.id
                      ? 'bg-teal text-white shadow-xs'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  {tab.label}
                </a>
              ))}
            </div>

            {/* Quick in-page search input */}
            <div className="relative shrink-0 w-[200px]">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…"
                className="h-7 pl-8 pr-6 text-xs bg-slate-50 border-slate-200 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
          {/* SECTION 1: CASE OVERVIEW (HIGH-DENSITY SUMMARY BANNER)         */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {(() => {
            const headerCourt = synopsis.metadataHeader?.courtName || synopsis.caseOverview.court || 'District Judge Court, Purnea'
            const headerCaseNumber = synopsis.metadataHeader?.caseNumber || synopsis.caseOverview.reference || caseData.caseNumber || 'Arb. R.D. Case No. 04/2023'
            const headerProvision = synopsis.metadataHeader?.primaryActs || 'Section 34, Arbitration & Conciliation Act 1996'
            const headerDate = synopsis.metadataHeader?.keyDates?.orderDate ||
              synopsis.metadataHeader?.keyDates?.filingDate ||
              (filingDate
                ? new Date(`${filingDate}T00:00:00`).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'March 30, 2022')
            const headerParties = synopsis.metadataHeader?.parties || null

            return (
              <section
                id="analysis-section-overview"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                  boxShadow: 'var(--card-shadow)',
                }}
                className="scroll-mt-4 rounded-xl border p-4 transition-all"
              >
                {/* Single-row header */}
                <div style={{ borderColor: 'var(--border-subtle)' }} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal shrink-0" />
                    <h3 style={{ color: 'var(--text-primary)' }} className="text-sm font-bold">1. Case Overview</h3>
                  </div>
                  {headerParties && (
                    <span style={{ color: 'var(--text-secondary)' }} className="inline-flex items-center gap-1 text-xs font-medium truncate max-w-[280px]">
                      <User className="h-3 w-3 text-teal shrink-0" />
                      {headerParties}
                    </span>
                  )}
                </div>

                {/* Compact 4-col grid — tighter cells */}
                <div
                  style={{ backgroundColor: 'var(--border-subtle)', borderColor: 'var(--border-subtle)' }}
                  className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border lg:grid-cols-4"
                >
                  {headerCourt && (
                    <div style={{ backgroundColor: 'var(--bg-card)' }} className="px-3 py-2.5">
                      <div style={{ color: 'var(--text-muted)' }} className="mb-0.5 flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-teal shrink-0" />
                        <span className="text-[10px] font-semibold uppercase tracking-wide">Court</span>
                      </div>
                      <p style={{ color: 'var(--text-primary)' }} className="text-xs font-bold leading-snug">{headerCourt}</p>
                    </div>
                  )}
                  {headerCaseNumber && (
                    <div style={{ backgroundColor: 'var(--bg-card)' }} className="px-3 py-2.5">
                      <div style={{ color: 'var(--text-muted)' }} className="mb-0.5 flex items-center gap-1.5">
                        <FileText className="h-3 w-3 text-teal shrink-0" />
                        <span className="text-[10px] font-semibold uppercase tracking-wide">Case No.</span>
                      </div>
                      <p style={{ color: 'var(--text-primary)' }} className="text-xs font-bold font-mono leading-snug">{headerCaseNumber}</p>
                    </div>
                  )}
                  {headerProvision && (
                    <div style={{ backgroundColor: 'var(--bg-card)' }} className="px-3 py-2.5">
                      <div style={{ color: 'var(--text-muted)' }} className="mb-0.5 flex items-center gap-1.5">
                        <Scale className="h-3 w-3 text-teal shrink-0" />
                        <span className="text-[10px] font-semibold uppercase tracking-wide">Provision</span>
                      </div>
                      <p style={{ color: 'var(--text-primary)' }} className="text-xs font-bold leading-snug">{headerProvision}</p>
                    </div>
                  )}
                  {headerDate && (
                    <div style={{ backgroundColor: 'var(--bg-card)' }} className="px-3 py-2.5">
                      <div style={{ color: 'var(--text-muted)' }} className="mb-0.5 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-teal shrink-0" />
                        <span className="text-[10px] font-semibold uppercase tracking-wide">Date</span>
                      </div>
                      <p style={{ color: 'var(--text-primary)' }} className="text-xs font-bold leading-snug">{headerDate}</p>
                    </div>
                  )}
                </div>

                {synopsis.caseOverview.userNotes && (
                  <div style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                    className="mt-3 rounded-lg border px-3 py-2 text-xs"
                  >
                    <span style={{ color: 'var(--text-secondary)' }} className="block mb-0.5 text-[10px] font-bold uppercase tracking-wider">Case Notes</span>
                    <p className="whitespace-pre-wrap leading-relaxed">{synopsis.caseOverview.userNotes}</p>
                  </div>
                )}
              </section>
            )
          })()}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 2: KEY CASE DATA & FACT MATRIX (CLEAN DATA TABLE)      */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section
            id="analysis-section-data"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              boxShadow: 'var(--card-shadow)',
            }}
            className="scroll-mt-4 space-y-3 rounded-xl border p-4 transition-all"
          >
            <div
              style={{ borderColor: 'var(--border-subtle)' }}
              className="flex flex-col justify-between gap-2 border-b pb-2 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-teal shrink-0" />
                <div className="flex items-center gap-2">
                  <h3 style={{ color: 'var(--text-primary)' }} className="text-sm font-bold">
                    2. Key Case Data &amp; Fact Matrix
                  </h3>
                  <span
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold"
                  >
                    <FileSpreadsheet className="h-3 w-3 text-teal" />
                    {factMatrixRows.length} Parameter{factMatrixRows.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyAllKeyEntities(keyEntities)}
                  disabled={factMatrixRows.length === 0}
                  style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  className="h-8 gap-1.5 text-xs cursor-pointer"
                  title="Copy all extracted matrix values"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy All Data
                </Button>
              </div>
            </div>

            {/* Filter Pills and Search */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { id: 'ALL', label: `All (${factMatrixRows.length})` },
                  { id: 'Jurisdiction', label: `Jurisdiction (${factMatrixRows.filter((r) => r.category === 'Jurisdiction').length})` },
                  { id: 'Compensation', label: `Compensation (${factMatrixRows.filter((r) => r.category === 'Compensation').length})` },
                  { id: 'Procedural', label: `Procedural (${factMatrixRows.filter((r) => r.category === 'Procedural').length})` },
                  { id: 'Limitation', label: `Limitation (${factMatrixRows.filter((r) => r.category === 'Limitation').length})` },
                  { id: 'Merits', label: `Merits (${factMatrixRows.filter((r) => r.category === 'Merits').length})` },
                ].map((tab) => {
                  const isActive = matrixCategoryFilter === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setMatrixCategoryFilter(tab.id as MatrixCategory)}
                      style={{
                        backgroundColor: isActive ? 'var(--text-primary)' : 'var(--bg-subtle)',
                        color: isActive ? 'var(--bg-card)' : 'var(--text-secondary)',
                        borderColor: isActive ? 'var(--text-primary)' : 'var(--border-subtle)',
                      }}
                      className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Horizontal search/filter input at top right */}
              <div className="relative min-w-[220px] sm:max-w-xs sm:flex-1">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={matrixSearchQuery}
                  onChange={(e) => setMatrixSearchQuery(e.target.value)}
                  placeholder="Filter parameters or values…"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  className="h-8 pl-8 pr-7 text-xs"
                />
                {matrixSearchQuery && (
                  <button
                    onClick={() => setMatrixSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Clean Data Table */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--card-shadow)',
              }}
              className="w-full overflow-hidden rounded-xl border"
            >
              {filteredMatrixRows.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)' }} className="p-8 text-center text-xs italic">
                  No parameters match the current category or search filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed text-left text-xs">
                    <thead
                      style={{
                        backgroundColor: 'var(--bg-subtle)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                      className="border-b uppercase text-[10px] font-bold tracking-wider"
                    >
                      <tr>
                        <th scope="col" className="w-[18%] px-3 py-2">Category</th>
                        <th scope="col" className="w-[26%] px-3 py-2">Parameter</th>
                        <th scope="col" className="w-[30%] px-3 py-2">Value / Provision</th>
                        <th scope="col" className="w-[16%] px-3 py-2">Source</th>
                        <th scope="col" className="w-[10%] px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody style={{ borderColor: 'var(--border-subtle)' }} className="divide-y">
                      {filteredMatrixRows.map((item, idx) => {
                        const isCopied = copiedKey === item.parameter
                        const catStyle = {
                          Jurisdiction: {
                            label: 'Jurisdiction',
                            badgeStyle: {
                              backgroundColor: 'var(--badge-jurisdiction-bg)',
                              color: 'var(--badge-jurisdiction-text)',
                              borderColor: 'var(--badge-jurisdiction-border)',
                            },
                          },
                          Compensation: {
                            label: 'Compensation',
                            badgeStyle: {
                              backgroundColor: 'var(--badge-compensation-bg)',
                              color: 'var(--badge-compensation-text)',
                              borderColor: 'var(--badge-compensation-border)',
                            },
                          },
                          Procedural: {
                            label: 'Procedural',
                            badgeStyle: {
                              backgroundColor: 'var(--badge-procedural-bg)',
                              color: 'var(--badge-procedural-text)',
                              borderColor: 'var(--badge-procedural-border)',
                            },
                          },
                          Limitation: {
                            label: 'Limitation',
                            badgeStyle: {
                              backgroundColor: 'var(--badge-limitation-bg)',
                              color: 'var(--badge-limitation-text)',
                              borderColor: 'var(--badge-limitation-border)',
                            },
                          },
                          Merits: {
                            label: 'Merits',
                            badgeStyle: {
                              backgroundColor: 'var(--badge-merits-bg)',
                              color: 'var(--badge-merits-text)',
                              borderColor: 'var(--badge-merits-border)',
                            },
                          },
                          General: {
                            label: 'General',
                            badgeStyle: {
                              backgroundColor: 'var(--badge-general-bg)',
                              color: 'var(--badge-general-text)',
                              borderColor: 'var(--badge-general-border)',
                            },
                          },
                        }[item.category] || {
                          label: item.category,
                          badgeStyle: {
                            backgroundColor: 'var(--badge-general-bg)',
                            color: 'var(--badge-general-text)',
                            borderColor: 'var(--badge-general-border)',
                          },
                        }

                        return (
                          <tr
                            key={`${item.id}-${idx}`}
                            style={{ borderColor: 'var(--border-subtle)' }}
                            className="transition-colors hover:bg-[var(--bg-subtle)]"
                          >
                            {/* Column 1: Category */}
                            <td className="px-3 py-2 align-top">
                              <span
                                style={catStyle.badgeStyle}
                                className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold"
                              >
                                {catStyle.label}
                              </span>
                            </td>

                            {/* Column 2: Extracted Parameter */}
                            <td className="px-3 py-2 align-top">
                              <span style={{ color: 'var(--text-primary)' }} className="block text-xs font-bold leading-snug">
                                {item.parameter}
                              </span>
                              {item.context && (
                                <span style={{ color: 'var(--text-secondary)' }} className="block text-[11px] leading-tight mt-0.5">
                                  {item.context}
                                </span>
                              )}
                            </td>

                            {/* Column 3: Value / Provision */}
                            <td className="max-w-md whitespace-normal break-words px-3 py-2 align-top">
                              <div style={{ color: 'var(--text-primary)' }} className="text-xs font-medium leading-relaxed">
                                {renderFormattedInline(cleanOcrRegex(item.value))}
                              </div>
                            </td>

                            {/* Column 4: Source Citation */}
                            <td className="px-3 py-2 align-top">
                              <button
                                type="button"
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('openPdfPage', {
                                    detail: { page: item.source.pageNumber },
                                  }))
                                  openSource(item.source, item.parameter)
                                }}
                                style={{
                                  backgroundColor: 'var(--bg-subtle)',
                                  borderColor: 'var(--border-subtle)',
                                  color: 'var(--text-secondary)',
                                }}
                                className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:text-[var(--text-primary)]"
                                title={`View in ${item.source.documentName} at page ${item.source.pageNumber}`}
                              >
                                <FileText className="h-3 w-3 text-teal shrink-0" />
                                <span className="truncate max-w-[120px]">{item.source.documentName}</span>
                                <span className="text-teal font-semibold shrink-0">· p. {item.source.pageNumber}</span>
                              </button>
                            </td>

                            {/* Column 5: Action */}
                            <td className="px-3 py-2 align-top text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.value, item.parameter)}
                                  style={{
                                    borderColor: 'var(--border-subtle)',
                                    backgroundColor: 'var(--bg-subtle)',
                                    color: 'var(--text-secondary)',
                                  }}
                                  className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition-colors hover:text-[var(--text-primary)] cursor-pointer"
                                  title="Copy parameter value"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-600" />
                                      <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openSource(item.source, item.parameter)}
                                  className="inline-flex items-center gap-1 rounded-full bg-teal px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-teal-dark cursor-pointer shadow-2xs"
                                  title="View page in document viewer"
                                >
                                  <Eye className="h-3 w-3" />
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
          {/* SECTION 3: EXECUTIVE SUMMARY                                   */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section
            id="analysis-section-summary"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              boxShadow: 'var(--card-shadow)',
            }}
            className="scroll-mt-4 space-y-3 rounded-xl border p-4 transition-all"
          >
            <div
              style={{ borderColor: 'var(--border-subtle)' }}
              className="flex flex-wrap items-center justify-between gap-2 border-b pb-2"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-teal shrink-0" />
                <h3 style={{ color: 'var(--text-primary)' }} className="text-sm font-bold">
                  3. Executive Summary
                </h3>
                <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium">
                  (AI-Grounded Synthesis)
                </span>
              </div>

              {synopsis.aiAnalysis && (
                <span
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                  className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                >
                  <Sparkles className="inline-block h-3 w-3 text-teal mr-1" />
                  {synopsis.aiAnalysis.provider} · {synopsis.aiAnalysis.model}
                </span>
              )}
            </div>

            {/* Full-Width Document Reading View */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
              className="rounded-lg border p-4"
            >
              <LegalMarkdownView content={synopsis.aiAnalysis?.executiveSummary || synopsis.executiveSynopsis} />
            </div>

            {/* Verified source passages */}
            {verifiedSourcesList.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="rounded-xl border p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--text-primary)' }} className="text-xs font-bold uppercase tracking-wider">
                    Verified Passages from Uploaded Records ({verifiedSourcesList.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {verifiedSourcesList.map((source, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-subtle)',
                      }}
                      className="rounded-lg border p-3 text-xs space-y-2 flex flex-col justify-between"
                    >
                      <p style={{ color: 'var(--text-primary)' }} className="italic line-clamp-3">
                        &ldquo;{cleanOcrText(source.quote || source.passage)}&rdquo;
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span
                          style={{
                            backgroundColor: 'var(--bg-subtle)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-secondary)',
                          }}
                          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px]"
                        >
                          <FileText className="h-3 w-3 text-teal" />
                          <span>{source.documentName} · p. {source.pageNumber}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => openSource(source)}
                          className="text-xs font-semibold text-teal hover:underline cursor-pointer"
                        >
                          View Page →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 4: UPLOADED DOCUMENTS & FILES                         */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <section
            id="analysis-section-documents"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              boxShadow: 'var(--card-shadow)',
            }}
            className="scroll-mt-4 rounded-xl border p-4 transition-all"
          >
            <div style={{ borderColor: 'var(--border-subtle)' }} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-teal shrink-0" />
                <h3 style={{ color: 'var(--text-primary)' }} className="text-sm font-bold">
                  4. Uploaded Documents &amp; Files
                </h3>
                <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium">
                  ({filteredDocuments.length} file{filteredDocuments.length === 1 ? '' : 's'})
                </span>
              </div>
            </div>

            {/* Compact list — one row per document */}
            <div style={{ borderColor: 'var(--border-subtle)' }} className="divide-y rounded-lg border overflow-hidden">
              {filteredDocuments.map((doc) => {
                const summary = synopsis.documentSummaries.find((item) => item.documentId === doc.id)
                const aiDocSummary = synopsis.aiAnalysis?.documentSummaries.find((item) => item.documentId === doc.id)
                const docIdx = filteredDocuments.indexOf(doc)

                return (
                  <div
                    key={doc.id}
                    style={{ backgroundColor: 'var(--bg-card)' }}
                    className="flex min-w-0 items-start gap-3 px-3 py-2.5 hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    {/* Icon */}
                    <FileText className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />

                    {/* Main content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openSource(summary?.summary ?? {
                            documentId: doc.id,
                            documentName: doc.originalName,
                            pageNumber: 1,
                            passage: 'Previewing document.',
                          })}
                          className="text-left text-xs font-bold text-teal hover:underline truncate max-w-[260px]"
                        >
                          {doc.originalName}
                        </button>
                        <span style={{ color: 'var(--text-muted)' }} className="text-[11px]">
                          {t(`docSummary.${docIdx}.apparentType`, summary?.apparentType || 'General Record')}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }} className="text-[11px]">
                          · {doc.pageCount ?? 1}p
                        </span>
                      </div>

                      {/* AI summary if present — single line clamp */}
                      {aiDocSummary && (
                        <p style={{ color: 'var(--text-secondary)' }} className="text-[11px] leading-snug mt-0.5 line-clamp-1">
                          {t(`aiDocSummary.${(synopsis.aiAnalysis?.documentSummaries ?? []).indexOf(aiDocSummary)}`, aiDocSummary.summary)}
                        </p>
                      )}

                      {/* Local snippet fallback */}
                      {!aiDocSummary && summary?.summary && (
                        <p style={{ color: 'var(--text-secondary)' }} className="text-[11px] leading-snug mt-0.5 line-clamp-1">
                          {cleanOcrText(t(`docSummary.${docIdx}.summary`, (summary.summary as { passage?: string })?.passage || ''))}
                        </p>
                      )}
                    </div>

                    {/* Status badge + preview link */}
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        style={{
                          backgroundColor: doc.processingStatus === 'complete' ? 'var(--badge-limitation-bg)' : 'var(--badge-compensation-bg)',
                          color: doc.processingStatus === 'complete' ? 'var(--badge-limitation-text)' : 'var(--badge-compensation-text)',
                          borderColor: doc.processingStatus === 'complete' ? 'var(--badge-limitation-border)' : 'var(--badge-compensation-border)',
                        }}
                        className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                      >
                        {doc.processingStatus === 'complete' ? 'Ready' : doc.processingStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => openSource(summary?.summary ?? {
                          documentId: doc.id,
                          documentName: doc.originalName,
                          pageNumber: 1,
                          passage: 'Previewing document.',
                        })}
                        style={{ color: 'var(--text-secondary)' }}
                        className="text-[11px] font-medium hover:text-teal cursor-pointer whitespace-nowrap"
                      >
                        Preview →
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
          <section
            id="analysis-section-facts"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              boxShadow: 'var(--card-shadow)',
            }}
            className="scroll-mt-4 space-y-3 rounded-xl border p-4 transition-all"
          >
            <div
              style={{ borderColor: 'var(--border-subtle)' }}
              className="flex items-center gap-2 border-b pb-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-teal shrink-0" />
              <h3 style={{ color: 'var(--text-primary)' }} className="text-sm font-bold">
                5. Key Facts &amp; Quotes Extracted
              </h3>
            </div>
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
          <section
            id="analysis-section-citations"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              boxShadow: 'var(--card-shadow)',
            }}
            className="scroll-mt-4 space-y-3 rounded-xl border p-4 transition-all"
          >
              <div
                style={{ borderColor: 'var(--border-subtle)' }}
                className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 mb-3"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                  <h3 style={{ color: 'var(--text-primary)' }} className="text-sm font-bold">
                    6. Page Citations &amp; Source Index
                  </h3>
                </div>
                <span
                  style={{
                    backgroundColor: 'var(--badge-limitation-bg)',
                    color: 'var(--badge-limitation-text)',
                    borderColor: 'var(--badge-limitation-border)',
                  }}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                >
                  <span aria-hidden="true">🟢</span>
                  {synopsis.sourceIndex.filter((s) => s.readable).length}/{synopsis.sourceIndex.length} Verified
                </span>
              </div>

              {synopsis.missingOrUnclear.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'var(--badge-compensation-bg)',
                    borderColor: 'var(--badge-compensation-border)',
                    color: 'var(--badge-compensation-text)',
                  }}
                  className="space-y-2 rounded-xl border p-4 text-xs"
                >
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
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
                <p style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium">No page references available.</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {synopsis.sourceIndex.map((source, index) => {
                    const pageFact = synopsis.facts.find(
                      (fact) => fact.documentId === source.documentId && fact.pageNumber === source.pageNumber
                    )
                    const category = categorizeLegalText(pageFact?.passage ?? '').category
                    const topicPresentation = {
                      JURISDICTION: { label: 'Jur.', border: 'border-l-red-500' },
                      COMPENSATION: { label: 'Comp.', border: 'border-l-amber-500' },
                      PROCEDURE: { label: 'Proc.', border: 'border-l-blue-500' },
                      LIMITATION: { label: 'Lim.', border: 'border-l-emerald-500' },
                      MERITS: { label: 'Merits', border: 'border-l-purple-500' },
                      GENERAL: { label: 'Gen.', border: 'border-l-slate-400' },
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
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-subtle)',
                        }}
                        className={`group flex min-w-0 cursor-pointer items-center gap-1.5 rounded-lg border border-l-2 px-2 py-1.5 text-left transition-colors hover:border-slate-400 ${topicPresentation.border}`}
                      >
                        <FileIcon className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-teal" />
                        <span style={{ color: 'var(--text-primary)' }} className="font-mono text-[11px] font-semibold tabular-nums shrink-0">
                          p.{source.pageNumber}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }} className="text-[10px] truncate hidden sm:block">
                          {topicPresentation.label}
                        </span>
                        <span
                          className={cn(
                            'ml-auto h-1.5 w-1.5 shrink-0 rounded-full',
                            source.readable ? 'bg-emerald-500' : 'bg-rose-500'
                          )}
                          title={source.readable ? 'Verified' : 'Needs review'}
                        />
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