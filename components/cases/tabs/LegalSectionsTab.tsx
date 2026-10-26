'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Search,
  Sparkles,
  BarChart2,
  Scale,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle2,
  Gavel,
  RefreshCw,
  FileSearch,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { LEGAL_SECTIONS_DB, searchLegalSections, type LegalSectionMapping } from '@/lib/legal/sections'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ExtractedSectionFrequency } from '@/app/api/cases/[id]/legal-sections/extracted/route'
import type { DetectedSectionWithJudgments, DetectResponse } from '@/app/api/cases/[id]/legal-sections/detect/route'
import type { LandmarkJudgment } from '@/lib/legal/landmarkJudgments'

// ─── colour palette for law categories ───────────────────────────────────────
const LAW_COLORS: Record<string, string> = {
  IPC: '#6366f1',
  BNS: '#3b82f6',
  BNSS: '#0ea5e9',
  CrPC: '#8b5cf6',
  CRPC: '#8b5cf6',
  IEA: '#f59e0b',
  PMLA: '#ef4444',
  NDPS: '#f97316',
  POCSO: '#ec4899',
  '': '#64748b',
}

function lawColor(law: string): string {
  return LAW_COLORS[law.toUpperCase()] ?? '#64748b'
}

// ─── Custom tooltip for the bar chart ────────────────────────────────────────
interface TooltipPayload {
  payload?: { section: string; law: string; count: number; offense: string | undefined }
}
function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs max-w-[220px]">
      <p className="font-bold text-slate-800">
        Section {d.section} {d.law && <span className="text-slate-500">({d.law})</span>}
      </p>
      {d.offense && <p className="text-slate-600 mt-0.5 leading-snug">{d.offense}</p>}
      <p className="mt-1 font-semibold text-teal-700">
        Referenced {d.count}× in case documents
      </p>
    </div>
  )
}

// ─── Analytics card (graph) ──────────────────────────────────────────────────
function LegalSectionAnalyticsCard({
  caseId,
  refreshKey,
  onSectionClick,
}: {
  caseId: number
  refreshKey: number
  onSectionClick?: (key: string) => void
}) {
  const [data, setData] = useState<ExtractedSectionFrequency[] | null>(null)
  const [selectedSectionKey, setSelectedSectionKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sectionKey = (s: ExtractedSectionFrequency) => `${s.section}-${s.law}`

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/legal-sections/extracted`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as { results: ExtractedSectionFrequency[] }
      setData(json.results ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load section data')
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => { load() }, [load, refreshKey])

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-5 text-xs text-slate-400 mb-4">
        <BarChart2 className="w-4 h-4 animate-pulse text-teal" />
        Scanning document pages for statutory references…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 mb-4">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Could not load section analytics: {error}
        <button type="button" onClick={load} className="ml-2 font-semibold underline hover:text-red-900">Retry</button>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-500 mb-4">
        <FileSearch className="w-8 h-8 text-slate-300" />
        <p className="font-medium text-slate-700">No statutory references detected in uploaded documents.</p>
        <p className="text-slate-400 max-w-sm">Upload and process case documents to see a section-wise frequency chart derived from the actual document text.</p>
      </div>
    )
  }

  const top10 = data.slice(0, 10)

  // Prepare chart data — include offense name for the tooltip
  const chartData = top10.map((s) => ({
    section: s.section,
    law: s.law,
    count: s.count,
    offense: s.offense,
    fill: lawColor(s.law),
  }))

  // Group counts by law for the legend summary
  const lawSummary = top10.reduce<Record<string, number>>((acc, s) => {
    const l = s.law || 'Unknown'
    acc[l] = (acc[l] ?? 0) + s.count
    return acc
  }, {})

  const selectedSection = top10.find((s) => sectionKey(s) === selectedSectionKey)

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <BarChart2 className="w-4 h-4 text-teal" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800">Legal Sections Analytics</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Statutory references detected and counted from case document text (top {top10.length} of {data.length} unique)
          </p>
        </div>
        <span className="ml-auto shrink-0 text-xs text-slate-400">{data.length} unique section{data.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Law legend */}
      <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
        {Object.entries(lawSummary).map(([law, total]) => (
          <span
            key={law}
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
            style={{ borderColor: lawColor(law) + '60', color: lawColor(law), backgroundColor: lawColor(law) + '12' }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: lawColor(law) }}
            />
            {law || 'Unknown'} ({total} ref{total !== 1 ? 's' : ''})
          </span>
        ))}
      </div>

      {/* Chart */}
      <div className="px-4 pb-2 pt-2">
        <ResponsiveContainer width="100%" height={Math.max(140, top10.length * 28)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 4, right: 32, top: 2, bottom: 2 }}
            style={{ cursor: 'pointer' }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              label={{ value: 'Times referenced in case documents', position: 'insideBottomRight', offset: -4, fontSize: 9, fill: '#94a3b8' }}
            />
            <YAxis
              type="category"
              dataKey="section"
              tick={{ fontSize: 10, fill: '#475569' }}
              width={48}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: string) => `§${v}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
              onClick={(barData) => {
                const d = barData as unknown as { section: string; law: string }
                const key = `${d.section}-${d.law}`
                const next = selectedSectionKey === key ? null : key
                setSelectedSectionKey(next)
                onSectionClick?.(next ?? '')
              }}
            >
              {chartData.map((entry, idx) => {
                const k = `${entry.section}-${entry.law}`
                const isSelected = selectedSectionKey === k
                return (
                  <Cell
                    key={`cell-${idx}`}
                    fill={isSelected ? '#0f766e' : entry.fill}
                    opacity={selectedSectionKey && !isSelected ? 0.45 : 1}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Section filter pills */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter detected sections">
        {top10.map((item) => {
          const k = sectionKey(item)
          const isActive = selectedSectionKey === k
          return (
            <button
              key={k}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                const next = isActive ? null : k
                setSelectedSectionKey(next)
                onSectionClick?.(next ?? '')
              }}
              title={item.offense ?? `Section ${item.section}`}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors',
                isActive
                  ? 'text-white shadow-sm'
                  : 'bg-white hover:bg-slate-50'
              )}
              style={isActive
                ? { backgroundColor: lawColor(item.law), borderColor: lawColor(item.law) }
                : { borderColor: lawColor(item.law) + '80', color: lawColor(item.law) }
              }
            >
              §{item.section}
              {item.law && (
                <span className={isActive ? 'opacity-75' : 'opacity-60'}>{item.law}</span>
              )}
              <span className={cn('ml-0.5', isActive ? 'opacity-75' : 'opacity-50')}>×{item.count}</span>
            </button>
          )
        })}
        {selectedSectionKey && (
          <button
            type="button"
            onClick={() => { setSelectedSectionKey(null); onSectionClick?.('') }}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Drill-down: source passages for selected section */}
      {selectedSection && (
        <div className="mx-4 mb-4 rounded-lg border border-slate-200 bg-slate-50/70">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-800">
              Document extracts — Section {selectedSection.section}
              {selectedSection.law ? ` (${selectedSection.law})` : ''}
            </p>
            <Link
              href={selectedSection.concordanceHref}
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              View concordance →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {selectedSection.matches.slice(0, 5).map((match, i) => (
              <li
                key={`${match.documentId}-${match.pageNumber}-${i}`}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 px-3 py-2 text-xs"
              >
                <span className="font-mono text-slate-700 bg-white rounded px-1.5 py-0.5 border border-slate-200">
                  {match.passage}
                </span>
                <span className="text-slate-400 shrink-0">
                  {match.documentName} · p.{match.pageNumber}
                </span>
              </li>
            ))}
            {selectedSection.matches.length > 5 && (
              <li className="px-3 py-1.5 text-xs text-slate-400">
                +{selectedSection.matches.length - 5} more references
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Landmark judgment card ──────────────────────────────────────────────────
function JudgmentCard({ judgment }: { judgment: LandmarkJudgment }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
      >
        <Gavel className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 leading-snug">{judgment.caseName}</p>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {judgment.citation && (
              <span className="text-[10px] text-slate-500 font-mono">{judgment.citation}</span>
            )}
            <span className="text-[10px] text-slate-500">{judgment.court} · {judgment.year}</span>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        )}
      </button>

      {/* Key principle always visible */}
      <div className="px-3 pb-2.5 pt-0 border-t border-slate-50">
        <p className="text-[11px] text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-700">Key Principle: </span>
          {judgment.keyPrinciple}
        </p>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-3 space-y-2.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Facts &amp; Issue</p>
            <p className="text-xs text-slate-700 leading-relaxed">{judgment.factsAndIssue}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Court&apos;s Holding</p>
            <p className="text-xs text-slate-700 leading-relaxed">{judgment.holding}</p>
          </div>
          {judgment.relatedSections.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {judgment.relatedSections.map((rs) => (
                <span
                  key={rs}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700"
                >
                  {rs}
                </span>
              ))}
            </div>
          )}
          {judgment.verificationNote && (
            <p className="flex items-start gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              <Info className="w-3 h-3 shrink-0 mt-0.5" />
              {judgment.verificationNote}
            </p>
          )}
          {judgment.judgmentUrl ? (
            <a
              href={judgment.judgmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Read full judgment
            </a>
          ) : (
            <p className="text-[10px] text-slate-400 italic">Full text link not available</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Detected section card (with judgments) ──────────────────────────────────
function DetectedSectionCard({
  section,
  isHighlighted,
}: {
  section: DetectedSectionWithJudgments
  isHighlighted: boolean
}) {
  const [judgmentsOpen, setJudgmentsOpen] = useState(false)
  const isBailable = section.bailable === 'Bailable'

  return (
    <div
      id={`section-${section.section}-${section.law}`}
      className={cn(
        'rounded-xl border bg-white overflow-hidden transition-shadow',
        isHighlighted
          ? 'border-teal-400 shadow-md ring-1 ring-teal-300'
          : 'border-slate-200 shadow-xs hover:shadow-sm'
      )}
    >
      {/* Section header */}
      <div className="flex items-start gap-3 p-4">
        <div
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-center"
          style={{ backgroundColor: lawColor(section.law) + '15', border: `1px solid ${lawColor(section.law)}30` }}
        >
          <span className="block text-[10px] font-bold uppercase" style={{ color: lawColor(section.law) }}>
            {section.law || 'Section'}
          </span>
          <span className="block text-lg font-extrabold text-slate-800 leading-none mt-0.5">
            {section.section}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {section.offense ?? `Section ${section.section}`}
              </h3>
              {section.bailable && (
                <span
                  className={cn(
                    'inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                    isBailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  )}
                >
                  {section.bailable}
                </span>
              )}
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
              <span
                className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                style={{ borderColor: lawColor(section.law) + '60', color: lawColor(section.law), backgroundColor: lawColor(section.law) + '12' }}
              >
                ×{section.count} references
              </span>
            </div>
          </div>

          {/* Provision description */}
          {section.provisionDescription && (
            <p className="mt-2 text-[11px] text-slate-500 leading-relaxed bg-slate-50 rounded p-2 border border-slate-100">
              <strong className="text-slate-700">Provision: </strong>
              {section.provisionDescription}
            </p>
          )}

          {/* Relevance note — derived from actual document matches */}
          {section.caseRelevance && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-700">
              <FileSearch className="w-3 h-3 shrink-0 mt-0.5 text-slate-400" />
              <span>{section.caseRelevance}</span>
            </div>
          )}

          {/* Detection source & concordance */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Detected from document text
            </span>
            <Link
              href={section.concordanceHref}
              className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            >
              Legal concordance →
            </Link>
          </div>
        </div>
      </div>

      {/* Landmark Judgments section */}
      {section.landmarkJudgments.length > 0 && (
        <div className="border-t border-slate-100">
          <button
            type="button"
            onClick={() => setJudgmentsOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Scale className="w-3.5 h-3.5 text-slate-400" />
            Related Landmark Judgments
            <span className="ml-1 rounded-full bg-indigo-100 text-indigo-700 px-1.5 py-0.5 text-[10px] font-bold">
              {section.landmarkJudgments.length}
            </span>
            <span className="ml-auto text-slate-400 text-[10px] font-normal italic">
              Potentially relevant precedents — not automatically binding
            </span>
            {judgmentsOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
          </button>

          {judgmentsOpen && (
            <div className="px-4 pb-4 space-y-2">
              <p className="text-[10px] text-slate-400 italic mb-2 flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0" />
                These are curated, verifiable judgments from publicly reported sources. Citations confirmed against SCC/AIR. Evaluate applicability with your advocate.
              </p>
              {section.landmarkJudgments.map((j) => (
                <JudgmentCard key={j.id} judgment={j} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* No judgments notice */}
      {section.landmarkJudgments.length === 0 && (
        <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400 italic">
          No curated landmark judgments available for this section yet.
        </div>
      )}
    </div>
  )
}

// ─── Main Tab ────────────────────────────────────────────────────────────────
interface LegalSectionsTabProps {
  caseData: {
    id: number
    title: string
    caseType: string
  }
  documentTextSnippet?: string
}

export function LegalSectionsTab({ caseData }: LegalSectionsTabProps) {
  const [query, setQuery] = useState('')
  const [sections, setSections] = useState<LegalSectionMapping[]>(LEGAL_SECTIONS_DB)

  // Auto-detect state
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<DetectResponse | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)

  // Chart refresh key — incremented when detect succeeds
  const [chartRefreshKey, setChartRefreshKey] = useState(0)

  // Highlighted section key from chart interaction
  const [highlightedKey, setHighlightedKey] = useState<string>('')

  function handleSearch(val: string) {
    setQuery(val)
    setSections(val.trim() ? searchLegalSections(val) : LEGAL_SECTIONS_DB)
  }

  async function handleScanCase() {
    setScanning(true)
    setScanError(null)
    setScanResult(null)
    try {
      const res = await fetch(`/api/cases/${caseData.id}/legal-sections/detect`, {
        method: 'POST',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json() as DetectResponse
      setScanResult(data)
      // Refresh the chart with new data
      setChartRefreshKey((k) => k + 1)
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Auto-detect failed. Please try again.')
    } finally {
      setScanning(false)
    }
  }

  function handleReset() {
    setScanResult(null)
    setScanError(null)
    setSections(LEGAL_SECTIONS_DB)
    setQuery('')
    setHighlightedKey('')
  }

  // Scroll to highlighted section card
  useEffect(() => {
    if (!highlightedKey) return
    const [section, law] = highlightedKey.split('-')
    const el = document.getElementById(`section-${section}-${law}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightedKey])

  return (
    <div className="space-y-6">
      {/* ── A. Analytics Chart ─────────────────────────────────────────────── */}
      <LegalSectionAnalyticsCard
        caseId={caseData.id}
        refreshKey={chartRefreshKey}
        onSectionClick={(key) => setHighlightedKey(key)}
      />

      {/* ── B. Header & Controls ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-teal" />
            Statutory Transition Engine (IPC ↔ BNS / CrPC ↔ BNSS)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cross-map substantive offences and procedural powers under new Indian criminal laws.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {scanResult && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
          <Button
            size="sm"
            onClick={handleScanCase}
            disabled={scanning}
            className="gap-1.5 text-xs bg-teal hover:bg-teal-light text-white"
          >
            {scanning ? (
              <>
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                Detecting…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Auto-Detect from Case
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Scan status — purely local, should resolve in under a second */}
      {scanning && (
        <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs text-teal-900">
          <Sparkles className="w-3.5 h-3.5 animate-spin shrink-0" />
          Scanning document text for statutory references…
        </div>
      )}

      {scanError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Auto-detect failed</p>
            <p className="text-red-600 mt-0.5">{scanError}</p>
            <button
              type="button"
              onClick={handleScanCase}
              className="mt-1.5 font-semibold underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {scanResult && !scanning && (
        <>
          {/* Summary banner */}
          <div className="flex flex-wrap items-center justify-between rounded-lg bg-teal-50 border border-teal-200 p-3 text-xs text-teal-900 gap-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              Auto-detection identified{' '}
              <strong>{scanResult.totalSections}</strong> statutory provision{scanResult.totalSections !== 1 ? 's' : ''}{' '}
              from case document text.
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="font-semibold underline hover:text-teal-700"
            >
              Reset to All Sections
            </button>
          </div>

          {/* Warning (e.g. AI notes failed) */}
          {scanResult.warning && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {scanResult.warning}
            </div>
          )}

          {/* Empty state */}
          {scanResult.sections.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <FileSearch className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No statutory references found in document text</p>
              <p className="text-xs text-slate-400 max-w-md">
                The auto-detector searches extracted OCR text for patterns like &quot;Section 302 IPC&quot;, &quot;u/s 167(2)&quot;, &quot;Sec 187 BNSS&quot;.
                If no references were found, ensure documents have been fully processed (OCR completed).
              </p>
            </div>
          )}

          {/* C. Detected sections with judgments */}
          {scanResult.sections.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">Detected Legal Sections</h3>
                <span className="rounded-full bg-teal-100 text-teal-800 px-2 py-0.5 text-[10px] font-bold">
                  {scanResult.sections.length}
                </span>
              </div>
              {scanResult.sections.map((s) => (
                <DetectedSectionCard
                  key={`${s.section}-${s.law}`}
                  section={s}
                  isHighlighted={highlightedKey === `${s.section}-${s.law}`}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── D. Full Section Reference (unchanged when no scan active) ──────── */}
      {!scanResult && (
        <>
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by IPC section (e.g. 302, 420, 167), BNS equivalent, or offense (e.g. murder, default bail)..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal focus:outline-none"
            />
          </div>

          {sections.length === 0 && (
            <p className="text-sm text-center text-slate-400 py-8">No sections match your search.</p>
          )}

          {/* Section Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((item) => {
              const isBailable = item.bailable === 'Bailable'
              const isCognizable = item.cognizable === 'Cognizable'
              return (
                <div
                  key={`${item.ipcSection}-${item.bnsSection}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{item.offense}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Triable by: {item.triableBy}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          isBailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        )}
                      >
                        {item.bailable}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          isCognizable ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        )}
                      >
                        {item.cognizable}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">
                        Pre-2024 Law (IPC / CrPC)
                      </span>
                      <span className="block text-sm font-extrabold text-slate-800 mt-0.5">
                        Sec. {item.ipcSection}
                      </span>
                    </div>
                    <div className="rounded-lg bg-teal-50 border border-teal-200/80 p-2.5">
                      <span className="block text-[10px] font-bold uppercase text-teal-600">
                        New Law (BNS / BNSS)
                      </span>
                      <span className="block text-sm font-extrabold text-teal-900 mt-0.5">
                        Sec. {item.bnsSection}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <p>
                      <strong className="text-slate-800">Punishment:</strong> {item.punishment}
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-500 bg-slate-50 rounded p-2 border border-slate-100">
                      <strong className="text-slate-700">Key Ingredients:</strong> {item.keyElements}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
