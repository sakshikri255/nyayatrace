'use client'

import { useState } from 'react'
import { Shield, Clock, Edit2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { calculateUTPRelief } from '@/lib/analysis/utpRelief'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface UTPReliefCardProps {
  caseData: {
    id: number
    caseType: string
    remandDate?: string | null
    maxPunishmentYears?: number | null
    applicableLaw?: 'crpc' | 'bnss' | 'auto' | null
    chargesheetFiled?: number | null
  }
  onUpdate?: () => void
}

const RELEVANT_CASE_TYPES = ['criminal', 'bail', 'parole']

export function UTPReliefCard({ caseData, onUpdate }: UTPReliefCardProps) {
  const [openDialog, setOpenDialog] = useState(false)
  const [maxYears, setMaxYears] = useState(String(caseData.maxPunishmentYears ?? ''))
  const [saving, setSaving] = useState(false)

  // Only show for criminal / bail / parole
  if (!RELEVANT_CASE_TYPES.includes(caseData.caseType)) return null

  const utp = calculateUTPRelief({
    remandDate: caseData.remandDate,
    maxPunishmentYears: caseData.maxPunishmentYears,
    applicableLaw: caseData.applicableLaw,
    chargesheetFiled: caseData.chargesheetFiled,
  })

  const isEligible = utp.status === 'eligible'
  const isApproaching = utp.status === 'approaching'
  const isCounting = utp.status === 'not_yet'

  async function handleSave() {
    const parsed = parseFloat(maxYears)
    if (isNaN(parsed) || parsed <= 0) {
      toast.error('Enter a valid number of years (e.g. 7 for 7 years max sentence).')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPunishmentYears: parsed }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }
      toast.success('Maximum punishment years updated.')
      setOpenDialog(false)
      onUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error updating case')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border p-5 transition-all shadow-sm',
          isEligible
            ? 'border-rose-300 bg-gradient-to-br from-rose-50/80 via-white to-rose-100/40'
            : isApproaching
            ? 'border-amber-300 bg-gradient-to-br from-amber-50/80 via-white to-amber-100/40'
            : 'border-teal-200 bg-white'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg border shadow-xs',
                isEligible
                  ? 'border-rose-300 bg-rose-100 text-rose-700'
                  : isApproaching
                  ? 'border-amber-300 bg-amber-100 text-amber-700'
                  : 'border-teal-200 bg-teal-50 text-teal-700'
              )}
            >
              {isEligible ? (
                <AlertTriangle className="h-5 w-5" />
              ) : isApproaching ? (
                <Clock className="h-5 w-5" />
              ) : (
                <Shield className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">UTP Relief Tracker</h3>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                    isEligible
                      ? 'bg-rose-600 text-white animate-pulse'
                      : isApproaching
                      ? 'bg-amber-500 text-white'
                      : isCounting
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {utp.statusLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{utp.section}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenDialog(true)}
            className="h-8 gap-1.5 text-xs font-medium border-slate-300 hover:bg-slate-50"
          >
            <Edit2 className="h-3 w-3" />
            Configure
          </Button>
        </div>

        {/* Content */}
        <div className="mt-4">
          <p className="text-xs text-slate-600 leading-relaxed">{utp.legalGround}</p>

          {utp.thresholdDays !== null && utp.daysServed !== null ? (
            <div className="mt-4 space-y-2.5">
              {/* Progress bar */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Served: <strong className="text-slate-800">{utp.daysServed}d</strong> of{' '}
                  <strong className="text-slate-800">{utp.thresholdDays}d</strong> threshold
                </span>
                <span className="text-slate-500">
                  Max sentence: <strong className="text-slate-800">{caseData.maxPunishmentYears}yr</strong>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/60">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    isEligible
                      ? 'bg-rose-600'
                      : isApproaching
                      ? 'bg-amber-500'
                      : 'bg-teal-600'
                  )}
                  style={{ width: `${utp.progressPercent}%` }}
                />
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="rounded-md bg-slate-50 p-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Days Served</span>
                  <span className="font-medium text-slate-800">{utp.daysServed}</span>
                </div>
                <div className="rounded-md bg-slate-50 p-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Threshold</span>
                  <span className="font-medium text-slate-800">{utp.thresholdDays}d</span>
                </div>
                <div className="rounded-md bg-slate-50 p-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    {isEligible ? 'Status' : 'Remaining'}
                  </span>
                  <span
                    className={cn(
                      'font-medium',
                      isEligible ? 'text-rose-700' : isApproaching ? 'text-amber-700' : 'text-teal-700'
                    )}
                  >
                    {isEligible ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Eligible
                      </span>
                    ) : (
                      `${utp.daysRemaining}d`
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              <span>Set max punishment years to compute UTP relief eligibility under {utp.section}.</span>
              <Button
                variant="link"
                size="sm"
                onClick={() => setOpenDialog(true)}
                className="h-auto p-0 text-teal-700 font-semibold"
              >
                Configure &rarr;
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900">
              Configure UTP Relief
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm text-slate-700">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maximum Punishment (Years)
              </label>
              <input
                type="number"
                min={1}
                max={99}
                step={0.5}
                value={maxYears}
                onChange={(e) => setMaxYears(e.target.value)}
                placeholder="e.g. 7"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Enter the maximum imprisonment period for the most serious charge. Under BNSS 479,
                first-time offenders are eligible after <strong>one-third</strong>; under CrPC 436A after <strong>one-half</strong>.
              </p>
            </div>
            {/* Quick preset buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 7, 10].map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setMaxYears(String(y))}
                  className={cn(
                    'rounded-md border p-2 text-center text-xs font-medium transition-colors',
                    maxYears === String(y)
                      ? 'border-teal-600 bg-teal-50 text-teal-900'
                      : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  {y} yr
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button variant="outline" size="sm" onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-teal hover:bg-teal-light text-white">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
