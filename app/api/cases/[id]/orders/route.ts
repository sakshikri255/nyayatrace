import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { judicialOrders, bailConditions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = parseInt(params.id, 10)
    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const orders = db
      .select()
      .from(judicialOrders)
      .where(eq(judicialOrders.caseId, caseId))
      .orderBy(judicialOrders.orderDate)
      .all()

    const conditions = db
      .select()
      .from(bailConditions)
      .where(eq(bailConditions.caseId, caseId))
      .all()

    return NextResponse.json({ orders, conditions })
  } catch (error) {
    console.error('[GET /api/cases/[id]/orders]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
