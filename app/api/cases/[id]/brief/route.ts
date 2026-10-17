import { NextRequest, NextResponse } from 'next/server'
import { getCaseById } from '@/lib/queries/cases'
import { getDocumentsByCaseId } from '@/lib/queries/documents'
import { getFindingsByCaseId } from '@/lib/queries/findings'
import { getHearingsByCaseId } from '@/lib/queries/hearings'
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

    const caseData = getCaseById(caseId)
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const docs = getDocumentsByCaseId(caseId)
    const findingList = getFindingsByCaseId(caseId)
    const hearingList = getHearingsByCaseId(caseId)
    const orderList = db
      .select()
      .from(judicialOrders)
      .where(eq(judicialOrders.caseId, caseId))
      .orderBy(judicialOrders.orderDate)
      .all()
    const conditionList = db
      .select()
      .from(bailConditions)
      .where(eq(bailConditions.caseId, caseId))
      .all()

    const verified = findingList.filter((f) => f.reviewStatus === 'verified').length
    const needsReview = findingList.filter((f) => f.reviewStatus === 'needs_review').length
    const notADiscrepancy = findingList.filter((f) => f.reviewStatus === 'not_a_discrepancy').length

    const sortedHearings = [...hearingList].sort((a, b) =>
      a.hearingDate < b.hearingDate ? -1 : 1
    )
    const firstHearingDate = sortedHearings.length > 0 ? sortedHearings[0].hearingDate : null
    const lastHearingDate = sortedHearings.length > 0 ? sortedHearings[sortedHearings.length - 1].hearingDate : null

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      case: {
        caseNumber: caseData.caseNumber,
        title: caseData.title,
        status: caseData.status,
        caseType: caseData.caseType,
        court: caseData.court ?? null,
        judge: caseData.judge ?? null,
        description: caseData.description ?? null,
      },
      documents: {
        count: docs.length,
        list: docs.map((d) => ({
          name: d.originalName,
          type: d.fileType,
          pages: d.pageCount ?? 0,
          status: d.processingStatus,
        })),
      },
      findings: {
        total: findingList.length,
        verified,
        needsReview,
        notADiscrepancy,
        list: findingList.map((f) => ({
          findingType: f.findingType,
          description: f.description,
          severity: f.severity,
          reviewStatus: f.reviewStatus,
          extractedValue: f.extractedValue ?? null,
          comparisonValue: f.comparisonValue ?? null,
        })),
      },
      hearings: {
        total: hearingList.length,
        firstDate: firstHearingDate,
        lastDate: lastHearingDate,
        list: [...hearingList]
          .sort((a, b) => (a.hearingDate > b.hearingDate ? -1 : 1))
          .map((h) => ({
            hearingDate: h.hearingDate,
            eventType: h.eventType,
            description: h.description ?? null,
            outcome: h.outcome ?? null,
            judge: h.judge ?? null,
          })),
      },
      orders: {
        total: orderList.length,
        list: orderList.map((o) => ({
          orderDate: o.orderDate,
          orderType: o.orderType,
          summary: o.summary ?? null,
          issuedBy: o.issuedBy ?? null,
        })),
      },
      conditions: {
        total: conditionList.length,
        list: conditionList.map((c) => ({
          conditionText: c.conditionText,
          conditionType: c.conditionType,
          status: c.status,
        })),
      },
    })
  } catch (error) {
    console.error('[GET /api/cases/[id]/brief]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
