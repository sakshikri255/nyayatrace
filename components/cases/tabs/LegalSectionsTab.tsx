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
  RotateCcw,
  FileSearch,
  ArrowRight,
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
import { cn } from '@/lib/utils'
import type { ExtractedSectionFrequency } from '@/app/api/cases/[id]/legal-sections/extracted/route'
import type { DetectedSectionWithJudgments, DetectResponse } from '@/app/api/cases/[id]/legal-sections/detect/route'
import type { LandmarkJudgment } from '@/lib/legal/landmarkJudgments'

// ─── Law colour palette ───────────────────────────────────────────────────────
const LAW_COLORS: Record<string, string> = {
  IPC:   '#6366f1',
  BNS:   '#0ea5e9',
  BNSS:  '#0284c7',
  CrPC:  '#8b5cf6',
  CRPC:  '#8b5cf6',
  IEA:   '#f59e0b',
  PMLA:  '#ef4444',
  NDPS:  '#f97316',
  POCSO: '#ec4899',
  '':    '#64748b',
}
function lawColor(law: string) { return LAW_COLORS[law.toUpperCase()] ?? '#64748b' }

// ─── Chart tooltip ────────────────────────────────────────────────────────────
interface TPayload { payload?: { section: string; law: string; count: number; offense?: string } }
function ChartTooltip({ active, payload }: { active?: boolean; payload?: TPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs max-w-xs">
      <p className="font-bold text-slate-800">§{d.section} <span className="font-normal text-slate-400">{d.law}</span></p>
      {d.offense && <p className="text-slate-500 mt-0.5">{d.offense}</p>}
      <p className="mt-1 font-semibold" style={{ color: lawColor(d.law) }}>
        Referenced {d.count}× in documents
      </p>
    </div>
  )
}

// ─── Analytics card ───────────────────────────────────────────────────────────
function AnalyticsCard({
  caseId, refreshKey, onSectionClick,
}: { caseId: number; refreshKey: number; onSectionClick?: (key: string) => void }) {
  const [data, setData]         = useState<ExtractedSectionFrequency[] | null>(null)
  const [active, setActive]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const key = (s: ExtractedSectionFrequency) => `${s.section}-${s.law}`

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await fetch(`/api/cases/${caseId}/legal-sections/extracted`)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setData(((await r.json()) as { results: ExtractedSectionFrequency[] }).results ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally { setLoading(false) }
  }, [caseId])

  useEffect(() => { load() }, [load, refreshKey])

  if (loading) return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-400">
      <BarChart2 className="w-4 h-4 animate-pulse text-teal-500 shrink-0" />
      Scanning document pages for statutory references…
    </div>
  )
  if (error) return (
    <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      {error}
      <button type="button" onClick={load} className="ml-auto text-xs font-semibold underline hover:text-red-900">Retry</button>
    </div>
  )
  if (!data || data.length === 0) return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
      <BarChart2 className="w-8 h-8 text-slate-200" />
      <p className="text-sm font-medium text-slate-600">No statutory references detected yet</p>
      <p className="text-xs text-slate-400 max-w-sm">Upload and process case documents to see a section-frequency chart drawn directly from the document text.</p>
    </div>
  )

  const top = data.slice(0, 10)
  const chartData = top.map(s => ({ section: s.section, law: s.law, count: s.count, offense: s.offense }))

  // law summary pills
  const lawTotals = top.reduce<Record<string, number>>((acc, s) => {
    const l = s.law || 'Other'; acc[l] = (acc[l] ?? 0) + s.count; return acc
  }, {})

  const selected = top.find(s => key(s) === active)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
            <BarChart2 className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Section Frequency</p>
            <p className="text-xs text-slate-400">From extracted document text — top {top.length} of {data.length}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(lawTotals).map(([law, total]) => (
            <span key={law}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
              style={{ borderColor: lawColor(law)+'50', color: lawColor(law), backgroundColor: lawColor(law)+'10' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lawColor(law) }} />
              {law} · {total}
            </span>
          ))}
        </div>
      </div>

      {/* chart */}
      <div className="px-5 pt-4 pb-2">
        <ResponsiveContainer width="100%" height={Math.max(120, top.length * 30)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 28, top: 0, bottom: 0 }} style={{ cursor: 'pointer' }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="section" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} width={44} axisLine={false} tickLine={false} tickFormatter={(v: string) => `§${v}`} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="count" radius={[0, 5, 5, 0]} maxBarSize={16}
              onClick={(bd) => {
                const d = bd as unknown as { section: string; law: string }
                const k = `${d.section}-${d.law}`
                const next = active === k ? null : k
                setActive(next)
                onSectionClick?.(next ?? '')
              }}
            >
              {chartData.map((entry, i) => {
                const k = `${entry.section}-${entry.law}`
                const sel = active === k
                return <Cell key={i} fill={sel ? '#0f766e' : lawColor(entry.law)} opacity={active && !sel ? 0.35 : 1} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* pills */}
      <div className="px-5 pb-4 flex flex-wrap gap-1.5">
        {top.map(item => {
          const k = key(item); const sel = active === k
          return (
            <button key={k} type="button"
              onClick={() => { const n = sel ? null : k; setActive(n); onSectionClick?.(n ?? '') }}
              title={item.offense}
              className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-all', sel ? 'text-white shadow' : 'bg-white hover:opacity-80')}
              style={sel ? { backgroundColor: lawColor(item.law), borderColor: lawColor(item.law) } : { borderColor: lawColor(item.law)+'70', color: lawColor(item.law) }}
            >
              §{item.section} {item.law && <span className="opacity-70">{item.law}</span>}
              <span className="ml-0.5 opacity-60">×{item.count}</span>
            </button>
          )
        })}
        {active && (
          <button type="button" onClick={() => { setActive(null); onSectionClick?.('') }}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* drill-down */}
      {selected && (
        <div className="mx-5 mb-5 rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-700">
              Passages — §{selected.section} {selected.law}
            </span>
            <Link href={selected.concordanceHref} className="text-[11px] font-semibold text-teal-600 hover:text-teal-800 hover:underline flex items-center gap-0.5">
              Concordance <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 bg-white">
            {selected.matches.slice(0, 5).map((m, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-4 py-2 text-xs">
                <code className="font-mono text-slate-700 bg-slate-50 rounded px-1.5 py-0.5 border border-slate-200 text-[11px]">{m.passage}</code>
                <span className="shrink-0 text-slate-400">{m.documentName} · p.{m.pageNumber}</span>
              </li>
            ))}
            {selected.matches.length > 5 && (
              <li className="px-4 py-2 text-[11px] text-slate-400">+{selected.matches.length - 5} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Judgment card ────────────────────────────────────────────────────────────
function JudgmentCard({ j }: { j: LandmarkJudgment }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50/80 transition-colors"
      >
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50">
          <Gavel className="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 leading-snug">{j.caseName}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {j.citation && <span className="font-mono mr-2">{j.citation}</span>}
            {j.court} · {j.year}
          </p>
        </div>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />}
      </button>

      <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/40">
        <p className="text-[11px] text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-700">Key principle — </span>{j.keyPrinciple}
        </p>
      </div>

      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">
          <div className="px-4 py-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Facts &amp; Issue</p>
            <p className="text-xs text-slate-600 leading-relaxed">{j.factsAndIssue}</p>
          </div>
          <div className="px-4 py-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Court&apos;s Holding</p>
            <p className="text-xs text-slate-600 leading-relaxed">{j.holding}</p>
          </div>
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {j.relatedSections.map(rs => (
                <span key={rs} className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">{rs}</span>
              ))}
            </div>
            {j.judgmentUrl ? (
              <a href={j.judgmentUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-800 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Read judgment
              </a>
            ) : (
              <span className="text-[10px] text-slate-300 italic">No link available</span>
            )}
          </div>
          {j.verificationNote && (
            <div className="px-4 py-2.5 flex items-start gap-2 bg-amber-50/60">
              <Info className="w-3 h-3 shrink-0 mt-0.5 text-amber-500" />
              <p className="text-[10px] text-amber-700 leading-snug">{j.verificationNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Detected section card ────────────────────────────────────────────────────
function SectionCard({ s, highlighted }: { s: DetectedSectionWithJudgments; highlighted: boolean }) {
  const [open, setOpen] = useState(false)
  const bailable = s.bailable === 'Bailable'

  return (
    <div id={`section-${s.section}-${s.law}`}
      className={cn(
        'rounded-2xl border bg-white overflow-hidden transition-all duration-200',
        highlighted ? 'border-teal-400 ring-2 ring-teal-200 shadow-md' : 'border-slate-200 shadow-sm hover:shadow-md'
      )}
    >
      {/* top bar */}
      <div className="flex items-stretch">
        {/* section badge */}
        <div className="flex flex-col items-center justify-center px-4 py-4 shrink-0 border-r border-slate-100"
          style={{ backgroundColor: lawColor(s.law)+'0d' }}
        >
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: lawColor(s.law) }}>{s.law || '§'}</span>
          <span className="text-2xl font-black text-slate-800 leading-none mt-0.5">{s.section}</span>
          <span className="mt-1 text-[9px] font-semibold text-slate-400">×{s.count}</span>
        </div>

        {/* main info */}
        <div className="flex-1 min-w-0 px-4 py-3.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 leading-snug">{s.offense ?? `Section ${s.section}`}</h3>
            <div className="flex items-center gap-1.5 shrink-0">
              {s.bailable && (
                <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                  bailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                )}>
                  {s.bailable}
                </span>
              )}
            </div>
          </div>

          {s.provisionDescription && (
            <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed line-clamp-2">{s.provisionDescription}</p>
          )}

          {s.caseRelevance && (
            <div className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1.5">
              <FileSearch className="w-3 h-3 shrink-0 mt-0.5 text-slate-400" />
              <p className="text-[11px] text-slate-600 leading-snug">{s.caseRelevance}</p>
            </div>
          )}

          <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Detected from document text
            </span>
            <Link href={s.concordanceHref} className="font-semibold text-teal-600 hover:text-teal-800 hover:underline inline-flex items-center gap-0.5">
              Concordance <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* judgments toggle */}
      <button type="button" onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center gap-2.5 px-4 py-3 text-left border-t transition-colors',
          open ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50/60 border-slate-100 hover:bg-slate-50'
        )}
      >
        <Scale className={cn('w-4 h-4 shrink-0', open ? 'text-indigo-500' : 'text-slate-400')} />
        <span className={cn('text-xs font-semibold', open ? 'text-indigo-700' : 'text-slate-600')}>
          Related Landmark Judgments
        </span>
        {s.landmarkJudgments.length > 0 ? (
          <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', open ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-600')}>
            {s.landmarkJudgments.length}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 italic">none available</span>
        )}
        <span className="ml-auto text-[10px] text-slate-400 italic hidden sm:inline">
          Potentially relevant precedents — not automatically binding
        </span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
      </button>

      {open && s.landmarkJudgments.length > 0 && (
        <div className="border-t border-indigo-100 bg-indigo-50/30 px-4 py-4 space-y-3">
          <p className="flex items-center gap-1.5 text-[10px] text-slate-400 italic">
            <Info className="w-3 h-3 shrink-0" />
            Curated from publicly reported SCC / AIR sources. Confirm applicability with your advocate.
          </p>
          {s.landmarkJudgments.map(j => <JudgmentCard key={j.id} j={j} />)}
        </div>
      )}
    </div>
  )
}

// ─── Reference grid card (IPC ↔ BNS) ─────────────────────────────────────────
function ReferenceCard({ item }: { item: LegalSectionMapping }) {
  const bailable   = item.bailable === 'Bailable'
  const cognizable = item.cognizable === 'Cognizable'

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-slate-300 hover:shadow-md transition-all duration-200">
      {/* title row */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.offense}</h3>
          <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
            <span className={cn('rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider',
              bailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            )}>{item.bailable}</span>
            <span className={cn('rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider',
              cognizable ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
            )}>{item.cognizable}</span>
          </div>
        </div>
        <p className="mt-1 text-[10px] text-slate-400">Triable by: {item.triableBy}</p>
      </div>

      {/* IPC ↔ BNS mapping */}
      <div className="grid grid-cols-2 divide-x divide-slate-100">
        <div className="px-3 py-3 bg-slate-50/60">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">IPC / CrPC</p>
          <p className="text-base font-black text-slate-800">§{item.ipcSection}</p>
        </div>
        <div className="px-3 py-3 bg-teal-50/60">
          <p className="text-[9px] font-black uppercase tracking-widest text-teal-500 mb-1">BNS / BNSS</p>
          <p className="text-base font-black text-teal-800">§{item.bnsSection}</p>
        </div>
      </div>

      {/* details */}
      <div className="px-4 py-3 space-y-2 border-t border-slate-100">
        <p className="text-xs text-slate-700">
          <span className="font-semibold text-slate-800">Punishment:</span>{' '}
          <span className="text-slate-500">{item.punishment}</span>
        </p>
        <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-3 py-2">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Key Ingredients</p>
          <p className="text-[11px] text-slate-600 leading-relaxed">{item.keyElements}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
interface LegalSectionsTabProps {
  caseData: { id: number; title: string; caseType: string }
  documentTextSnippet?: string
}

export function LegalSectionsTab({ caseData }: LegalSectionsTabProps) {
  const [query,       setQuery]       = useState('')
  const [sections,    setSections]    = useState<LegalSectionMapping[]>(LEGAL_SECTIONS_DB)
  const [scanning,    setScanning]    = useState(false)
  const [scanResult,  setScanResult]  = useState<DetectResponse | null>(null)
  const [scanError,   setScanError]   = useState<string | null>(null)
  const [refreshKey,  setRefreshKey]  = useState(0)
  const [highlighted, setHighlighted] = useState('')

  function handleSearch(v: string) {
    setQuery(v)
    setSections(v.trim() ? searchLegalSections(v) : LEGAL_SECTIONS_DB)
  }

  async function handleScan() {
    setScanning(true); setScanError(null); setScanResult(null)
    try {
      const r = await fetch(`/api/cases/${caseData.id}/legal-sections/detect`, { method: 'POST' })
      if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? `HTTP ${r.status}`)
      setScanResult(await r.json() as DetectResponse)
      setRefreshKey(k => k + 1)
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Auto-detect failed. Please try again.')
    } finally { setScanning(false) }
  }

  function handleReset() {
    setScanResult(null); setScanError(null); setSections(LEGAL_SECTIONS_DB); setQuery(''); setHighlighted('')
  }

  useEffect(() => {
    if (!highlighted) return
    const [sec, law] = highlighted.split('-')
    document.getElementById(`section-${sec}-${law}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlighted])

  return (
    <div className="space-y-5">

      {/* ── 1. Analytics chart ───────────────────────────────────────────────── */}
      <AnalyticsCard caseId={caseData.id} refreshKey={refreshKey} onSectionClick={k => setHighlighted(k)} />

      {/* ── 2. Top bar: title + action button ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50">
            <BookOpen className="h-4.5 w-4.5 text-teal-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight">Statutory Transition Engine</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">IPC ↔ BNS &nbsp;·&nbsp; CrPC ↔ BNSS cross-mapping</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {scanResult && (
            <button type="button" onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
          <button type="button" onClick={handleScan} disabled={scanning}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Sparkles className={cn('h-3.5 w-3.5', scanning && 'animate-spin')} />
            {scanning ? 'Detecting…' : 'Auto-Detect from Case'}
          </button>
        </div>
      </div>

      {/* scan feedback */}
      {scanning && (
        <div className="flex items-center gap-2.5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs text-teal-800">
          <Sparkles className="w-3.5 h-3.5 animate-spin shrink-0 text-teal-500" />
          Scanning document text for statutory references…
        </div>
      )}

      {scanError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div>
            <p className="font-semibold">Auto-detect failed</p>
            <p className="text-red-500 mt-0.5">{scanError}</p>
            <button type="button" onClick={handleScan} className="mt-1.5 font-semibold underline hover:text-red-900">Try again</button>
          </div>
        </div>
      )}

      {/* ── 3. Scan results ──────────────────────────────────────────────────── */}
      {scanResult && !scanning && (
        <>
          {/* result banner */}
          <div className="flex flex-wrap items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs text-teal-800 gap-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
              <span>
                Found <strong className="text-teal-900">{scanResult.totalSections}</strong>{' '}
                statutory provision{scanResult.totalSections !== 1 ? 's' : ''} in case documents
              </span>
            </span>
            <button type="button" onClick={handleReset} className="font-semibold text-teal-600 hover:text-teal-900 hover:underline">
              Reset to full reference →
            </button>
          </div>

          {scanResult.warning && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />{scanResult.warning}
            </div>
          )}

          {scanResult.sections.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <FileSearch className="w-10 h-10 text-slate-200" />
              <p className="text-sm font-semibold text-slate-600">No statutory references found in document text</p>
              <p className="text-xs text-slate-400 max-w-sm">
                The detector looks for patterns like &quot;Section 302 IPC&quot;, &quot;u/s 167(2)&quot;, &quot;Sec 187 BNSS&quot; in extracted OCR text.
                Make sure documents have been fully processed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-800">Detected Sections</p>
                <span className="rounded-full bg-teal-100 text-teal-700 px-2 py-0.5 text-[10px] font-bold">{scanResult.sections.length}</span>
              </div>
              {scanResult.sections.map(s => (
                <SectionCard key={`${s.section}-${s.law}`} s={s} highlighted={highlighted === `${s.section}-${s.law}`} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── 4. Full reference (no scan active) ───────────────────────────────── */}
      {!scanResult && (
        <>
          {/* search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text" value={query} onChange={e => handleSearch(e.target.value)}
              placeholder="Search by section number (302, 420), BNS equivalent, or offense (murder, default bail)…"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-100 focus:outline-none transition-colors"
            />
          </div>

          {sections.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400">No sections match &quot;{query}&quot;</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map(item => <ReferenceCard key={`${item.ipcSection}-${item.bnsSection}`} item={item} />)}
          </div>
        </>
      )}
    </div>
  )
}
