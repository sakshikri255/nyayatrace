'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { HearingChartPoint } from '@/lib/queries/hearings'

interface CaseActivityChartProps {
  data: HearingChartPoint[]
  caseTitle: string
  totalHearings: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const count = payload[0].value
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg">
      <p className="font-medium mb-0.5">{label}</p>
      <p className="text-gray-300">
        {count} hearing{count === 1 ? '' : 's'}
      </p>
    </div>
  )
}

export function CaseActivityChart({ data, caseTitle, totalHearings }: CaseActivityChartProps) {
  const nonZeroCount = data.filter((d) => d.count > 0).length
  const isEmpty = nonZeroCount < 2

  // Rotate labels when there are many months (> 12)
  const angle = data.length > 12 ? -45 : 0
  const xTickMargin = data.length > 12 ? 14 : 4

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Hearing Activity</h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate" title={caseTitle}>
          {caseTitle} &mdash; {totalHearings} total hearing{totalHearings === 1 ? '' : 's'}
        </p>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center h-[200px] text-sm text-gray-400 bg-gray-50 rounded border border-dashed border-gray-200">
          Not enough data for a chart
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={data}
            margin={{ top: 4, right: 8, left: -16, bottom: data.length > 12 ? 32 : 4 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#94A3B8', angle, textAnchor: angle !== 0 ? 'end' : 'middle' }}
              axisLine={false}
              tickLine={false}
              interval={data.length > 24 ? Math.floor(data.length / 12) : 'preserveStartEnd'}
              tickMargin={xTickMargin}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#0D9488"
              strokeWidth={2}
              dot={{ r: 3, fill: '#0D9488', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#0D9488', strokeWidth: 0 }}
              isAnimationActive={true}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
