import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cases } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { calculateStatutoryBail } from '@/lib/analysis/statutoryBail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface BailAlert {
  caseId: number
  caseNumber: string
  title: string
  status: 'urgent' | 'accrued'
  statusLabel: string
  daysRemaining: number
  daysInCustody: number
  deadlineDate: string | null
  statutorySection: string
  href: string
}

export async function GET() {
  try {
    const activeCases = db
      .select()
      .from(cases)
      .where(eq(cases.status, 'active'))
      .all()

    const alerts: BailAlert[] = []

    for (const c of activeCases) {
      if (!['criminal', 'bail'].includes(c.caseType)) continue

      const bail = calculateStatutoryBail({
        remandDate: c.remandDate,
        statutoryPeriodDays: c.statutoryPeriodDays,
        chargesheetFiled: c.chargesheetFiled,
        chargesheetDate: c.chargesheetDate,
        applicableLaw: c.applicableLaw,
      })

      if (bail.status === 'accrued' || bail.status === 'urgent') {
        alerts.push({
          caseId: c.id,
          caseNumber: c.caseNumber,
          title: c.title,
          status: bail.status,
          statusLabel: bail.statusLabel,
          daysRemaining: bail.daysRemaining,
          daysInCustody: bail.daysInCustody,
          deadlineDate: bail.deadlineDate,
          statutorySection: bail.statutorySection,
          href: `/bail-briefs/${c.id}`,
        })
      }
    }

    // Sort: accrued first, then by daysRemaining ascending
    alerts.sort((a, b) => {
      if (a.status === 'accrued' && b.status !== 'accrued') return -1
      if (b.status === 'accrued' && a.status !== 'accrued') return 1
      return a.daysRemaining - b.daysRemaining
    })

    return NextResponse.json({ alerts, total: alerts.length })
  } catch (error) {
    console.error('[GET /api/overview/alerts]', error)
    return NextResponse.json({ alerts: [], total: 0 })
  }
}
