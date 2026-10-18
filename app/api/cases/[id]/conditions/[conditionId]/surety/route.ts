import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { suretyBonds } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; conditionId: string } }
) {
  try {
    const conditionId = parseInt(params.conditionId, 10)
    if (isNaN(conditionId)) return NextResponse.json({ error: 'Invalid conditionId' }, { status: 400 })
    const row = db.select().from(suretyBonds).where(eq(suretyBonds.conditionId, conditionId)).get()
    return NextResponse.json(row ?? null)
  } catch (error) {
    console.error('[GET surety bond]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; conditionId: string } }
) {
  try {
    const conditionId = parseInt(params.conditionId, 10)
    if (isNaN(conditionId)) return NextResponse.json({ error: 'Invalid conditionId' }, { status: 400 })

    const body = await request.json() as {
      suretyName: string
      relationship: string
      bondAmount: string
      documentReference?: string | null
      verificationStatus?: 'pending' | 'verified' | 'rejected'
    }

    if (!body.suretyName?.trim() || !body.relationship?.trim() || !body.bondAmount?.trim()) {
      return NextResponse.json({ error: 'suretyName, relationship, and bondAmount are required' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const existing = db.select().from(suretyBonds).where(eq(suretyBonds.conditionId, conditionId)).get()

    if (existing) {
      const updated = db.update(suretyBonds)
        .set({
          suretyName: body.suretyName.trim(),
          relationship: body.relationship.trim(),
          bondAmount: body.bondAmount.trim(),
          documentReference: body.documentReference ?? null,
          verificationStatus: body.verificationStatus ?? existing.verificationStatus,
          updatedAt: now,
        })
        .where(eq(suretyBonds.conditionId, conditionId))
        .returning()
        .get()
      return NextResponse.json(updated)
    }

    const inserted = db.insert(suretyBonds).values({
      conditionId,
      suretyName: body.suretyName.trim(),
      relationship: body.relationship.trim(),
      bondAmount: body.bondAmount.trim(),
      documentReference: body.documentReference ?? null,
      verificationStatus: body.verificationStatus ?? 'pending',
    }).returning().get()

    return NextResponse.json(inserted, { status: 201 })
  } catch (error) {
    console.error('[POST surety bond]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
