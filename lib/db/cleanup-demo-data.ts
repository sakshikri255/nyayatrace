import { and, eq } from 'drizzle-orm'
import { db } from './index'
import { auditEvents, cases } from './schema'

const seededCases = [
  { id: 1, caseNumber: 'FIR-2023-0042', title: 'Mehta vs State — Date Discrepancy' },
  { id: 2, caseNumber: 'FIR-2022-0189', title: 'Sharma — Witness Statement vs Investigation Report' },
  { id: 3, caseNumber: 'FIR-2021-0311', title: 'Kapoor — Poor Scan Quality, Partial Extraction' },
  { id: 4, caseNumber: 'BAIL-2023-0017', title: 'Desai — Bail Order with Conditions' },
  { id: 5, caseNumber: 'CRL-2020-0554', title: 'Reddy — Long-Running Criminal Trial' },
  { id: 6, caseNumber: 'CRL-2022-0078', title: 'Nair — Address Variation, Closed Case' },
  { id: 7, caseNumber: 'PAROLE-2024-0003', title: 'Iyer — Parole Application with Conditions' },
  { id: 8, caseNumber: 'CRL-2019-0882', title: 'Singh — Stayed Proceedings, Name Variation' },
] as const

const seededAuditEvents = [
  { eventType: 'finding_created', description: 'Date discrepancy finding created for FIR-2023-0042' },
  { eventType: 'finding_reviewed', description: 'Name variation finding marked as not_a_discrepancy for FIR-2022-0189' },
  { eventType: 'finding_reviewed', description: 'Date discrepancy finding verified for CRL-2020-0554' },
  { eventType: 'finding_reviewed', description: 'Address variation finding marked as not_a_discrepancy for CRL-2022-0078' },
  { eventType: 'finding_created', description: 'Name variation finding created for CRL-2019-0882' },
  { eventType: 'seed_complete', description: 'Demo data seeded successfully — 8 fictional cases created' },
] as const

const removed = db.transaction((transaction) => {
  let count = 0
  for (const seededCase of seededCases) {
    count += transaction
      .delete(cases)
      .where(
        and(
          eq(cases.id, seededCase.id),
          eq(cases.caseNumber, seededCase.caseNumber),
          eq(cases.title, seededCase.title)
        )
      )
      .run().changes
  }
  for (const event of seededAuditEvents) {
    count += transaction
      .delete(auditEvents)
      .where(and(eq(auditEvents.eventType, event.eventType), eq(auditEvents.description, event.description)))
      .run().changes
  }
  return count
})

console.log(`Removed ${removed} exact seeded cases and audit events. Other records were not changed.`)