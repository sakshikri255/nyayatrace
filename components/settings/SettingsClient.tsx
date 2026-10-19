'use client'

import { useState, useEffect } from 'react'
import { Database, HardDrive, Cpu, Bot, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface HealthData {
  database: {
    sizeBytes: number
    tables: {
      cases: number
      documents: number
      pages: number
      findings: number
      hearings: number
    }
  }
  uploads: {
    sizeBytes: number
    orphanFileCount: number
  }
  ocr: {
    engTrainedDataFound: boolean
    engTrainedDataSizeBytes: number
    availableLanguages: string[]
  }
  ai: {
    gemini: { configured: boolean; model: string }
    openai: { configured: boolean; model: string }
    activeProvider: string
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function StatusDot({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
    : <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
}

function SectionCard({ icon: Icon, title, children, className }: {
  icon: typeof Database
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden', className)}>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export function SettingsClient() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadHealth() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/system/health')
      if (!res.ok) throw new Error('Health check failed')
      const json = await res.json() as HealthData
      setData(json)
    } catch {
      toast.error('Could not load system health data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadHealth() }, [])

  const d = data

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Settings &amp; System Health</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Database statistics, OCR engine status, and AI provider diagnostics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadHealth}
          disabled={refreshing}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* ── 1. Database & Storage ──────────────────────────────────── */}
          <SectionCard icon={Database} title="Database &amp; Storage">
            {d ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* DB file size */}
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">SQLite File</span>
                    <span className="text-base font-bold text-slate-800">{formatBytes(d.database.sizeBytes)}</span>
                  </div>
                  {/* Uploads size */}
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Uploads Dir</span>
                    <span className="text-base font-bold text-slate-800">{formatBytes(d.uploads.sizeBytes)}</span>
                  </div>
                  {/* Orphan files */}
                  <div className={cn(
                    'rounded-lg border p-3 text-xs',
                    d.uploads.orphanFileCount > 0
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  )}>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Orphan Files</span>
                    <div className="flex items-center gap-1.5">
                      {d.uploads.orphanFileCount > 0 && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                      <span className={cn('text-base font-bold', d.uploads.orphanFileCount > 0 ? 'text-amber-700' : 'text-slate-800')}>
                        {d.uploads.orphanFileCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table counts */}
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mb-2">Record Counts</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {Object.entries(d.database.tables).map(([table, cnt]) => (
                      <div key={table} className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-xs text-center">
                        <span className="text-slate-400 block text-[10px] capitalize font-medium mb-0.5">{table}</span>
                        <span className="font-bold text-slate-800">{cnt.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Storage bar */}
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mb-1.5">Storage Breakdown</p>
                  <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
                    {d.database.sizeBytes + d.uploads.sizeBytes > 0 && (
                      <>
                        <div
                          className="h-full bg-teal-500 transition-all"
                          style={{ width: `${Math.round((d.database.sizeBytes / (d.database.sizeBytes + d.uploads.sizeBytes)) * 100)}%` }}
                          title={`Database: ${formatBytes(d.database.sizeBytes)}`}
                        />
                        <div
                          className="h-full bg-violet-400 transition-all"
                          style={{ width: `${Math.round((d.uploads.sizeBytes / (d.database.sizeBytes + d.uploads.sizeBytes)) * 100)}%` }}
                          title={`Uploads: ${formatBytes(d.uploads.sizeBytes)}`}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-[11px]">
                    <span className="flex items-center gap-1 text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-teal-500 inline-block" />
                      Database ({formatBytes(d.database.sizeBytes)})
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-violet-400 inline-block" />
                      Uploads ({formatBytes(d.uploads.sizeBytes)})
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No data available.</p>
            )}
          </SectionCard>

          {/* ── 2. OCR Engine ─────────────────────────────────────────── */}
          <SectionCard icon={Cpu} title="OCR Engine Status">
            {d ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <StatusDot ok={d.ocr.engTrainedDataFound} />
                  <div className="text-xs flex-1">
                    <p className="font-semibold text-slate-800">
                      eng.traineddata
                      {d.ocr.engTrainedDataFound
                        ? ` — ${formatBytes(d.ocr.engTrainedDataSizeBytes)}`
                        : ' — Not found'}
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      {d.ocr.engTrainedDataFound
                        ? 'English OCR language pack present and ready.'
                        : 'Place eng.traineddata in /tessdata directory.'}
                    </p>
                  </div>
                </div>

                {d.ocr.availableLanguages.length > 0 && (
                  <div>
                    <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide mb-1.5">Available Language Packs</p>
                    <div className="flex flex-wrap gap-1.5">
                      {d.ocr.availableLanguages.map((lang) => (
                        <span key={lang} className="rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium bg-teal-50 text-teal-700 border border-teal-200">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No data available.</p>
            )}
          </SectionCard>

          {/* ── 3. AI Providers ───────────────────────────────────────── */}
          <SectionCard icon={Bot} title="AI Provider Diagnostics">
            {d ? (
              <div className="flex flex-col gap-3">
                {/* Active provider banner */}
                <div className={cn(
                  'rounded-lg border p-3 text-xs',
                  d.ai.activeProvider === 'none'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                )}>
                  {d.ai.activeProvider === 'none'
                    ? 'No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY in your .env.local file.'
                    : `Active provider: ${d.ai.activeProvider === 'gemini' ? 'Gemini (Google AI)' : 'OpenAI'}`}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Gemini */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <StatusDot ok={d.ai.gemini.configured} />
                      <span className="font-semibold text-slate-800">Gemini (Google AI)</span>
                    </div>
                    <p className="text-slate-500">
                      API Key: <strong className={d.ai.gemini.configured ? 'text-emerald-700' : 'text-rose-600'}>
                        {d.ai.gemini.configured ? 'Configured ✓' : 'Not configured'}
                      </strong>
                    </p>
                    <p className="text-slate-500 mt-0.5">Model: <span className="font-mono text-slate-700">{d.ai.gemini.model}</span></p>
                  </div>

                  {/* OpenAI */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <StatusDot ok={d.ai.openai.configured} />
                      <span className="font-semibold text-slate-800">OpenAI</span>
                    </div>
                    <p className="text-slate-500">
                      API Key: <strong className={d.ai.openai.configured ? 'text-emerald-700' : 'text-rose-600'}>
                        {d.ai.openai.configured ? 'Configured ✓' : 'Not configured'}
                      </strong>
                    </p>
                    <p className="text-slate-500 mt-0.5">Model: <span className="font-mono text-slate-700">{d.ai.openai.model}</span></p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No data available.</p>
            )}
          </SectionCard>

          {/* ── Disclaimer ────────────────────────────────────────────── */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <HardDrive className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500 leading-relaxed">
              NyayaTrace stores records locally in SQLite and uploaded files in the project&apos;s private uploads directory.
              It has no login or multi-user access control — use only public records or files you are authorised to process.
              No data is transmitted to external servers except for AI analysis requests to configured providers.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
