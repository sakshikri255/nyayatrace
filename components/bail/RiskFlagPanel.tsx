'use client'

import { ShieldAlertIcon, AlertTriangleIcon, InfoIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatutoryBailCalculation } from '@/lib/analysis/statutoryBail'
import type { TabId } from '@/components/bail/BailBriefView'

interface ConditionLike {
  id: number
  status: string
}

interface HearingLike {
  hearingDate: string
  outcome?: string | null
}

interface FindingLike {
  reviewStatus: string
}

interface RiskFlagPanelProps {
  bail: StatutoryBailCalculation
  caseType: string
  conditions: ConditionLike[]
  hearings: HearingLike[]
  findings: FindingLike[]
  onTabChange: (tab: TabId) => void
}

interface Flag {
  id: string
  severity: 'critical' | 'warning' | 'info'
  label: string
  detail: string
  tab: TabId
}

export function RiskFlagPanel({ bail, caseType, conditions, hearings, findings, onTabChange }: RiskFlagPanelProps) {
  const flags: Flag[] = []
  const today = new Date().toISOString().slice(0, 10)

  // Flag 1 — Statutory bail accrued (bail/criminal cases only)
  if (bail.status === 'accrued' && caseType !== 'parole') {
    flags.push({
      id: 'accrued',
      severity: 'critical',
      label: 'Default Bail Right Accrued',
      detail: `Deadline exceeded by ${Math.abs(bail.daysRemaining)} days. No chargesheet filed.`,
      tab: 'overview',
    })
  }

  // Flag 2 — Bail deadline urgent
  if (bail.status === 'urgent' && caseType !== 'parole') {
    flags.push({
      id: 'urgent',
      severity: 'warning',
      label: `Bail Deadline in ${bail.daysRemaining} Days`,
      detail: `Chargesheet must be filed by ${bail.deadlineDate ?? 'deadline'}.`,
      tab: 'overview',
    })
  }

  // Flag 3 — Active conditions with no compliance record (simplified: just active conditions)
  const activeConditions = conditions.filter((c) => c.status === 'active')
  if (activeConditions.length > 0) {
    flags.push({
      id: 'conditions',
      severity: 'warning',
      label: `${activeConditions.length} Active Condition${activeConditions.length !== 1 ? 's' : ''}`,
      detail: 'Review compliance status for active bail/parole conditions.',
      tab: 'conditions',
    })
  }

  // Flag 4 — Past hearings with no outcome recorded
  const unrecordedHearings = hearings.filter(
    (h) => h.hearingDate < today && (!h.outcome || h.outcome.trim() === '')
  )
  if (unrecordedHearings.length > 0) {
    flags.push({
      id: 'hearings',
      severity: 'info',
      label: `${unrecordedHearings.length} Hearing${unrecordedHearings.length !== 1 ? 's' : ''} Without Outcome`,
      detail: 'Past hearings have no outcome recorded.',
      tab: 'hearings',
    })
  }

  // Flag 5 — Unreviewed document findings
  const pendingFindings = findings.filter((f) => f.reviewStatus === 'needs_review')
  if (pendingFindings.length > 0) {
    flags.push({
      id: 'findings',
      severity: 'warning',
      label: `${pendingFindings.length} Unreviewed Finding${pendingFindings.length !== 1 ? 's' : ''}`,
      detail: 'Document findings are pending review.',
      tab: 'findings',
    })
  }

  if (flags.length === 0) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlertIcon className="w-4 h-4 text-slate-600" />
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Risk Flags</span>
        <span className="rounded-full bg-rose-100 text-rose-700 px-1.5 py-0.5 text-[10px] font-semibold">{flags.length}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {flags.map((flag) => (
          <button
            key={flag.id}
            onClick={() => onTabChange(flag.tab)}
            className={cn(
              'inline-flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors hover:opacity-90',
              flag.severity === 'critical'
                ? 'border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100'
                : flag.severity === 'warning'
                ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            )}
            title={`Go to ${flag.tab} tab`}
          >
            <span className="shrink-0 mt-0.5">
              {flag.severity === 'critical'
                ? <ShieldAlertIcon className="w-3.5 h-3.5" />
                : flag.severity === 'warning'
                ? <AlertTriangleIcon className="w-3.5 h-3.5" />
                : <InfoIcon className="w-3.5 h-3.5" />}
            </span>
            <span>
              <span className="font-semibold block">{flag.label}</span>
              <span className="opacity-80">{flag.detail}</span>
            </span>
            <span className="ml-auto shrink-0 opacity-60 text-[10px] font-medium self-center pl-1">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}
