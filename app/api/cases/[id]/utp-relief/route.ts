import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cases } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { calculateUTPRelief } from '@/lib/analysis/utpRelief'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const caseRecord = db.select().from(cases).where(eq(cases.id, id)).get()
    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const result = calculateUTPRelief({
      remandDate: caseRecord.remandDate,
      maxPunishmentYears: (caseRecord as typeof caseRecord & { maxPunishmentYears?: number | null }).maxPunishmentYears,
      applicableLaw: caseRecord.applicableLaw,
      chargesheetFiled: caseRecord.chargesheetFiled,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/cases/[id]/utp-relief]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
