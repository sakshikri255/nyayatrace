import { GavelIcon, ShieldCheckIcon } from 'lucide-react'
import { cn } from 'cn'

type JudicialOrder = {
  id: number
  caseId: number
  orderDate: string
  orderType: string
  summary: string | null
  issuedBy: string | null
  documentId: number | null
  createdAt: string | null
}

type BailCondition = {
  id: number
  caseId: number
  conditionText: string
  conditionType: string
  status: string
  orderId: number | null
  createdAt: string | null
}

interface OrdersTabProps {
  caseId: number
  orders: JudicialOrder[]
  conditions: BailCondition[]
}

const orderTypeLabels: Record<string, string> = {
  bail_order: 'Bail Order',
  stay_order: 'Stay Order',
  framing_charges: 'Framing of Charges',
  sentence: 'Sentence',
  other: 'Other',
}

const conditionTypeLabels: Record<string, string> = {
  surety: 'Surety',
  reporting: 'Reporting',
  travel: 'Travel',
  activity: 'Activity',
  other: 'Other',
}

const conditionStatusConfig: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  revoked: 'bg-rose-100 text-rose-700',
  completed: 'bg-slate-100 text-slate-600',
}

export function OrdersTab({ orders, conditions }: OrdersTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Judicial Orders */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
          <GavelIcon className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Judicial Orders ({orders.length})
          </h3>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No judicial orders on record.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-100">
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide w-32">Date</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide w-36">Type</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Summary</th>
                <th className="py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide w-36">Issued By</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="text-sm font-semibold text-slate-700">
                      {new Date(o.orderDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-medium text-slate-700">
                      {orderTypeLabels[o.orderType] ?? o.orderType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-slate-600">{o.summary ?? '—'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-slate-500">{o.issuedBy ?? '—'}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bail / Parole Conditions */}
      {conditions.length > 0 && (
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
              </tr>
            </thead>
            <tbody>
              {conditions.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-sm text-slate-700">{c.conditionText}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-slate-500">
                      {conditionTypeLabels[c.conditionType] ?? c.conditionType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', conditionStatusConfig[c.status] ?? 'bg-slate-100 text-slate-600')}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
