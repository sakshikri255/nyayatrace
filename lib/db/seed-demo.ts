/**
 * Demo seed for Bail & Parole section.
 * Creates one realistic bail case and one realistic parole case
 * with full related data: orders, conditions, compliance events,
 * surety bonds, hearings, findings, and audit trail.
 *
 * Run with:  npm run db:seed-demo
 */

import Database from 'better-sqlite3'
import path from 'node:path'

const db = new Database(path.join(process.cwd(), 'nyayatrace.db'))
db.pragma('foreign_keys = ON')
db.pragma('journal_mode = WAL')

// ── helpers ──────────────────────────────────────────────────────────────────

function run(sql: string, params: unknown[] = []) {
  return db.prepare(sql).run(...params)
}

function get<T>(sql: string, params: unknown[] = []): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined
}

// ── guard: skip if demo cases already exist ───────────────────────────────────

const existingBail = get<{ id: number }>(
  "SELECT id FROM cases WHERE case_number = ?",
  ['BAIL-DEMO-2024-001']
)
const existingParole = get<{ id: number }>(
  "SELECT id FROM cases WHERE case_number = ?",
  ['PAROLE-DEMO-2024-001']
)

if (existingBail && existingParole) {
  console.log('Demo cases already present. Nothing to do.')
  db.close()
  process.exit(0)
}

const now = new Date().toISOString()

// ════════════════════════════════════════════════════════════════════════════
// BAIL DEMO CASE
// State v. Arjun Ramesh Patil — BAIL-DEMO-2024-001
// ════════════════════════════════════════════════════════════════════════════

let bailCaseId: number

if (!existingBail) {
  // 1. Case record
  const bailCase = db.prepare(`
    INSERT INTO cases (
      case_number, title, description, status, case_type,
      court, judge,
      remand_date, statutory_period_days,
      chargesheet_filed, chargesheet_date,
      applicable_law,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'BAIL-DEMO-2024-001',
    'State v. Arjun Ramesh Patil',
    'FIR No. 312/2024 registered at Andheri Police Station under Sections 302, 307, 120-B IPC. Accused arrested on 14 March 2024 and produced before the Metropolitan Magistrate. The accused is alleged to have caused grievous hurt in connection with a property dispute. Chargesheet has not yet been filed and the statutory period is running.',
    'active',
    'bail',
    'Sessions Court, Mumbai — Court No. 7',
    'Hon\'ble Smt. R.V. Kulkarni, ASJ',
    '2024-03-14',
    90,
    0,
    null,
    'bnss',
    now, now
  )
  bailCaseId = bailCase.lastInsertRowid as number
  console.log(`✓ Bail case inserted  — id ${bailCaseId}`)

  // 2. Judicial orders
  const order1 = db.prepare(`
    INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    bailCaseId,
    '2024-03-14',
    'other',
    'First production and remand order. Accused remanded to judicial custody for 14 days. Matter listed for 28 March 2024.',
    'Metropolitan Magistrate, 12th Court, Andheri',
    now
  )
  const order1Id = order1.lastInsertRowid as number

  const order2 = db.prepare(`
    INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    bailCaseId,
    '2024-03-28',
    'other',
    'Second remand. Custody extended for a further 14 days on application by the Investigating Officer who cited ongoing recovery proceedings. Next date: 11 April 2024.',
    'Metropolitan Magistrate, 12th Court, Andheri',
    now
  )
  const order2Id = order2.lastInsertRowid as number

  const order3 = db.prepare(`
    INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    bailCaseId,
    '2024-04-08',
    'bail_order',
    'Bail application under Section 439 CrPC preferred by the accused. Heard and dismissed on grounds of gravity of offence (Sec 302 IPC) and likelihood of tampering with evidence. Liberty given to re-apply after 6 weeks.',
    'Sessions Court, Mumbai — Court No. 7',
    now
  )
  const order3Id = order3.lastInsertRowid as number

  console.log(`  ↳ 3 judicial orders inserted`)

  // 3. Bail conditions (from the application order, noted for future grant)
  const cond1 = db.prepare(`
    INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    bailCaseId,
    'Furnish personal bond of ₹1,00,000 with two solvent sureties of ₹50,000 each to the satisfaction of the Magistrate.',
    'surety',
    'active',
    order3Id,
    now
  )
  const cond1Id = cond1.lastInsertRowid as number

  const cond2 = db.prepare(`
    INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    bailCaseId,
    'Accused shall not leave the jurisdiction of Mumbai without prior written permission from the Investigating Officer and the Court.',
    'travel',
    'active',
    order3Id,
    now
  )
  const cond2Id = cond2.lastInsertRowid as number

  const cond3 = db.prepare(`
    INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    bailCaseId,
    'Report to Andheri Police Station every Monday between 10:00 AM and 12:00 PM.',
    'reporting',
    'active',
    order3Id,
    now
  )
  const cond3Id = cond3.lastInsertRowid as number

  console.log(`  ↳ 3 bail conditions inserted`)

  // 4. Surety bond for surety condition
  db.prepare(`
    INSERT INTO surety_bonds (condition_id, surety_name, relationship, bond_amount, document_reference, verification_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    cond1Id,
    'Suresh Ramesh Patil',
    'Brother',
    '₹1,00,000 (Personal Bond)',
    'Surety Affidavit dated 18 Mar 2024 — filed with registry',
    'verified',
    now, now
  )
  console.log(`  ↳ Surety bond inserted`)

  // 5. Compliance events for reporting condition
  const complianceDates = ['2024-04-15', '2024-04-22', '2024-04-29', '2024-05-06']
  for (const d of complianceDates) {
    db.prepare(`
      INSERT INTO condition_compliance_events (condition_id, event_date, event_type, note, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(cond3Id, d, 'complied', 'Reported as scheduled. Signed attendance register.', now)
  }
  // One violation
  db.prepare(`
    INSERT INTO condition_compliance_events (condition_id, event_date, event_type, note, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(cond3Id, '2024-05-13', 'violated', 'Failed to report. Received court notice on 14 May 2024.', now)
  console.log(`  ↳ 5 compliance events inserted (4 complied, 1 violated)`)

  // Update condition status to revoked (because of violation)
  db.prepare(`UPDATE bail_conditions SET status = 'revoked' WHERE id = ?`).run(cond3Id)

  // 6. Hearings
  const hearingsData = [
    ['2024-03-14', 'bail_hearing',   'First production before Magistrate. Remand order passed for 14 days.',                                   'Remanded to judicial custody for 14 days.', 'MM 12th Court, Andheri'],
    ['2024-03-28', 'bail_hearing',   'Second remand hearing. IO requested extension citing recovery pending.',                                  'Custody extended for 14 more days.',         'MM 12th Court, Andheri'],
    ['2024-04-08', 'bail_hearing',   'Bail application filed under Sec 439 CrPC. Prosecution opposed strongly citing gravity and risk of tampering.', 'Bail refused. Liberty to re-apply after 6 weeks.', 'Sessions Court No. 7, Mumbai'],
    ['2024-05-20', 'bail_hearing',   'Renewed bail application. Defence cited 67 days in custody without chargesheet — statutory period almost expired.', null, 'Sessions Court No. 7, Mumbai'],
    ['2024-06-10', 'bail_hearing',   'Statutory default bail hearing. Accused filed application under Sec 187 BNSS citing expiry of 90-day period without chargesheet.', null, 'Sessions Court No. 7, Mumbai'],
  ]
  for (const [date, type, desc, outcome, court] of hearingsData) {
    db.prepare(`
      INSERT INTO hearings (case_id, hearing_date, event_type, description, outcome, judge, court, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bailCaseId, date, type, desc,
      outcome ?? null,
      'Hon\'ble Smt. R.V. Kulkarni, ASJ',
      court, now
    )
  }
  console.log(`  ↳ 5 hearings inserted`)

  // 7. Audit events (bail field changes)
  db.prepare(`
    INSERT INTO audit_events (case_id, event_type, description, performed_at)
    VALUES (?, ?, ?, ?)
  `).run(
    bailCaseId,
    'bail_field_changed',
    JSON.stringify({ field: 'remandDate', oldValue: null, newValue: '2024-03-14' }),
    now
  )
  db.prepare(`
    INSERT INTO audit_events (case_id, event_type, description, performed_at)
    VALUES (?, ?, ?, ?)
  `).run(
    bailCaseId,
    'bail_field_changed',
    JSON.stringify({ field: 'statutoryPeriodDays', oldValue: 60, newValue: 90 }),
    now
  )
  db.prepare(`
    INSERT INTO audit_events (case_id, event_type, description, performed_at)
    VALUES (?, ?, ?, ?)
  `).run(
    bailCaseId,
    'bail_field_changed',
    JSON.stringify({ field: 'applicableLaw', oldValue: 'auto', newValue: 'bnss' }),
    now
  )
  console.log(`  ↳ 3 audit events inserted`)

} else {
  bailCaseId = existingBail.id
  console.log(`→ Bail case already exists (id ${bailCaseId}), skipping.`)
}


// ════════════════════════════════════════════════════════════════════════════
// PAROLE DEMO CASE
// State of Maharashtra v. Ramkumar Devnath Iyer — PAROLE-DEMO-2024-001
// ════════════════════════════════════════════════════════════════════════════

let paroleCaseId: number

if (!existingParole) {
  // 1. Case record
  const paroleCase = db.prepare(`
    INSERT INTO cases (
      case_number, title, description, status, case_type,
      court, judge,
      parole_grant_date, parole_end_date, parole_reporting_frequency,
      applicable_law,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'PAROLE-DEMO-2024-001',
    'State of Maharashtra v. Ramkumar Devnath Iyer',
    'Convicted under Section 304 IPC — Culpable Homicide Not Amounting to Murder. Sentenced to 7 years Rigorous Imprisonment by Sessions Court, Pune on 12 January 2020. Currently serving sentence at Yerawada Central Prison. Parole granted on medical grounds (mother\'s critical illness) for 30 days commencing 1 June 2024. Parolee is required to report fortnightly to Hadapsar Police Station. Parole expires 1 July 2024.',
    'active',
    'parole',
    'Sessions Court, Pune — Court No. 3',
    'Hon\'ble Shri D.K. Patwardhan, ASJ',
    '2024-06-01',
    '2024-07-01',
    'fortnightly',
    'bnss',
    now, now
  )
  paroleCaseId = paroleCase.lastInsertRowid as number
  console.log(`\n✓ Parole case inserted — id ${paroleCaseId}`)

  // 2. Judicial orders
  const pOrder1 = db.prepare(`
    INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    paroleCaseId,
    '2020-01-12',
    'sentence',
    'Conviction and sentencing order. Accused found guilty under Section 304 Part II IPC. Sentenced to 7 years Rigorous Imprisonment with a fine of ₹10,000. Benefit of Section 428 CrPC allowed for pre-trial custody of 14 months.',
    'Sessions Court, Pune — Court No. 3',
    now
  )

  const pOrder2 = db.prepare(`
    INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    paroleCaseId,
    '2024-05-28',
    'bail_order',
    'Parole granted under Maharashtra Prisons (Bombay Furlough and Parole) Rules on humanitarian grounds — critical illness of mother. Parole period: 30 days from 1 June 2024 to 1 July 2024. Conditions imposed: fortnightly reporting, no travel outside Pune district, surrender on expiry.',
    'Inspector General of Prisons, Maharashtra',
    now
  )
  const pOrder2Id = pOrder2.lastInsertRowid as number

  console.log(`  ↳ 2 judicial orders inserted`)

  // 3. Parole conditions
  const pCond1 = db.prepare(`
    INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    paroleCaseId,
    'Parolee shall report to Hadapsar Police Station every fortnight — on 15 June 2024 and 30 June 2024 — between 10:00 AM and 11:00 AM.',
    'reporting',
    'active',
    pOrder2Id,
    now
  )
  const pCond1Id = pCond1.lastInsertRowid as number

  const pCond2 = db.prepare(`
    INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    paroleCaseId,
    'Parolee shall not travel outside the limits of Pune Municipal Corporation without prior written permission from the Superintendent, Yerawada Central Prison.',
    'travel',
    'active',
    pOrder2Id,
    now
  )

  const pCond3 = db.prepare(`
    INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    paroleCaseId,
    'Parolee shall furnish a surety bond of ₹25,000 with one local surety acceptable to the Superintendent before release.',
    'surety',
    'completed',
    pOrder2Id,
    now
  )
  const pCond3Id = pCond3.lastInsertRowid as number

  console.log(`  ↳ 3 parole conditions inserted`)

  // 4. Surety bond for parole surety condition
  db.prepare(`
    INSERT INTO surety_bonds (condition_id, surety_name, relationship, bond_amount, document_reference, verification_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    pCond3Id,
    'Kavitha Ramkumar Iyer',
    'Wife',
    '₹25,000',
    'Surety bond executed on 31 May 2024 before Superintendent, Yerawada Prison',
    'verified',
    now, now
  )
  console.log(`  ↳ Surety bond inserted`)

  // 5. Compliance events for reporting condition
  db.prepare(`
    INSERT INTO condition_compliance_events (condition_id, event_date, event_type, note, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(pCond1Id, '2024-06-15', 'complied', 'Reported at 10:15 AM. Signed reporting register. Officer verified identity.', now)

  db.prepare(`
    INSERT INTO condition_compliance_events (condition_id, event_date, event_type, note, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(pCond1Id, '2024-06-30', 'complied', 'Reported at 10:00 AM. Requested 2-day extension for parole to attend mother\'s hospital discharge. Request forwarded to IG Prisons.', now)

  console.log(`  ↳ 2 compliance events inserted (both complied)`)

  // 6. Hearings / events
  const pHearings = [
    ['2020-01-12', 'judgment',     'Final arguments concluded. Judgment pronounced. Accused convicted under Section 304 Part II IPC and sentenced to 7 years RI.',     'Convicted. 7 years RI + ₹10,000 fine.',  'Sessions Court No. 3, Pune'],
    ['2024-05-20', 'bail_hearing', 'Parole application filed on humanitarian grounds by the accused through jail authorities. Medical certificate of mother attached.', 'Parole granted for 30 days effective 1 June 2024.', 'IG Prisons Office, Pune'],
    ['2024-06-01', 'order',        'Formal release from Yerawada Central Prison on parole. Conditions explained and acknowledged by parolee. Bond executed.',          'Released on parole.',                    'Yerawada Central Prison'],
  ]
  for (const [date, type, desc, outcome, court] of pHearings) {
    db.prepare(`
      INSERT INTO hearings (case_id, hearing_date, event_type, description, outcome, judge, court, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      paroleCaseId, date, type, desc, outcome,
      'Hon\'ble Shri D.K. Patwardhan, ASJ',
      court, now
    )
  }
  console.log(`  ↳ 3 hearings inserted`)

  // 7. Audit events
  db.prepare(`
    INSERT INTO audit_events (case_id, event_type, description, performed_at)
    VALUES (?, ?, ?, ?)
  `).run(
    paroleCaseId,
    'bail_field_changed',
    JSON.stringify({ field: 'paroleGrantDate', oldValue: null, newValue: '2024-06-01' }),
    now
  )
  db.prepare(`
    INSERT INTO audit_events (case_id, event_type, description, performed_at)
    VALUES (?, ?, ?, ?)
  `).run(
    paroleCaseId,
    'bail_field_changed',
    JSON.stringify({ field: 'paroleEndDate', oldValue: null, newValue: '2024-07-01' }),
    now
  )
  db.prepare(`
    INSERT INTO audit_events (case_id, event_type, description, performed_at)
    VALUES (?, ?, ?, ?)
  `).run(
    paroleCaseId,
    'bail_field_changed',
    JSON.stringify({ field: 'paroleReportingFrequency', oldValue: null, newValue: 'fortnightly' }),
    now
  )
  console.log(`  ↳ 3 audit events inserted`)

} else {
  paroleCaseId = existingParole.id
  console.log(`\n→ Parole case already exists (id ${paroleCaseId}), skipping.`)
}

db.close()
console.log('\n✅ Demo seeding complete.')
console.log(`   Bail case  → /bail-briefs/${bailCaseId}`)
console.log(`   Parole case → /bail-briefs/${paroleCaseId}`)
