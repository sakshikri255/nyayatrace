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
  theme?: 'light' | 'dark'
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-midnight-950 border border-white/20 text-white text-xs px-3 py-2 rounded-lg shadow-xl">
      <p className="font-serif font-medium text-gold mb-0.5">{label}</p>
      <p className="text-slate-300">
        {payload[0].value} hearing{payload[0].value === 1 ? '' : 's'}
      </p>
    </div>
  )
}

export function ActivityLineChart({ data, theme = 'light' }: ActivityLineChartProps) {
  const isEmpty = data.length === 0 || data.every((d) => d.count === 0)
  const isDark = theme === 'dark'

  return (
    <div
      className={
        isDark
          ? 'rounded-2xl border border-white/10 bg-midnight-950/80 p-5 h-full shadow-lg flex flex-col justify-between'
          : 'bg-white border border-gray-200 shadow-sm rounded-lg p-5 h-full'
      }
    >
      <div className="mb-4">
        <h3 className={isDark ? 'font-serif text-sm font-medium text-slate-100' : 'text-sm font-semibold text-gray-800'}>
          Case Activity
        </h3>
        <p className={isDark ? 'text-xs text-slate-400 font-light mt-0.5' : 'text-xs text-gray-400 mt-0.5'}>
          Hearings recorded per month
        </p>
      </div>

      {isEmpty ? (
        <div className={`flex items-center justify-center h-[180px] text-sm ${isDark ? 'text-slate-500 font-light' : 'text-gray-400'}`}>
          Not enough hearing data to display a chart
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke={isDark ? '#1E293B' : '#f0f0f0'}
              opacity={isDark ? 0.6 : 1}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: isDark ? '#64748B' : '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: isDark ? '#64748B' : '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: isDark ? '#334155' : '#e5e7eb', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={isDark ? '#14B8A6' : '#0D9488'}
              strokeWidth={2.2}
              dot={{ r: 3.5, fill: isDark ? '#14B8A6' : '#0D9488', strokeWidth: 0 }}
              activeDot={{ r: 5.5, fill: '#E5C378', strokeWidth: 0 }}
              isAnimationActive={true}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
export default ActivityLineChart
