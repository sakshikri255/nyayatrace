'use client'

import { CalendarClockIcon } from 'lucide-react'
import { differenceInDays, parseISO, isValid, format } from 'date-fns'
import { cn } from '@/lib/utils'

const eventTypeLabels: Record<string, string> = {
  bail_hearing:    'Bail Hearing',
  charge_framing:  'Charge Framing',
  arguments:       'Arguments',
  judgment:        'Judgment',
  order:           'Order',
  adjournment:     'Adjournment',
}

interface Hearing {
  hearingDate: string
  eventType: string
  court?: string | null
  judge?: string | null
  description?: string | null
}

interface NextHearingWidgetProps {
  hearing: Hearing
  compact?: boolean
}

export function NextHearingWidget({ hearing, compact = false }: NextHearingWidgetProps) {
  const date = parseISO(hearing.hearingDate)
  if (!isValid(date)) return null

  const daysAway = differenceInDays(date, new Date())
  const isToday = daysAway === 0
  const isUrgent = daysAway <= 7 && daysAway >= 0
  const formattedDate = format(date, 'd MMM yyyy')

  if (compact) {
    return (
      <div className={cn(
        'inline-flex items-center gap-1.5 text-xs rounded-full border px-2.5 py-1 font-medium',
        isToday   ? 'bg-rose-50 border-rose-300 text-rose-800' :
        isUrgent  ? 'bg-amber-50 border-amber-300 text-amber-800' :
                    'bg-teal-50 border-teal-200 text-teal-800'
      )}>
        <CalendarClockIcon className="w-3.5 h-3.5" />
        {isToday ? 'Hearing today' : `Next hearing in ${daysAway} day${daysAway !== 1 ? 's' : ''}`}
      </div>
    )
  }

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-lg border p-4',
      isToday   ? 'border-rose-300 bg-rose-50' :
      isUrgent  ? 'border-amber-300 bg-amber-50' :
                  'border-teal-200 bg-teal-50/50'
    )}>
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
        isToday   ? 'border-rose-300 bg-rose-100 text-rose-700' :
        isUrgent  ? 'border-amber-300 bg-amber-100 text-amber-700' :
                    'border-teal-200 bg-teal-100 text-teal-700'
      )}>
        <CalendarClockIcon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900">Next Hearing</span>
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            isToday   ? 'bg-rose-600 text-white' :
            isUrgent  ? 'bg-amber-500 text-white' :
                        'bg-teal-600 text-white'
          )}>
            {isToday ? 'Today' : `${daysAway} day${daysAway !== 1 ? 's' : ''} away`}
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
            {eventTypeLabels[hearing.eventType] ?? hearing.eventType}
          </span>
        </div>
        <p className={cn(
          'text-sm font-medium mt-0.5',
          isToday ? 'text-rose-800' : isUrgent ? 'text-amber-800' : 'text-teal-800'
        )}>
          {formattedDate}
        </p>
        {(hearing.court || hearing.judge) && (
          <p className="text-xs text-slate-500 mt-1">
            {hearing.court && <span>{hearing.court}</span>}
            {hearing.court && hearing.judge && <span> · </span>}
            {hearing.judge && <span>Before {hearing.judge}</span>}
          </p>
        )}
      </div>
    </div>
  )
}
