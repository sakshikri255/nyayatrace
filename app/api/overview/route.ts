import { NextResponse } from 'next/server'
import { getDashboardStats, getRecentCases } from '@/lib/queries/cases'
import { getAllHearingsPerMonth } from '@/lib/queries/hearings'

export const runtime = 'nodejs'

export function GET() {
  const stats = getDashboardStats()
  const recentCases = getRecentCases(5)
  const chartData = getAllHearingsPerMonth()

  return NextResponse.json({ stats, recentCases, chartData })
}
