'use client'

import { useState } from 'react'
import { CalendarIcon, Edit2, ClipboardListIcon } from 'lucide-react'
import { differenceInDays, parseISO, isValid, format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ParoleTimelineCardProps {
  caseData: {
    id: number
    paroleGrantDate?: string | null
    paroleEndDate?: string | null
    paroleReportingFrequency?: 'weekly' | 'fortnightly' | 'monthly' | null
  }
  onUpdate?: () => void
  compact?: boolean
}

const frequencyLabels: Record<string, string> = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
}

function computeParoleStatus(endDate: string | null | undefined) {
  if (!endDate) return null
  const end = parseISO(endDate)
  if (!isValid(end)) return null
  const today = new Date()
  const daysLeft = differenceInDays(end, today)
  return { daysLeft, expired: daysLeft < 0 }
}

export function ParoleTimelineCard({ caseData, onUpdate, compact = false }: ParoleTimelineCardProps) {
  const [openDialog, setOpenDialog] = useState(false)
  const [paroleGrantDate, setParoleGrantDate] = useState(caseData.paroleGrantDate ?? '')
  const [paroleEndDate, setParoleEndDate] = useState(caseData.paroleEndDate ?? '')
  const [reportingFrequency, setReportingFrequency] = useState<'weekly' | 'fortnightly' | 'monthly'>(
    caseData.paroleReportingFrequency ?? 'monthly'
  )
  const [saving, setSaving] = useState(false)

  const status = computeParoleStatus(caseData.paroleEndDate)
  const isExpired = status?.expired === true
  const isExpiringSoon = status !== null && !isExpired && (status.daysLeft ?? 999) <= 7

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paroleGrantDate: paroleGrantDate || null,
          paroleEndDate: paroleEndDate || null,
          paroleReportingFrequency: reportingFrequency,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update parole details')
      }
      toast.success('Parole supervision details updated.')
      setOpenDialog(false)
      onUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error updating case')
    } finally {
      setSaving(false)
    }
  }

  const formattedGrant = caseData.paroleGrantDate
    ? (() => {
        const d = parseISO(caseData.paroleGrantDate)
        return isValid(d) ? format(d, 'd MMM yyyy') : caseData.paroleGrantDate
      })()
    : null
  const formattedEnd = caseData.paroleEndDate
    ? (() => {
        const d = parseISO(caseData.paroleEndDate)
        return isValid(d) ? format(d, 'd MMM yyyy') : caseData.paroleEndDate
      })()
    : null

  // ── Compact mode ──────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-between rounded-lg border p-3 text-xs transition-all',
          isExpired
            ? 'border-rose-400 bg-rose-50 text-rose-900'
            : isExpiringSoon
            ? 'border-amber-400 bg-amber-50 text-amber-900'
            : 'border-violet-200 bg-violet-50 text-violet-900'
        )}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <div>
            {status ? (
              isExpired ? (
                <span className="font-semibold">Parole Expired</span>
              ) : (
                <span className="font-semibold">{status.daysLeft} days until parole ends</span>
              )
            ) : (
              <span className="text-violet-600 font-semibold">Parole — supervision period not set</span>
            )}
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
        {openDialog && <ParoleDialog
          paroleGrantDate={paroleGrantDate} setParoleGrantDate={setParoleGrantDate}
          paroleEndDate={paroleEndDate} setParoleEndDate={setParoleEndDate}
          reportingFrequency={reportingFrequency} setReportingFrequency={setReportingFrequency}
          openDialog={openDialog} setOpenDialog={setOpenDialog}
          saving={saving} handleSave={handleSave}
        />}
      </div>
    )
  }

  // ── Full mode ─────────────────────────────────────────────────────────────
  const supervisionDays = caseData.paroleGrantDate && caseData.paroleEndDate
    ? (() => {
        const g = parseISO(caseData.paroleGrantDate)
        const e = parseISO(caseData.paroleEndDate)
        return isValid(g) && isValid(e) ? differenceInDays(e, g) : null
      })()
    : null

  const progressPercent = supervisionDays && status
    ? Math.min(100, Math.max(0, Math.round(((supervisionDays - Math.max(0, status.daysLeft)) / supervisionDays) * 100)))
    : 0

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border p-5 transition-all shadow-sm',
          isExpired
            ? 'border-rose-300 bg-gradient-to-br from-rose-50/80 via-white to-rose-100/40'
            : isExpiringSoon
            ? 'border-amber-300 bg-gradient-to-br from-amber-50/80 via-white to-amber-100/40'
            : 'border-violet-200 bg-gradient-to-br from-violet-50/60 via-white to-violet-50/20'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg border shadow-xs',
                isExpired
                  ? 'border-rose-300 bg-rose-100 text-rose-700'
                  : 'border-violet-300 bg-violet-100 text-violet-700'
              )}
            >
              <ClipboardListIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Parole Supervision Timeline</h3>
                {status ? (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                      isExpired ? 'bg-rose-600 text-white' :
                      isExpiringSoon ? 'bg-amber-500 text-white' :
                      'bg-violet-600 text-white'
                    )}
                  >
                    {isExpired ? 'Expired' : isExpiringSoon ? `${status.daysLeft}d left` : `${status.daysLeft} days left`}
                  </span>
                ) : (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-slate-100 text-slate-600">
                    Not Configured
                  </span>
                )}
                {caseData.paroleReportingFrequency && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-violet-100 text-violet-700 border border-violet-200">
                    {frequencyLabels[caseData.paroleReportingFrequency]} Reporting
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Supervision period and compliance schedule</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenDialog(true)}
            className="h-8 gap-1.5 text-xs font-medium border-slate-300 hover:bg-slate-50"
          >
            <Edit2 className="h-3 w-3" />
            Configure Parole
          </Button>
        </div>

        {/* Content */}
        <div className="mt-4">
          {status && supervisionDays ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Grant: <strong className="text-slate-800">{formattedGrant ?? '—'}</strong>
                </span>
                <span>
                  Ends: <strong className={cn(isExpired ? 'text-rose-700' : 'text-slate-800')}>{formattedEnd ?? '—'}</strong>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/60">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    isExpired ? 'bg-rose-600' : isExpiringSoon ? 'bg-amber-500' : 'bg-violet-600'
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="rounded-md bg-slate-50 p-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Grant Date</span>
                  <span className="font-medium text-slate-800">{formattedGrant ?? 'Not set'}</span>
                </div>
                <div className="rounded-md bg-slate-50 p-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">End Date</span>
                  <span className={cn('font-medium', isExpired ? 'text-rose-700' : 'text-slate-800')}>{formattedEnd ?? 'Not set'}</span>
                </div>
                <div className="rounded-md bg-slate-50 p-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reporting</span>
                  <span className="font-medium text-violet-700">
                    {caseData.paroleReportingFrequency ? frequencyLabels[caseData.paroleReportingFrequency] : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-violet-50 border border-violet-100 p-3 text-xs text-violet-700">
              <span>Set the parole grant date and end date to track supervision period.</span>
              <Button
                variant="link"
                size="sm"
                onClick={() => setOpenDialog(true)}
                className="h-auto p-0 text-violet-700 font-semibold"
              >
                Set Dates →
              </Button>
            </div>
          )}
        </div>
      </div>

      <ParoleDialog
        paroleGrantDate={paroleGrantDate} setParoleGrantDate={setParoleGrantDate}
        paroleEndDate={paroleEndDate} setParoleEndDate={setParoleEndDate}
        reportingFrequency={reportingFrequency} setReportingFrequency={setReportingFrequency}
        openDialog={openDialog} setOpenDialog={setOpenDialog}
        saving={saving} handleSave={handleSave}
      />
    </>
  )
}

// ── Dialog extracted to avoid duplication ────────────────────────────────────
function ParoleDialog({
  paroleGrantDate, setParoleGrantDate,
  paroleEndDate, setParoleEndDate,
  reportingFrequency, setReportingFrequency,
  openDialog, setOpenDialog,
  saving, handleSave,
}: {
  paroleGrantDate: string; setParoleGrantDate: (v: string) => void
  paroleEndDate: string; setParoleEndDate: (v: string) => void
  reportingFrequency: 'weekly' | 'fortnightly' | 'monthly'; setReportingFrequency: (v: 'weekly' | 'fortnightly' | 'monthly') => void
  openDialog: boolean; setOpenDialog: (v: boolean) => void
  saving: boolean; handleSave: () => void
}) {
  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-900">
            Configure Parole Supervision
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 text-sm text-slate-700">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Parole Grant Date</label>
            <input
              type="date"
              value={paroleGrantDate}
              onChange={(e) => setParoleGrantDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-violet-600 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">Date the parole was granted by the authority.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Parole End Date</label>
            <input
              type="date"
              value={paroleEndDate}
              onChange={(e) => setParoleEndDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-violet-600 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">Date by which the parolee must surrender.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Reporting Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {(['weekly', 'fortnightly', 'monthly'] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setReportingFrequency(freq)}
                  className={cn(
                    'rounded-md border p-2 text-center text-xs font-medium transition-colors',
                    reportingFrequency === freq
                      ? 'border-violet-600 bg-violet-50 text-violet-900'
                      : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <Button variant="outline" size="sm" onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
