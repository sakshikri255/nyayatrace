import { db } from '@/lib/db'
import { cases, hearings, judicialOrders, documents, findings, findingSources } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { calculateStatutoryBail } from './statutoryBail'
import { parseISO, isValid, compareAsc, differenceInDays } from 'date-fns'

export interface ChronologyEvent {
  id: string
  date: string
  title: string
  category: 'incident' | 'fir' | 'arrest' | 'remand' | 'hearing' | 'order' | 'chargesheet' | 'statutory_bail' | 'discrepancy' | 'general'
  description: string
  source: string
  documentId?: number
  pageNumber?: number
  hasConflict: boolean
  conflictSeverity?: 'high' | 'medium' | 'low'
  conflictReason?: string
}

export interface ChronologyReport {
  caseId: number
  events: ChronologyEvent[]
  conflicts: Array<{
    title: string
    severity: 'high' | 'medium' | 'low'
    description: string
    relatedEventIds: string[]
  }>
  dateRange: {
    firstDate: string | null
    lastDate: string | null
    totalDays: number
  }
}

export function buildCaseChronology(caseId: number): ChronologyReport {
  const caseRecord = db.select().from(cases).where(eq(cases.id, caseId)).get()
  if (!caseRecord) {
    return {
      caseId,
      events: [],
      conflicts: [],
      dateRange: { firstDate: null, lastDate: null, totalDays: 0 },
    }
  }

  const events: ChronologyEvent[] = []

  // 1. Remand Date & Statutory Bail Deadline
  const statBail = calculateStatutoryBail(caseRecord)
  if (statBail.isCalculable && statBail.remandDate) {
    events.push({
      id: `remand-${caseId}`,
      date: statBail.remandDate,
      title: 'First Judicial Remand',
      category: 'remand',
      description: `Accused remanded into custody. Clock for ${statBail.statutoryPeriodDays}-day statutory bail started.`,
      source: 'Case Custody Record',
      hasConflict: false,
    })

    if (statBail.deadlineDate) {
      events.push({
        id: `statutory-deadline-${caseId}`,
        date: statBail.deadlineDate,
        title: `Statutory Bail Deadline (${statBail.statutoryPeriodDays} Days)`,
        category: 'statutory_bail',
        description: `Mandatory deadline for investigation agency to submit chargesheet under Section 167(2) CrPC / Section 187 BNSS.`,
        source: 'Statutory Law',
        hasConflict: statBail.status === 'accrued' || statBail.status === 'filed_delayed',
        conflictSeverity: 'high',
        conflictReason:
          statBail.status === 'accrued'
            ? 'Chargesheet was not submitted within the statutory period! Accused entitled to immediate default bail.'
            : statBail.status === 'filed_delayed'
            ? 'Chargesheet was submitted after statutory deadline elapsed.'
            : undefined,
      })
    }
  }

  // 2. Chargesheet Date
  if (caseRecord.chargesheetDate) {
    events.push({
      id: `chargesheet-${caseId}`,
      date: caseRecord.chargesheetDate,
      title: 'Police Chargesheet Filed',
      category: 'chargesheet',
      description: `Investigation report / final chargesheet submitted by the investigating officer.`,
      source: 'Court Record',
      hasConflict: statBail.status === 'filed_delayed',
      conflictSeverity: 'high',
      conflictReason: statBail.status === 'filed_delayed' ? statBail.legalGround : undefined,
    })
  }

  // 3. Hearings
  const hearingRows = db.select().from(hearings).where(eq(hearings.caseId, caseId)).all()
  for (const h of hearingRows) {
    events.push({
      id: `hearing-${h.id}`,
      date: h.hearingDate,
      title: `Hearing: ${h.eventType.replace(/_/g, ' ').toUpperCase()}`,
      category: 'hearing',
      description: [h.description, h.outcome ? `Outcome: ${h.outcome}` : null, h.judge ? `Judge: ${h.judge}` : null]
        .filter(Boolean)
        .join(' | ') || 'Court hearing',
      source: h.sourceDocument || 'Court Cause List',
      hasConflict: false,
    })
  }

  // 4. Judicial Orders
  const orderRows = db
    .select({
      id: judicialOrders.id,
      orderDate: judicialOrders.orderDate,
      orderType: judicialOrders.orderType,
      summary: judicialOrders.summary,
      issuedBy: judicialOrders.issuedBy,
      docName: documents.originalName,
      docId: judicialOrders.documentId,
    })
    .from(judicialOrders)
    .leftJoin(documents, eq(documents.id, judicialOrders.documentId))
    .where(eq(judicialOrders.caseId, caseId))
    .all()

  for (const o of orderRows) {
    events.push({
      id: `order-${o.id}`,
      date: o.orderDate,
      title: `Judicial Order: ${o.orderType.replace(/_/g, ' ').toUpperCase()}`,
      category: 'order',
      description: [o.summary, o.issuedBy ? `Issued by: ${o.issuedBy}` : null].filter(Boolean).join(' | ') || 'Judicial order',
      source: o.docName || 'Judicial Order',
      documentId: o.docId ?? undefined,
      hasConflict: false,
    })
  }

  // 5. Findings with Date Discrepancies
  const findingRows = db.select().from(findings).where(eq(findings.caseId, caseId)).all()
  for (const f of findingRows) {
    if (f.findingType === 'date_discrepancy') {
      const srcList = db
        .select({
          docId: findingSources.documentId,
          docName: documents.originalName,
          pageNumber: findingSources.pageNumber,
          passage: findingSources.passage,
          role: findingSources.role,
        })
        .from(findingSources)
        .leftJoin(documents, eq(documents.id, findingSources.documentId))
        .where(eq(findingSources.findingId, f.id))
        .all()

      const primary = srcList.find((s) => s.role === 'primary') ?? srcList[0]
      const comparison = srcList.find((s) => s.role === 'comparison')

      const dateStr = f.extractedValue || (f.createdAt ? f.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10))

      events.push({
        id: `finding-${f.id}`,
        date: dateStr,
        title: `Contradiction: Date Discrepancy (${f.severity.toUpperCase()})`,
        category: 'discrepancy',
        description: `${f.description} (Record 1: "${f.extractedValue}" vs Record 2: "${f.comparisonValue}")`,
        source: primary?.docName ? `${primary.docName} p.${primary.pageNumber}` : 'Case Analysis',
        documentId: primary?.docId ?? undefined,
        pageNumber: primary?.pageNumber ?? undefined,
        hasConflict: true,
        conflictReason: comparison?.docName
          ? `Conflicting date: ${primary?.docName ?? 'Exhibit 1'} (${f.extractedValue}) vs ${comparison.docName} (${f.comparisonValue}).`
          : `Conflicting dates across exhibits: Primary document states "${f.extractedValue}" while comparison document states "${f.comparisonValue}".`,
      })
    }
  }

  // Sort events chronologically
  events.sort((a, b) => {
    const da = parseISO(a.date)
    const db = parseISO(b.date)
    if (isValid(da) && isValid(db)) {
      return compareAsc(da, db)
    }
    return a.date.localeCompare(b.date)
  })

  // Collect conflicts
  const conflicts: ChronologyReport['conflicts'] = []

  // High-level conflict checks
  if (statBail.status === 'accrued') {
    conflicts.push({
      title: 'Statutory Bail Right Accrued (Section 167(2) CrPC / Section 187 BNSS)',
      severity: 'high',
      description: statBail.legalGround,
      relatedEventIds: [`remand-${caseId}`, `statutory-deadline-${caseId}`],
    })
  }

  for (const ev of events) {
    if (ev.hasConflict && ev.conflictReason && ev.category === 'discrepancy') {
      conflicts.push({
        title: ev.title,
        severity: ev.conflictSeverity ?? 'medium',
        description: ev.conflictReason,
        relatedEventIds: [ev.id],
      })
    }
  }

  const validDates = events
    .map((e) => parseISO(e.date))
    .filter((d) => isValid(d))
    .sort(compareAsc)

  const firstDate = validDates.length > 0 ? validDates[0].toISOString().slice(0, 10) : null
  const lastDate = validDates.length > 0 ? validDates[validDates.length - 1].toISOString().slice(0, 10) : null
  const totalDays = firstDate && lastDate ? differenceInDays(parseISO(lastDate), parseISO(firstDate)) : 0

  return {
    caseId,
    events,
    conflicts,
    dateRange: { firstDate, lastDate, totalDays },
  }
}
