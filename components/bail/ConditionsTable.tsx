import { ShieldCheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface ConditionsTableProps {
  conditions: ConditionWithOrder[]
  showEmpty?: boolean
}

const conditionTypeConfig: Record<string, { label: string; className: string }> = {
  surety:    { label: 'Surety',    className: 'bg-navy-50 text-navy-700 border-navy-200'       },
  reporting: { label: 'Reporting', className: 'bg-teal-50 text-teal-700 border-teal-200'       },
  travel:    { label: 'Travel',    className: 'bg-amber-50 text-amber-700 border-amber-200'     },
  activity:  { label: 'Activity',  className: 'bg-blue-50 text-blue-700 border-blue-200'       },
  other:     { label: 'Other',     className: 'bg-slate-100 text-slate-600 border-slate-200'   },
}

const conditionStatusConfig: Record<string, { label: string; className: string }> = {
  active:    { label: 'Active',    className: 'bg-emerald-100 text-emerald-700' },
  revoked:   { label: 'Revoked',   className: 'bg-rose-100 text-rose-700'       },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-600'     },
}

const orderTypeLabels: Record<string, string> = {
  bail_order:       'Bail Order',
  stay_order:       'Stay Order',
  framing_charges:  'Framing of Charges',
  sentence:         'Sentence',
  other:            'Other',
}

export function ConditionsTable({ conditions, showEmpty = true }: ConditionsTableProps) {
  if (conditions.length === 0) {
    if (!showEmpty) return null
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShieldCheckIcon className="w-8 h-8 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">No bail or parole conditions recorded for this case</p>
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
          </tr>
        </thead>
        <tbody>
          {conditions.map((c) => {
            const typeConfig = conditionTypeConfig[c.conditionType] ?? conditionTypeConfig.other
            const statusConfig = conditionStatusConfig[c.status] ?? conditionStatusConfig.active
            const orderLabel = c.orderType ? (orderTypeLabels[c.orderType] ?? c.orderType) : null
            const orderDate = c.orderDate
              ? new Date(c.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : null

            return (
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
                  <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', statusConfig.className)}>
                    {statusConfig.label}
                  </span>
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
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
