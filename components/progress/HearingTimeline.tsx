'use client'

import { motion, type Variants } from 'framer-motion'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HearingRow } from '@/lib/queries/hearings'

interface HearingTimelineProps {
  hearings: HearingRow[]
}

const eventConfig: Record<string, { label: string; className: string }> = {
  bail_hearing: { label: 'Bail Hearing', className: 'bg-violet-100 text-violet-700 border-violet-200' },
  charge_framing: { label: 'Charge Framing', className: 'bg-sky-100 text-sky-700 border-sky-200' },
  arguments: { label: 'Arguments', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  judgment: { label: 'Judgment', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  order: { label: 'Order', className: 'bg-teal-100 text-teal-700 border-teal-200' },
  adjournment: { label: 'Adjournment', className: 'bg-slate-100 text-slate-600 border-slate-200' },
}

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

export function HearingTimeline({ hearings }: HearingTimelineProps) {
  if (hearings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-slate-200 rounded-lg">
        <CalendarIcon className="w-8 h-8 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">No hearings recorded</p>
        <p className="text-xs text-slate-400 mt-1">Hearing dates will appear here as they are added.</p>
      </div>
    )
  }

  const sorted = [...hearings].sort((a, b) => a.hearingDate.localeCompare(b.hearingDate))

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-slate-200 bg-slate-50">
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">
              Date
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">
              Event Type
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Description
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Outcome
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">
              Court
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">
              Source
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((h, i) => {
            const cfg = eventConfig[h.eventType] ?? {
              label: h.eventType,
              className: 'bg-slate-100 text-slate-600 border-slate-200',
            }
            const isEven = i % 2 === 1
            return (
              <motion.tr
                key={h.id}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                className={cn(
                  'border-b border-slate-100 transition-colors hover:bg-slate-50/80',
                  isEven && 'bg-slate-50/40'
                )}
              >
                <td className="py-2.5 px-4">
                  <span className="text-sm font-medium text-slate-800 whitespace-nowrap">
                    {new Date(h.hearingDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                      cfg.className
                    )}
                  >
                    {cfg.label}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <p className="text-sm text-slate-700 line-clamp-2">{h.description ?? '—'}</p>
                </td>
                <td className="py-2.5 px-4">
                  <p className="text-sm text-slate-600">{h.outcome ?? '—'}</p>
                </td>
                <td className="py-2.5 px-4">
                  <p className="text-xs text-slate-500 truncate max-w-[8rem]">
                    {h.court ?? '—'}
                  </p>
                </td>
                <td className="py-2.5 px-4">
                  <p className="text-xs text-slate-400 truncate max-w-[8rem]">
                    {h.sourceDocument ?? '—'}
                  </p>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
