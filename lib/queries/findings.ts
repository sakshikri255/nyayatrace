import { db } from '@/lib/db'
import { findings, findingSources, findingReviews, auditEvents, documents } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export type FindingRow = {
  id: number
  caseId: number
  analysisRunId: number | null
  findingType: 'date_discrepancy' | 'name_variation' | 'location_mismatch' | 'missing_info' | 'note'
  description: string
  extractedValue: string | null
  comparisonValue: string | null
  severity: 'high' | 'medium' | 'low'
  reviewStatus: 'needs_review' | 'verified' | 'not_a_discrepancy'
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type FindingSource = {
  id: number
  findingId: number
  documentId: number
  pageId: number | null
  pageNumber: number | null
  passage: string | null
  role: 'primary' | 'comparison'
  documentName: string | null
}

export type FindingWithSources = FindingRow & {
  sources: FindingSource[]
}

export function getFindingsByCaseId(caseId: number): FindingRow[] {
  return db
    .select()
    .from(findings)
    .where(eq(findings.caseId, caseId))
    .orderBy(findings.severity)
    .all() as FindingRow[]
}

export function getFindingWithSources(id: number): FindingWithSources | null {
  const finding = db.select().from(findings).where(eq(findings.id, id)).get()
  if (!finding) return null

  const sources = db
    .select({
      id: findingSources.id,
      findingId: findingSources.findingId,
      documentId: findingSources.documentId,
      pageId: findingSources.pageId,
      pageNumber: findingSources.pageNumber,
      passage: findingSources.passage,
      role: findingSources.role,
      documentName: documents.originalName,
    })
    .from(findingSources)
    .leftJoin(documents, eq(documents.id, findingSources.documentId))
    .where(eq(findingSources.findingId, id))
    .all()

  return {
    ...(finding as FindingRow),
    sources: sources as FindingSource[],
  }
}

export function updateFindingStatus(
  id: number,
  status: 'needs_review' | 'verified' | 'not_a_discrepancy',
  reviewedBy: string | null,
  note?: string
): FindingWithSources | null {
  // Update the finding itself
  db.update(findings)
    .set({
      reviewStatus: status,
      reviewedBy,
      reviewedAt: sql`(datetime('now'))`,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(findings.id, id))
    .run()

  // Insert audit trail record in finding_reviews
  db.insert(findingReviews)
    .values({
      findingId: id,
      action: status,
      note: note ?? null,
      performedBy: reviewedBy,
    })
    .run()

  // Insert audit_events record — fetch caseId first
  const updated = db.select().from(findings).where(eq(findings.id, id)).get()
  if (updated) {
    db.insert(auditEvents)
      .values({
        caseId: (updated as FindingRow).caseId,
        eventType: 'finding_reviewed',
        description: `Finding #${id} marked as "${status}"${note ? ` — ${note}` : ''}`,
        performedBy: reviewedBy,
      })
      .run()
  }

  return getFindingWithSources(id)
}
