'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldCheckIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, RefreshCwIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { SuretyBondPanel } from '@/components/bail/SuretyBondPanel'

export type ConditionWithOrder = {
  id: number
  caseId: number
  conditionText: string
  conditionType: string
  status: string
  orderId: number | null
  createdAt: string | null
  orderDate?: string | null
  orderType?: string | null
}

interface ComplianceEvent {
  id: number
  conditionId: number
  eventDate: string
  eventType: 'complied' | 'violated'
  note: string | null
  createdAt: string | null
}

interface ConditionsTableProps {
  conditions: ConditionWithOrder[]
  showEmpty?: boolean
  caseId?: number
}

const conditionTypeConfig: Record<string, { label: string; className: string }> = {
  surety:    { label: 'Surety',    className: 'bg-slate-50 text-slate-700 border-slate-200'     },
  reporting: { label: 'Reporting', className: 'bg-teal-50 text-teal-700 border-teal-200'         },
  travel:    { label: 'Travel',    className: 'bg-amber-50 text-amber-700 border-amber-200'       },
  activity:  { label: 'Activity',  className: 'bg-blue-50 text-blue-700 border-blue-200'         },
  other:     { label: 'Other',     className: 'bg-slate-100 text-slate-600 border-slate-200'     },
}

const conditionStatusConfig: Record<string, { label: string; className: string }> = {
  active:    { label: 'Active',    className: 'bg-emerald-100 text-emerald-700' },
  revoked:   { label: 'Revoked',   className: 'bg-rose-100 text-rose-700'       },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-600'     },
}

const orderTypeLabels: Record<string, string> = {
  bail_order:      'Bail Order',
  stay_order:      'Stay Order',
  framing_charges: 'Framing of Charges',
  sentence:        'Sentence',
  other:           'Other',
}

function CompliancePanel({ conditionId, caseId }: { conditionId: number; caseId: number }) {
  const [events, setEvents] = useState<ComplianceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))
  const [formType, setFormType] = useState<'complied' | 'violated'>('complied')
  const [formNote, setFormNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cases/${caseId}/conditions/${conditionId}/compliance`)
      if (res.ok) setEvents(await res.json())
    } finally {
      setLoading(false)
    }
  }, [caseId, conditionId])

  useEffect(() => { load() }, [load])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/cases/${caseId}/conditions/${conditionId}/compliance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventDate: formDate, eventType: formType, note: formNote || undefined }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to add event')
      }
      toast.success(`Compliance event recorded: ${formType}.`)
      setShowForm(false)
      setFormNote('')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-slate-50 border-t border-slate-100 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Compliance Log</span>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 transition-colors"
        >
          <PlusIcon className="w-3 h-3" />
          Add Event
        </button>
      </div>

      {showForm && (
        <div className="mb-3 rounded-md border border-slate-200 bg-white p-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
            />
            <div className="flex gap-1">
              {(['complied', 'violated'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormType(t)}
                  className={cn(
                    'rounded px-2 py-1 text-xs font-medium border transition-colors',
                    formType === t
                      ? t === 'complied' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-rose-400 bg-rose-50 text-rose-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  )}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <textarea
            placeholder="Optional note…"
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
            rows={2}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:outline-none resize-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-slate-700">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded bg-teal-600 px-3 py-1 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 py-1">
          <RefreshCwIcon className="w-3 h-3 animate-spin" /> Loading…
        </div>
      ) : events.length === 0 ? (
        <p className="text-xs text-slate-400 py-1">No compliance events recorded yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-start gap-2 text-xs">
              <span className={cn(
                'inline-flex shrink-0 rounded-full px-1.5 py-0.5 font-medium',
                ev.eventType === 'complied' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              )}>
                {ev.eventType === 'complied' ? '✓' : '✗'}
              </span>
              <div>
                <span className="font-medium text-slate-700">{ev.eventDate}</span>
                {ev.note && <span className="ml-1 text-slate-500">— {ev.note}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const STATUS_CYCLE: Record<string, 'active' | 'completed' | 'revoked'> = {
  active:    'completed',
  completed: 'revoked',
  revoked:   'active',
}

export function ConditionsTable({ conditions, showEmpty = true, caseId }: ConditionsTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [localStatuses, setLocalStatuses] = useState<Record<number, string>>({})
  const [togglingId, setTogglingId] = useState<number | null>(null)

  async function handleStatusToggle(conditionId: number, currentStatus: string) {
    if (!caseId) return
    const nextStatus = STATUS_CYCLE[currentStatus] ?? 'active'
    setTogglingId(conditionId)
    try {
      const res = await fetch(`/api/cases/${caseId}/conditions/${conditionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to update status')
      }
      setLocalStatuses((prev) => ({ ...prev, [conditionId]: nextStatus }))
      toast.success(`Condition status updated to ${nextStatus}.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setTogglingId(null)
    }
  }

  if (conditions.length === 0) {
    if (!showEmpty) return null
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShieldCheckIcon className="w-8 h-8 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">No bail or parole conditions recorded for this case</p>
        <p className="text-xs text-slate-400 mt-1">Conditions are added from judicial orders recorded on the case page.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <ShieldCheckIcon className="w-4 h-4 text-slate-500" />
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Bail / Parole Conditions ({conditions.length})
        </h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-slate-100">
            <th className="py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Condition</th>
            <th className="py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide w-28">Type</th>
            <th className="py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide w-24">Status</th>
            <th className="py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide w-44">Associated Order</th>
            {caseId && (
              <th className="py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide w-10"></th>
            )}
          </tr>
        </thead>
        <tbody>
          {conditions.map((c) => {
            const typeConfig = conditionTypeConfig[c.conditionType] ?? conditionTypeConfig.other
            const currentStatus = localStatuses[c.id] ?? c.status
            const statusCfgEntry = conditionStatusConfig[currentStatus] ?? conditionStatusConfig.active
            const orderLabel = c.orderType ? (orderTypeLabels[c.orderType] ?? c.orderType) : null
            const orderDate = c.orderDate
              ? new Date(c.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : null
            const isExpanded = expandedId === c.id
            const isToggling = togglingId === c.id

            return (
              <>
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-sm text-slate-700">{c.conditionText}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', typeConfig.className)}>
                      {typeConfig.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {caseId ? (
                      <button
                        onClick={() => handleStatusToggle(c.id, currentStatus)}
                        disabled={isToggling}
                        title="Click to cycle status"
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-opacity',
                          statusCfgEntry.className,
                          isToggling && 'opacity-60 cursor-not-allowed'
                        )}
                      >
                        {isToggling ? <RefreshCwIcon className="w-3 h-3 animate-spin" /> : null}
                        {statusCfgEntry.label}
                      </button>
                    ) : (
                      <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', statusCfgEntry.className)}>
                        {statusCfgEntry.label}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {orderLabel ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-slate-600">{orderLabel}</span>
                        {orderDate && <span className="text-xs text-slate-400">{orderDate}</span>}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  {caseId && (
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        className="inline-flex items-center justify-center rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title={isExpanded ? 'Hide compliance log' : 'Show compliance log'}
                      >
                        {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                      </button>
                    </td>
                  )}
                </tr>
                {caseId && isExpanded && (
                  <tr key={`${c.id}-compliance`}>
                    <td colSpan={5}>
                      <CompliancePanel conditionId={c.id} caseId={caseId} />
                      {c.conditionType === 'surety' && (
                        <SuretyBondPanel conditionId={c.id} caseId={caseId} />
                      )}
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
