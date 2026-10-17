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

interface ActivityLineChartProps {
  data: HearingChartPoint[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg">
      <p className="font-medium mb-0.5">{label}</p>
      <p className="text-gray-300">
        {payload[0].value} hearing{payload[0].value === 1 ? '' : 's'}
      </p>
    </div>
  )
}

export function ActivityLineChart({ data }: ActivityLineChartProps) {
  const isEmpty = data.length === 0 || data.every((d) => d.count === 0)

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Case Activity</h3>
        <p className="text-xs text-gray-400 mt-0.5">Hearings per month</p>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center h-[180px] text-sm text-gray-400">
          Not enough hearing data to display a chart
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
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
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
