import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analysisRuns } from '@/lib/db/schema'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; runId: string } }
) {
  const caseId = Number.parseInt(params.id, 10)
  const runId = Number.parseInt(params.runId, 10)
  if (!Number.isSafeInteger(caseId) || !Number.isSafeInteger(runId)) {
    return NextResponse.json({ error: 'Invalid analysis reference.' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const reviewNotes = typeof body?.reviewNotes === 'string' ? body.reviewNotes.trim() : null
  if (reviewNotes === null || reviewNotes.length > 20000) {
    return NextResponse.json({ error: 'Review notes must be text under 20,000 characters.' }, { status: 400 })
  }

  const saved = db.update(analysisRuns)
    .set({ reviewNotes })
    .where(and(eq(analysisRuns.id, runId), eq(analysisRuns.caseId, caseId)))
    .returning()
    .get()
  if (!saved) return NextResponse.json({ error: 'Analysis not found.' }, { status: 404 })
  return NextResponse.json(saved)
}