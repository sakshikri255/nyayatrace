'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Clock, Edit2, ShieldAlert, InfoIcon } from 'lucide-react'
import { calculateStatutoryBail } from '@/lib/analysis/statutoryBail'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface StatutoryBailCardProps {
  caseData: {
    id: number
    caseNumber: string
    title: string
    remandDate?: string | null
    statutoryPeriodDays?: number | null
    chargesheetFiled?: number | null
    chargesheetDate?: string | null
    applicableLaw?: 'crpc' | 'bnss' | 'auto' | null
  }
  onUpdate?: () => void
  compact?: boolean
}

export function StatutoryBailCard({ caseData, onUpdate, compact = false }: StatutoryBailCardProps) {
  const [mounted, setMounted] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [remandDate, setRemandDate] = useState(caseData.remandDate ?? '')
  const [statutoryPeriod, setStatutoryPeriod] = useState(caseData.statutoryPeriodDays ?? 60)
  const [chargesheetFiled, setChargesheetFiled] = useState(Boolean(caseData.chargesheetFiled))
  const [chargesheetDate, setChargesheetDate] = useState(caseData.chargesheetDate ?? '')
  const [applicableLaw, setApplicableLaw] = useState<'crpc' | 'bnss' | 'auto'>(caseData.applicableLaw ?? 'auto')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const bail = calculateStatutoryBail({
    remandDate: caseData.remandDate,
    statutoryPeriodDays: caseData.statutoryPeriodDays,
    chargesheetFiled: caseData.chargesheetFiled,
    chargesheetDate: caseData.chargesheetDate,
    applicableLaw: caseData.applicableLaw,
  })

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            remandDate: remandDate || null,
            statutoryPeriodDays: Number(statutoryPeriod),
            chargesheetFiled: chargesheetFiled ? 1 : 0,
            chargesheetDate: chargesheetFiled && chargesheetDate ? chargesheetDate : null,
            applicableLaw,
          }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update custody record')
      }

      toast.success('Custody and statutory bail details updated.')
      setOpenDialog(false)
      onUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error updating case')
    } finally {
      setSaving(false)
    }
  }

  const isAccrued = bail.status === 'accrued'
  const isUrgent = bail.status === 'urgent'
  const isDelayed = bail.status === 'filed_delayed'

  if (compact) {
    if (!mounted) {
      return (
        <div className="h-10 w-full rounded-lg border border-slate-200 bg-white animate-pulse" />
      )
    }

    return (
      <div
        suppressHydrationWarning
        className={cn(
          'flex items-center justify-between rounded-lg border p-3 text-xs transition-all',
          isAccrued
            ? 'border-rose-400 bg-rose-50 text-rose-900 shadow-sm'
            : isUrgent
            ? 'border-amber-400 bg-amber-50 text-amber-900'
            : 'border-slate-200 bg-white text-slate-800'
        )}
      >
        <div className="flex items-center gap-2">
          {isAccrued ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600"></span>
            </span>
          ) : (
            <Clock className="h-4 w-4 text-slate-500" />
          )}
          <div>
            <span className="font-semibold">{bail.statusLabel}</span>
            <span className="ml-1 text-slate-500">({bail.statutorySection})</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpenDialog(true)}
          className="h-6 px-2 text-[11px] text-slate-600 hover:text-slate-900"
        >
          Edit
        </Button>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="relative min-h-[140px] animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/80 dark:shadow-md">
        <div className="h-4 w-48 bg-slate-200 rounded mb-2" />
        <div className="h-3 w-32 bg-slate-100 rounded" />
      </div>
    )
  }

  return (
    <>
      <div
        suppressHydrationWarning
        className={cn(
          'relative mb-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 p-5 transition-all shadow-sm dark:border-slate-700/80 dark:bg-slate-800/80 dark:shadow-md',
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg border shadow-xs',
                isAccrued
                  ? 'border-rose-300 bg-rose-100 text-rose-700'
                  : isUrgent
                  ? 'border-amber-300 bg-amber-100 text-amber-700'
                  : 'border-teal-200 bg-teal-50 text-teal-700'
              )}
            >
              {isAccrued ? (
                <ShieldAlert className="h-5 w-5" />
              ) : isUrgent ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Statutory Default Bail Tracker</h3>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                    isAccrued
                      ? 'bg-rose-600 text-white animate-pulse'
                      : isUrgent
                      ? 'bg-amber-500 text-white'
                      : isDelayed
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  )}
                >
                  {bail.statusLabel}
                </span>
              </div>
              <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">{bail.statutorySection}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenDialog(true)}
            className="h-8 gap-1.5 text-xs font-medium border-slate-300 hover:bg-slate-50"
          >
            <Edit2 className="h-3 w-3" />
            Configure Remand
          </Button>
        </div>

        {/* Content body */}
        <div className="mt-4">
          <p className="text-xs text-slate-600 leading-relaxed dark:text-slate-300">{bail.legalGround}</p>

          {bail.isCalculable ? (
            <div className="mt-4 space-y-2.5">
              {/* Progress bar */}
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                <span>
                  Custody: <strong className="text-slate-800 dark:text-slate-100">{bail.daysInCustody}</strong> of{' '}
                  <strong className="text-slate-800 dark:text-slate-100">{bail.statutoryPeriodDays}</strong> days
                </span>
                <span>
                  {bail.chargesheetFiled ? (
                    <span className="text-emerald-700 font-medium">Chargesheet Filed</span>
                  ) : (
                    <span>
                      Deadline:{' '}
                      <strong className="text-slate-800 dark:text-slate-100">{bail.deadlineDate ?? '—'}</strong>
                    </span>
                  )}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/60">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    isAccrued
                      ? 'bg-rose-600'
                      : isUrgent
                      ? 'bg-amber-500'
                      : bail.chargesheetFiled
                      ? 'bg-emerald-500'
                      : 'bg-teal-600'
                  )}
                  style={{ width: `${bail.progressPercent}%` }}
                />
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs dark:border-slate-700">
                <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900/70">
                  <span className="block text-[10px] font-medium uppercase text-slate-600 dark:text-slate-400">Remand Date</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{bail.remandDate ?? 'Not set'}</span>
                </div>
                <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900/70">
                  <span className="block text-[10px] font-medium uppercase text-slate-600 dark:text-slate-400">Statutory Limit</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{bail.statutoryPeriodDays} Days</span>
                </div>
                <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900/70">
                  <span className="block text-[10px] font-medium uppercase text-slate-600 dark:text-slate-400">Chargesheet Status</span>
                  <span
                    className={cn(
                      'font-medium',
                      bail.chargesheetFiled ? 'text-emerald-700' : isAccrued ? 'text-rose-700' : 'text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {bail.chargesheetFiled ? 'Submitted' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              <span>Set the date of first judicial remand to calculate mandatory statutory bail timeline.</span>
              <Button
                variant="link"
                size="sm"
                onClick={() => setOpenDialog(true)}
                className="h-auto p-0 text-teal-700 font-semibold"
              >
                Set Date &rarr;
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900">
              Configure Custody &amp; Statutory Bail
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm text-slate-700">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of First Judicial Remand
              </label>
              <input
                type="date"
                value={remandDate}
                onChange={(e) => setRemandDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                The date the accused was first produced and remanded by the Magistrate.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statutory Limitation Period
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatutoryPeriod(60)}
                  className={cn(
                    'rounded-md border p-2.5 text-left text-xs font-medium transition-colors',
                    statutoryPeriod === 60
                      ? 'border-teal-600 bg-teal-50 text-teal-900'
                      : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <div className="font-bold">60 Days</div>
                  <div className="text-[11px] text-slate-500">Offenses punishable &lt; 10 years</div>
                </button>
                <button
                  type="button"
                  onClick={() => setStatutoryPeriod(90)}
                  className={cn(
                    'rounded-md border p-2.5 text-left text-xs font-medium transition-colors',
                    statutoryPeriod === 90
                      ? 'border-teal-600 bg-teal-50 text-teal-900'
                      : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <div className="font-bold">90 Days</div>
                  <div className="text-[11px] text-slate-500">Death, life, or &ge; 10 years</div>
                </button>
              </div>
            </div>

            {/* Applicable Law toggle */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Applicable Law
                </label>
                <span title="BNSS applies to cases registered on or after 1 July 2024. CrPC applies to earlier cases. 'Auto' infers from remand date.">
                  <InfoIcon className="w-3 h-3 text-slate-400 cursor-help" />
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['auto', 'crpc', 'bnss'] as const).map((law) => (
                  <button
                    key={law}
                    type="button"
                    onClick={() => setApplicableLaw(law)}
                    className={cn(
                      'rounded-md border p-2 text-center text-xs font-medium transition-colors',
                      applicableLaw === law
                        ? 'border-teal-600 bg-teal-50 text-teal-900'
                        : 'border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <div className="font-bold uppercase">{law === 'auto' ? 'Auto' : law.toUpperCase()}</div>
                    <div className="text-[10px] text-slate-500">
                      {law === 'auto' ? 'Infer from date' : law === 'bnss' ? 'Post Jul 2024' : 'Pre Jul 2024'}
                    </div>
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Auto: BNSS if remand date ≥ 1 Jul 2024, CrPC otherwise.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={chargesheetFiled}
                  onChange={(e) => setChargesheetFiled(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Police Chargesheet / Final Report Filed
                </span>
              </label>

              {chargesheetFiled && (
                <div className="mt-3 pl-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Filing Chargesheet
                  </label>
                  <input
                    type="date"
                    value={chargesheetDate}
                    onChange={(e) => setChargesheetDate(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button variant="outline" size="sm" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-teal hover:bg-teal-light text-white">
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
