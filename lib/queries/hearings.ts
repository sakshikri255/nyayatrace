import { db } from '@/lib/db'
import { hearings } from '@/lib/db/schema'
import { eq, sql, min, max } from 'drizzle-orm'

export type HearingRow = {
  id: number
  caseId: number
  hearingDate: string
  eventType: 'bail_hearing' | 'charge_framing' | 'arguments' | 'judgment' | 'order' | 'adjournment'
  description: string | null
  outcome: string | null
  judge: string | null
  court: string | null
  sourceDocument: string | null
  createdAt: string | null
}

export type HearingChartPoint = { month: string; count: number }

function formatMonthLabel(yyyyMM: string): string {
  const [year, mon] = yyyyMM.split('-')
  const date = new Date(Number(year), Number(mon) - 1, 1)
  return date.toLocaleString('en-US', { month: 'short' }) + " '" + String(year).slice(2)
}

export function getHearingsPerMonth(months: number): HearingChartPoint[] {
  const rows = db
    .select({
      month: sql<string>`strftime('%Y-%m', ${hearings.hearingDate})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(hearings)
    .groupBy(sql`strftime('%Y-%m', ${hearings.hearingDate})`)
    .orderBy(sql`strftime('%Y-%m', ${hearings.hearingDate})`)
    .all()

  // Build a map of YYYY-MM -> count from DB
  const dbMap = new Map<string, number>()
  for (const r of rows) {
    dbMap.set(r.month, r.count)
  }

  // Zero-fill the last N months
  const result: HearingChartPoint[] = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    result.push({ month: formatMonthLabel(key), count: dbMap.get(key) ?? 0 })
  }
  return result
}

export function getAllHearingsPerMonth(): HearingChartPoint[] {
  const rows = db
    .select({
      month: sql<string>`strftime('%Y-%m', ${hearings.hearingDate})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(hearings)
    .groupBy(sql`strftime('%Y-%m', ${hearings.hearingDate})`)
    .orderBy(sql`strftime('%Y-%m', ${hearings.hearingDate})`)
    .all()

  return rows.map((r) => ({ month: formatMonthLabel(r.month), count: r.count }))
}

export function getHearingsByCaseId(caseId: number): HearingRow[] {
  return db
    .select()
    .from(hearings)
    .where(eq(hearings.caseId, caseId))
    .orderBy(hearings.hearingDate)
    .all() as HearingRow[]
}

export function getCaseHearingsPerMonth(caseId: number): HearingChartPoint[] {
  // Get the count per month for this case
  const rows = db
    .select({
      month: sql<string>`strftime('%Y-%m', ${hearings.hearingDate})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(hearings)
    .where(eq(hearings.caseId, caseId))
    .groupBy(sql`strftime('%Y-%m', ${hearings.hearingDate})`)
    .orderBy(sql`strftime('%Y-%m', ${hearings.hearingDate})`)
    .all()

  if (rows.length === 0) return []

  // Get date range for this case
  const range = db
    .select({
      first: min(hearings.hearingDate),
      last: max(hearings.hearingDate),
    })
    .from(hearings)
    .where(eq(hearings.caseId, caseId))
    .get()

  if (!range?.first || !range?.last) return []

  const dbMap = new Map<string, number>()
  for (const r of rows) {
    dbMap.set(r.month, r.count)
  }

  // Enumerate all months from first to last, zero-filling gaps
  const result: HearingChartPoint[] = []
  const [fy, fm] = range.first.split('-').map(Number)
  const [ly, lm] = range.last.split('-').map(Number)
  let year = fy
  let mon = fm
  while (year < ly || (year === ly && mon <= lm)) {
    const key = `${year}-${String(mon).padStart(2, '0')}`
    result.push({ month: formatMonthLabel(key), count: dbMap.get(key) ?? 0 })
    mon++
    if (mon > 12) { mon = 1; year++ }
  }
  return result
}
