import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bailConditions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; conditionId: string } }
) {
  try {
    const conditionId = parseInt(params.conditionId, 10)
    if (isNaN(conditionId)) {
      return NextResponse.json({ error: 'Invalid conditionId' }, { status: 400 })
    }

    const body = await request.json() as { status?: string }
    if (!body.status || !['active', 'revoked', 'completed'].includes(body.status)) {
      return NextResponse.json({ error: 'Valid status required: active | revoked | completed' }, { status: 400 })
    }

    const updated = db
      .update(bailConditions)
      .set({ status: body.status as 'active' | 'revoked' | 'completed' })
      .where(eq(bailConditions.id, conditionId))
      .returning()
      .get()

    if (!updated) {
      return NextResponse.json({ error: 'Condition not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH condition status]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
