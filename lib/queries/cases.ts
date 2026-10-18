import { db } from '@/lib/db'
import { cases, documents, findings, judicialOrders, bailConditions, hearings } from '@/lib/db/schema'
import { eq, and, count, desc, sql } from 'drizzle-orm'
import type { FindingWithSources } from '@/lib/queries/findings'
import { getFindingsByCaseId, getFindingWithSources } from '@/lib/queries/findings'

export type CaseWithCounts = {
  id: number
  caseNumber: string
  title: string
  description: string | null
  status: 'active' | 'closed' | 'pending' | 'stayed' | 'unspecified'
  caseType: 'criminal' | 'civil' | 'bail' | 'parole' | 'unspecified'
  court: string | null
  jurisdiction: string | null
  judge: string | null
  remandDate: string | null
  statutoryPeriodDays: number | null
  chargesheetFiled: number | null
  chargesheetDate: string | null
  createdAt: string | null
  updatedAt: string | null
  documentCount: number
  findingCount: number
}

export type CaseDetail = {
  id: number
  caseNumber: string
  title: string
  description: string | null
  status: 'active' | 'closed' | 'pending' | 'stayed' | 'unspecified'
  caseType: 'criminal' | 'civil' | 'bail' | 'parole' | 'unspecified'
  court: string | null
  jurisdiction: string | null
  judge: string | null
  remandDate: string | null
  statutoryPeriodDays: number | null
  chargesheetFiled: number | null
  chargesheetDate: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type CaseStats = {
  total: number
  active: number
  pending: number
  closed: number
  stayed: number
}

export type DashboardStats = {
  totalCases: number
  documentsProcessed: number
  findingsAwaitingReview: number
  verifiedFindings: number
}

export type RecentCase = {
  id: number
  caseNumber: string
  title: string
  status: 'active' | 'closed' | 'pending' | 'stayed' | 'unspecified'
  caseType: 'criminal' | 'civil' | 'bail' | 'parole' | 'unspecified'
  documentCount: number
  lastActivity: string | null
}

export function getDashboardStats(): DashboardStats {
  const totalCases = db.select({ cnt: count() }).from(cases).get()?.cnt ?? 0

  const documentsProcessed =
    db
      .select({ cnt: count() })
      .from(documents)
      .where(eq(documents.processingStatus, 'complete'))
      .get()?.cnt ?? 0

  const findingsAwaitingReview =
    db
      .select({ cnt: count() })
      .from(findings)
      .where(eq(findings.reviewStatus, 'needs_review'))
      .get()?.cnt ?? 0

  const verifiedFindings =
    db
      .select({ cnt: count() })
      .from(findings)
      .where(eq(findings.reviewStatus, 'verified'))
      .get()?.cnt ?? 0

  return { totalCases, documentsProcessed, findingsAwaitingReview, verifiedFindings }
}

export function getRecentCases(limit: number): RecentCase[] {
  const rows = db
    .select({
      id: cases.id,
      caseNumber: cases.caseNumber,
      title: cases.title,
      status: cases.status,
      caseType: cases.caseType,
      updatedAt: cases.updatedAt,
      documentCount: sql<number>`count(distinct ${documents.id})`,
    })
    .from(cases)
    .leftJoin(documents, eq(documents.caseId, cases.id))
    .groupBy(cases.id)
    .orderBy(desc(cases.updatedAt))
    .limit(limit)
    .all()

  return rows.map((r) => ({
    id: r.id,
    caseNumber: r.caseNumber,
    title: r.title,
    status: r.status,
    caseType: r.caseType,
    documentCount: r.documentCount,
    lastActivity: r.updatedAt,
  })) as RecentCase[]
}

export function getAllCases(
  search?: string,
  status?: string,
  type?: string
): CaseWithCounts[] {
  // Build conditions array
  const conditions = []

  if (search) {
    conditions.push(
      sql`(
        ${cases.title} LIKE ${'%' + search + '%'} OR
        ${cases.caseNumber} LIKE ${'%' + search + '%'} OR
        EXISTS (
          SELECT 1 FROM documents search_documents
          LEFT JOIN pages search_pages ON search_pages.document_id = search_documents.id
          WHERE search_documents.case_id = ${cases.id}
          AND (
            search_documents.original_name LIKE ${'%' + search + '%'} OR
            search_pages.extracted_text LIKE ${'%' + search + '%'}
          )
        )
      )`
    )
  }

  if (status && status !== 'all') {
    conditions.push(eq(cases.status, status as CaseWithCounts['status']))
  }

  if (type && type !== 'all') {
    conditions.push(eq(cases.caseType, type as CaseWithCounts['caseType']))
  }

  const rows = db
    .select({
      id: cases.id,
      caseNumber: cases.caseNumber,
      title: cases.title,
      description: cases.description,
      status: cases.status,
      caseType: cases.caseType,
      court: cases.court,
      jurisdiction: cases.jurisdiction,
      judge: cases.judge,
      remandDate: cases.remandDate,
      statutoryPeriodDays: cases.statutoryPeriodDays,
      chargesheetFiled: cases.chargesheetFiled,
      chargesheetDate: cases.chargesheetDate,
      createdAt: cases.createdAt,
      updatedAt: cases.updatedAt,
      documentCount: sql<number>`count(distinct ${documents.id})`,
      findingCount: sql<number>`count(distinct ${findings.id})`,
    })
    .from(cases)
    .leftJoin(documents, eq(documents.caseId, cases.id))
    .leftJoin(findings, eq(findings.caseId, cases.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(cases.id)
    .orderBy(cases.createdAt)
    .all()

  return rows as CaseWithCounts[]
}

export function getCaseById(id: number): CaseDetail | null {
  const row = db.select().from(cases).where(eq(cases.id, id)).get()
  return (row as CaseDetail) ?? null
}

// ─── BailBriefData ──────────────────────────────────────────────────────────

export interface BailBriefData {
  case: typeof cases.$inferSelect
  orders: Array<typeof judicialOrders.$inferSelect & { sourceDocument?: string }>
  conditions: Array<typeof bailConditions.$inferSelect & { orderDate?: string; orderType?: string }>
  hearings: Array<typeof hearings.$inferSelect>
  findings: FindingWithSources[]
  documents: Array<typeof documents.$inferSelect>
}

export function getBailBriefData(caseId: number): BailBriefData | null {
  const caseRecord = db.select().from(cases).where(eq(cases.id, caseId)).get()
  if (!caseRecord) return null

  // Orders with joined source document name
  const ordersRaw = db
    .select({
      id: judicialOrders.id,
      caseId: judicialOrders.caseId,
      orderDate: judicialOrders.orderDate,
      orderType: judicialOrders.orderType,
      summary: judicialOrders.summary,
      issuedBy: judicialOrders.issuedBy,
      documentId: judicialOrders.documentId,
      createdAt: judicialOrders.createdAt,
      sourceDocument: documents.originalName,
    })
    .from(judicialOrders)
    .leftJoin(documents, eq(documents.id, judicialOrders.documentId))
    .where(eq(judicialOrders.caseId, caseId))
    .orderBy(judicialOrders.orderDate)
    .all()

  // Bail conditions with joined order date/type
  const conditionsRaw = db
    .select({
      id: bailConditions.id,
      caseId: bailConditions.caseId,
      conditionText: bailConditions.conditionText,
      conditionType: bailConditions.conditionType,
      status: bailConditions.status,
      orderId: bailConditions.orderId,
      createdAt: bailConditions.createdAt,
      orderDate: judicialOrders.orderDate,
      orderType: judicialOrders.orderType,
    })
    .from(bailConditions)
    .leftJoin(judicialOrders, eq(judicialOrders.id, bailConditions.orderId))
    .where(eq(bailConditions.caseId, caseId))
    .all()

  const hearingRows = db
    .select()
    .from(hearings)
    .where(eq(hearings.caseId, caseId))
    .orderBy(hearings.hearingDate)
    .all()

  const findingRows = getFindingsByCaseId(caseId)
  const findingsWithSources: FindingWithSources[] = findingRows.map((f) => {
    const full = getFindingWithSources(f.id)
    return full ?? { ...f, sources: [] }
  })

  const documentRows = db
    .select()
    .from(documents)
    .where(eq(documents.caseId, caseId))
    .all()

  return {
    case: caseRecord as typeof cases.$inferSelect,
    orders: ordersRaw as Array<typeof judicialOrders.$inferSelect & { sourceDocument?: string }>,
    conditions: conditionsRaw as Array<typeof bailConditions.$inferSelect & { orderDate?: string; orderType?: string }>,
    hearings: hearingRows as Array<typeof hearings.$inferSelect>,
    findings: findingsWithSources,
    documents: documentRows as Array<typeof documents.$inferSelect>,
  }
}

export function getCaseStats(): CaseStats {
  const rows = db
    .select({
      status: cases.status,
      cnt: count(),
    })
    .from(cases)
    .groupBy(cases.status)
    .all()

  const result: CaseStats = { total: 0, active: 0, pending: 0, closed: 0, stayed: 0 }
  for (const row of rows) {
    result.total += row.cnt
    if (row.status === 'active') result.active = row.cnt
    if (row.status === 'pending') result.pending = row.cnt
    if (row.status === 'closed') result.closed = row.cnt
    if (row.status === 'stayed') result.stayed = row.cnt
  }
  return result
}
