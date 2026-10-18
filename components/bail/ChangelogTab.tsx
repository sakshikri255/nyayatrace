'use client'

import { useEffect, useState, useCallback } from 'react'
import { HistoryIcon, RefreshCwIcon } from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { cn } from '@/lib/utils'

interface ChangelogEntry {
  id: number
  field: string
  oldValue: unknown
  newValue: unknown
  performedAt: string | null
}

const fieldLabels: Record<string, string> = {
  remandDate:                'Remand Date',
  statutoryPeriodDays:       'Statutory Period (Days)',
  chargesheetFiled:          'Chargesheet Filed',
  chargesheetDate:           'Chargesheet Date',
  applicableLaw:             'Applicable Law',
  paroleGrantDate:           'Parole Grant Date',
  paroleEndDate:             'Parole End Date',
  paroleReportingFrequency:  'Parole Reporting Frequency',
}

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (field === 'chargesheetFiled') return value === 1 || value === true ? 'Yes' : 'No'
  if (field === 'applicableLaw') return String(value).toUpperCase()
  if (field === 'paroleReportingFrequency') {
    const v = String(value)
    return v.charAt(0).toUpperCase() + v.slice(1)
  }
  return String(value)
}

interface ChangelogTabProps {
  caseId: number
}

export function ChangelogTab({ caseId }: ChangelogTabProps) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChangelog = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/changelog`)
      if (!res.ok) throw new Error('Failed to load changelog')
      const data = await res.json()
      setEntries(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => { fetchChangelog() }, [fetchChangelog])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-slate-400 gap-2">
        <RefreshCwIcon className="w-4 h-4 animate-spin" />
        Loading changelog…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-rose-600 font-medium">{error}</p>
        <button onClick={fetchChangelog} className="mt-2 text-xs text-teal-600 hover:underline">Retry</button>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <HistoryIcon className="w-8 h-8 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">No changes recorded yet</p>
        <p className="text-xs text-slate-400 mt-1">Field-level changes to bail and parole details will appear here.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{entries.length} change{entries.length !== 1 ? 's' : ''} recorded</p>
        <button onClick={fetchChangelog} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600 transition-colors">
          <RefreshCwIcon className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        {entries.map((entry, i) => {
          const ts = entry.performedAt
            ? (() => {
                const d = parseISO(entry.performedAt)
                return isValid(d) ? format(d, 'd MMM yyyy, HH:mm') : entry.performedAt
              })()
            : '—'

          return (
            <div
              key={entry.id}
              className={cn(
                'flex items-start gap-4 px-4 py-3 text-sm',
                i < entries.length - 1 && 'border-b border-slate-100'
              )}
            >
              <div className="shrink-0 mt-0.5">
                <HistoryIcon className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-800 text-xs">
                    {fieldLabels[entry.field] ?? entry.field}
                  </span>
                  <span className="text-xs text-slate-400">{ts}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                  <span className="rounded bg-rose-50 border border-rose-200 text-rose-700 px-1.5 py-0.5 font-mono">
                    {formatValue(entry.field, entry.oldValue)}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="rounded bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 font-mono">
                    {formatValue(entry.field, entry.newValue)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
