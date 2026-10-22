/**
 * Showcase seed for Bail & Parole features.
 *
 * Creates THREE cases, each designed to demonstrate a distinct
 * feature-state in the application:
 *
 *  1. BAIL-SHOW-001  — Default Bail ACCRUED (100+ days in custody, no chargesheet)
 *     → Statutory Bail Tracker shows red "Default Bail Ready!" alert
 *     → 5 hearings, 4 bail conditions, 2 surety bonds, compliance violations
 *     → Rich findings (date discrepancy, missing info, name variation)
 *
 *  2. BAIL-SHOW-002  — Chargesheet Filed On Time (bail already granted)
 *     → Statutory Bail Tracker shows green "Chargesheet Filed Within Period"
 *     → Bail conditions active/completed mix, surety verified
 *     → Next hearing scheduled in the future
 *
 *  3. PAROLE-SHOW-001 — Parole Expiring Soon (≤5 days left)
 *     → Parole Timeline Card shows amber urgent countdown
 *     → Weekly reporting conditions with compliance log
 *     → Surety bond verified
 *
 * Run with:  npm run db:seed-showcase
 * Remove with: npm run db:seed-showcase:remove  (not implemented – delete manually)
 */

import Database from 'better-sqlite3'
import path from 'node:path'

const db = new Database(path.join(process.cwd(), 'nyayatrace.db'))
db.pragma('foreign_keys = ON')
db.pragma('journal_mode = WAL')

// ── helpers ──────────────────────────────────────────────────────────────────

function get<T>(sql: string, params: unknown[] = []): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined
}

function run(sql: string, params: unknown[] = []) {
  return db.prepare(sql).run(...params)
}

/** Return a date string relative to today */
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// ── guard: skip if showcase cases already exist ───────────────────────────────

const existingShow1 = get<{ id: number }>("SELECT id FROM cases WHERE case_number = ?", ['BAIL-SHOW-001'])
const existingShow2 = get<{ id: number }>("SELECT id FROM cases WHERE case_number = ?", ['BAIL-SHOW-002'])
const existingShow3 = get<{ id: number }>("SELECT id FROM cases WHERE case_number = ?", ['PAROLE-SHOW-001'])

if (existingShow1 && existingShow2 && existingShow3) {
  console.log('Showcase cases already present. Nothing to do.')
  db.close()
  process.exit(0)
}

const now = new Date().toISOString()

// ════════════════════════════════════════════════════════════════════════════
// CASE 1 — BAIL-SHOW-001
// State v. Vikram Suresh Nair
// Feature: DEFAULT BAIL ACCRUED — 60-day period expired, no chargesheet filed
// ════════════════════════════════════════════════════════════════════════════

let show1Id: number

if (!existingShow1) {
  const remandDate1 = daysAgo(95)  // 95 days ago → 60-day period expired by 35 days (ACCRUED!)

  const r1 = run(`
    INSERT INTO cases (
      case_number, title, description, status, case_type,
      court, judge, advocate,
      remand_date, statutory_period_days,
      chargesheet_filed, chargesheet_date,
      applicable_law,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'BAIL-SHOW-001',
    'State v. Vikram Suresh Nair',
    `FIR No. 187/2024 registered at Dadar Police Station under Sections 420, 468, 471 IPC (Cheating, Forgery). Accused arrested on ${remandDate1} following a financial fraud complaint by a cooperative society. Chargesheet has NOT been filed within the 60-day statutory period. Accused holds an accrued right to default bail under Sec 167(2) CrPC / Sec 187 BNSS. Application filed — matter listed for orders.`,
    'active',
    'bail',
    'Sessions Court, Mumbai — Court No. 12',
    "Hon'ble Shri P.R. Deshmukh, ASJ",
    'Aditi Sharma',
    remandDate1,
    60,     // 60-day limit
    0,      // chargesheet NOT filed
    null,
    'crpc',
    now, now
  ])
  show1Id = r1.lastInsertRowid as number
  console.log(`\n✓ [BAIL-SHOW-001] Case inserted — id ${show1Id}  (remand: ${remandDate1})`)

  // Judicial orders
  const o1a = run(`
    INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [show1Id, remandDate1, 'other', `First production. Accused produced before the Chief Metropolitan Magistrate and remanded to judicial custody for 14 days. Next date fixed for ${daysAgo(81)}.`, 'CMM Court, Mumbai', now])

  run(`
    INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [show1Id, daysAgo(81), 'other', 'Second remand. Police requested 14-day extension citing ongoing forensic examination of forged documents and accounting records. Custody extended.', 'CMM Court, Mumbai', now])

  run(`
    INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [show1Id, daysAgo(67), 'other', 'Third remand. Accused filed bail application; adjourned for hearing. Police custodial extension granted for 7 days for recovery of documents.', 'Sessions Court No. 12, Mumbai', now])

  const o1b = run(`
    INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [show1Id, daysAgo(60), 'bail_order', 'Bail application under Sec 439 CrPC heard and dismissed on grounds of complexity of financial fraud, multiple complainants, and risk of evidence tampering. Defence counsel put on notice of approaching statutory deadline.', 'Sessions Court No. 12, Mumbai', now])
  const bailOrderId1 = o1b.lastInsertRowid as number

  run(`
    INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [show1Id, daysAgo(5), 'bail_order', `Application for Default Bail under Sec 167(2) CrPC filed. Chargesheet not filed within 60-day period from ${remandDate1}. Matter listed for orders on ${daysFromNow(3)}.`, 'Sessions Court No. 12, Mumbai', now])

  console.log(`  ↳ 5 judicial orders inserted`)

  // Bail conditions (from dismissed bail application — noted for if bail granted)
  const c1a = run(`
    INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [show1Id, 'Personal bond of ₹2,00,000 with two solvent sureties of ₹1,00,000 each to the satisfaction of the court.', 'surety', 'active', bailOrderId1, now])
  const c1aId = c1a.lastInsertRowid as number

  const c1b = run(`
    INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [show1Id, 'Accused shall surrender his passport to the Investigating Officer within 48 hours of release.', 'activity', 'active', bailOrderId1, now])
  const c1bId = c1b.lastInsertRowid as number

  const c1c = run(`
    INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [show1Id, 'Report to Dadar Police Station every Friday between 11:00 AM and 1:00 PM.', 'reporting', 'active', bailOrderId1, now])
  const c1cId = c1c.lastInsertRowid as number

  run(`
    INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [show1Id, 'Accused shall not contact any of the complainants or witnesses named in the FIR, directly or indirectly.', 'activity', 'active', bailOrderId1, now])

  console.log(`  ↳ 4 bail conditions inserted`)

  // Surety bonds (only one filed — second pending)
  run(`
    INSERT INTO surety_bonds (condition_id, surety_name, relationship, bond_amount, document_reference, verification_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [c1aId, 'Meena Suresh Nair', 'Spouse', '₹1,00,000', 'Affidavit dated ' + daysAgo(3) + ' filed with registry', 'verified', now, now])

  run(`
    INSERT INTO surety_bonds (condition_id, surety_name, relationship, bond_amount, document_reference, verification_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [c1aId, 'Rajan Krishnamurthy', 'Business Associate', '₹1,00,000', 'Surety affidavit under review', 'pending', now, now])

  console.log(`  ↳ 2 surety bonds inserted (1 verified, 1 pending)`)

  // Compliance events — reporting condition (mixed)
  const reportDates = [daysAgo(88), daysAgo(81), daysAgo(74), daysAgo(67), daysAgo(60), daysAgo(53), daysAgo(46)]
  for (const d of reportDates) {
    run(`INSERT INTO condition_compliance_events (condition_id, event_date, event_type, note, created_at) VALUES (?, ?, ?, ?, ?)`,
      [c1cId, d, 'complied', 'Reported as scheduled. Entry made in station diary.', now])
  }
  // Two violations when bail was rejected
  run(`INSERT INTO condition_compliance_events (condition_id, event_date, event_type, note, created_at) VALUES (?, ?, ?, ?, ?)`,
    [c1cId, daysAgo(39), 'violated', 'Failed to report. Family stated accused was hospitalised. Medical certificate submitted later.', now])
  run(`INSERT INTO condition_compliance_events (condition_id, event_date, event_type, note, created_at) VALUES (?, ?, ?, ?, ?)`,
    [c1cId, daysAgo(32), 'complied', 'Reported. Produced hospital discharge certificate. Noted in diary.', now])

  // Activity compliance — passport surrender (complied immediately)
  run(`INSERT INTO condition_compliance_events (condition_id, event_date, event_type, note, created_at) VALUES (?, ?, ?, ?, ?)`,
    [c1bId, daysAgo(87), 'complied', 'Passport No. P2819044 surrendered to IO Insp. R. Gaikwad. Receipt issued.', now])

  console.log(`  ↳ 10 compliance events inserted`)

  // Hearings
  const h1 = [
    [remandDate1,   'bail_hearing',  `First production. Arrested under Sec 420/468/471 IPC. Remanded to judicial custody. Bail opposed by prosecution citing gravity and flight risk.`, 'Remanded to JC for 14 days.',                       'CMM Court, Mumbai'],
    [daysAgo(81),   'bail_hearing',  'Second remand hearing. Forensic team examining forged DDs and account ledgers. IO requested extension. Defence filed bail application — listed for arguments.', 'Custody extended 14 days.',               'CMM Court, Mumbai'],
    [daysAgo(67),   'bail_hearing',  'Third remand. Bail arguments not taken up — adjourned due to court roster change. Prosecution cited pending CDR analysis.', 'Adjourned to ' + daysAgo(60),                                              'Sessions Court No. 12, Mumbai'],
    [daysAgo(60),   'bail_hearing',  'Bail application argued. Prosecution strongly opposed citing ₹45 lakh fraud, 12 complainants, and risk of document destruction. Defence cited clean antecedents and family responsibilities.', 'Bail refused. Liberty to re-apply after 4 weeks.', 'Sessions Court No. 12, Mumbai'],
    [daysAgo(5),    'bail_hearing',  `Default Bail application filed under Sec 167(2) CrPC. Chargesheet not filed within 60 days from remand date ${remandDate1}. Defence argued accrued right is absolute and unconditional.`, null, 'Sessions Court No. 12, Mumbai'],
  ]
  for (const [date, type, desc, outcome, court] of h1) {
    run(`INSERT INTO hearings (case_id, hearing_date, event_type, description, outcome, judge, court, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [show1Id, date, type, desc, outcome ?? null, "Hon'ble Shri P.R. Deshmukh, ASJ", court, now])
  }
  // Schedule future hearing for default bail orders
  run(`INSERT INTO hearings (case_id, hearing_date, event_type, description, outcome, judge, court, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [show1Id, daysFromNow(3), 'bail_hearing', `Orders on Default Bail application. Prosecution to file reply. Court to consider accrued right under Sec 167(2) CrPC.`, null, "Hon'ble Shri P.R. Deshmukh, ASJ", 'Sessions Court No. 12, Mumbai', now])
  console.log(`  ↳ 6 hearings inserted (1 upcoming)`)

  // Documents (with OCR text)
  const d1a = run(`
    INSERT INTO documents (case_id, filename, original_name, file_type, page_count, processing_status, processed_at, upload_date, file_size, file_hash, language, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [show1Id, 'bail-show-001-fir.pdf', 'FIR_187_2024_Dadar.pdf', 'pdf', 2, 'complete', now, now, 48200, 'sha256-show001-fir', 'eng', now])
  const d1aId = d1a.lastInsertRowid as number

  run(`INSERT INTO pages (document_id, page_number, extracted_text, quality, created_at) VALUES (?, ?, ?, ?, ?)`, [
    d1aId, 1,
    `FIRST INFORMATION REPORT (Under Section 154 Cr.P.C.)
FIR No.: 187/2024   Date: ${remandDate1}   Police Station: Dadar, Mumbai
Offence: Sections 420, 468, 471 Indian Penal Code
Complainant: Shri Govind Ramchandra Phadke, Secretary, Sahyadri Co-operative Housing Society
Accused: Vikram Suresh Nair, Age 41, R/o Flat 304, Shivam Apartments, Parel, Mumbai
FIR Summary: Complainant alleges that accused, posing as a licensed architect, collected ₹45,00,000 from 12 members of the society for a fictitious renovation project. Forged receipts, demand drafts and architect's certificates were issued. No work was commenced. Accused not contactable since February 2024.
Arrested: ${remandDate1} at 14:30 hrs from Mumbai Airport.
Investigation Officer: Inspector Rajendra Gaikwad, Dadar PS (Badge No. 4721)`,
    'good', now
  ])

  run(`INSERT INTO pages (document_id, page_number, extracted_text, quality, created_at) VALUES (?, ?, ?, ?, ?)`, [
    d1aId, 2,
    `PANCHNAMA OF ARREST — ${remandDate1}
Accused: Vikram Suresh Nair
Articles recovered: (1) Laptop — Dell Inspiron, Serial No. DL78234 (2) Mobile phone — iPhone 13, IMEI 356901234567890 (3) Diary containing accounts (4) Bundle of forged demand drafts — 12 nos.
Memo of arrest drawn up before panch witnesses:
Witness 1: Shri Dilip Narkar, Panchayat member
Witness 2: Smt. Lakshmi Bhosale, Society member
Arresting Officer: Insp. R. Gaikwad, Badge 4721
IMPORTANT NOTE: Date on laptop timestamp shows 14 Feb 2024 as last login — INCONSISTENCY with accused's claimed alibi of being in Pune on that date (see witness statement PW-3 dated ${daysAgo(70)}).`,
    'good', now
  ])

  const d1b = run(`
    INSERT INTO documents (case_id, filename, original_name, file_type, page_count, processing_status, processed_at, upload_date, file_size, file_hash, language, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [show1Id, 'bail-show-001-remand.pdf', 'Remand_Order_${remandDate1}.pdf', 'pdf', 1, 'complete', now, now, 22100, 'sha256-show001-remand', 'eng', now])
  const d1bId = d1b.lastInsertRowid as number

  run(`INSERT INTO pages (document_id, page_number, extracted_text, quality, created_at) VALUES (?, ?, ?, ?, ?)`, [
    d1bId, 1,
    `REMAND ORDER — ${remandDate1}
Court: Chief Metropolitan Magistrate, 6th Court, Mumbai
Case: State v. Vikram Suresh Nair — FIR 187/2024 Dadar PS
The accused was produced before this court. After hearing the IO and perusing the case diary, accused is remanded to Judicial Custody for a period of 14 (fourteen) days until ${daysAgo(81)}.
The accused is to be produced again on ${daysAgo(81)}.
NOTE: Accused's name appears as "Vikram S. Nair" in this order but as "Vikram Suresh Nairu" in the arrest panchnama — inconsistency to be verified.
Sd/- CMM 6th Court, Mumbai`,
    'good', now
  ])

  console.log(`  ↳ 2 documents, 3 pages inserted`)

  // Findings (analysis results)
  const ar1 = run(`INSERT INTO analysis_runs (case_id, version, status, engine, result, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [show1Id, 1, 'complete', 'gemini-1.5-pro', JSON.stringify({ summary: 'Analysis complete. 3 discrepancies identified.' }), now])
  const ar1Id = ar1.lastInsertRowid as number

  const f1a = run(`INSERT INTO findings (case_id, analysis_run_id, finding_type, description, extracted_value, comparison_value, severity, review_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [show1Id, ar1Id, 'name_variation', 'Accused name differs across documents: FIR records "Vikram Suresh Nair" but arrest panchnama records "Vikram Suresh Nairu". This variation may be exploited by defence to challenge identity.', 'Vikram Suresh Nairu (Panchnama)', 'Vikram Suresh Nair (FIR, Remand Order)', 'high', 'needs_review', now, now])
  const f1aId = f1a.lastInsertRowid as number

  run(`INSERT INTO finding_sources (finding_id, document_id, page_id, page_number, passage, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [f1aId, d1aId, null, 2, 'Accused: Vikram Suresh Nairu — appears on arrest panchnama page 2', 'primary', now])
  run(`INSERT INTO finding_sources (finding_id, document_id, page_id, page_number, passage, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [f1aId, d1bId, null, 1, 'Case: State v. Vikram Suresh Nair — appears in remand order', 'comparison', now])

  const f1b = run(`INSERT INTO findings (case_id, analysis_run_id, finding_type, description, extracted_value, comparison_value, severity, review_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [show1Id, ar1Id, 'date_discrepancy', 'Laptop timestamp shows last login on 14 Feb 2024 from Mumbai location. Accused claims to have been in Pune on that date per witness PW-3 statement. Requires forensic reconciliation.', '14 Feb 2024 (Laptop timestamp, Mumbai)', 'PW-3 statement: accused in Pune on 14 Feb 2024', 'high', 'needs_review', now, now])
  const f1bId = f1b.lastInsertRowid as number
  run(`INSERT INTO finding_sources (finding_id, document_id, page_id, page_number, passage, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [f1bId, d1aId, null, 2, 'Date on laptop timestamp shows 14 Feb 2024 as last login — INCONSISTENCY with accused\'s claimed alibi of being in Pune on that date', 'primary', now])

  run(`INSERT INTO findings (case_id, analysis_run_id, finding_type, description, extracted_value, comparison_value, severity, review_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [show1Id, ar1Id, 'missing_info', 'Chargesheet filing deadline under Sec 167(2) CrPC (60 days from ' + remandDate1 + ') has now expired. No chargesheet or final report has been received by the court. Accused holds an absolute accrued right to default bail.', 'No chargesheet filed within 60 days', 'Statutory deadline: ' + daysAgo(35), 'high', 'needs_review', now, now])

  console.log(`  ↳ 1 analysis run, 3 findings inserted`)

  // Audit trail
  run(`INSERT INTO audit_events (case_id, event_type, description, performed_at) VALUES (?, ?, ?, ?)`,
    [show1Id, 'bail_field_changed', JSON.stringify({ field: 'remandDate', oldValue: null, newValue: remandDate1 }), now])
  run(`INSERT INTO audit_events (case_id, event_type, description, performed_at) VALUES (?, ?, ?, ?)`,
    [show1Id, 'bail_field_changed', JSON.stringify({ field: 'statutoryPeriodDays', oldValue: 60, newValue: 60 }), now])

  console.log(`  ↳ Audit trail inserted`)
  console.log(`  → Navigate to /bail-briefs/${show1Id}`)

} else {
  show1Id = existingShow1.id
  console.log(`→ BAIL-SHOW-001 already exists (id ${show1Id}), skipping.`)
}

// ════════════════════════════════════════════════════════════════════════════
// CASE 2 — BAIL-SHOW-002
// State v. Priya Chandrakant Joshi
// Feature: CHARGESHEET FILED ON TIME — bail granted with conditions active
// ════════════════════════════════════════════════════════════════════════════

let show2Id: number

if (!existingShow2) {
  const remandDate2 = daysAgo(75)    // Remanded 75 days ago
  const csDate2 = daysAgo(55)        // Chargesheet filed on day 20 — well within 60-day limit
  const bailGrantDate2 = daysAgo(50) // Bail granted after chargesheet filed

  const r2 = run(`
    INSERT INTO cases (
      case_number, title, description, status, case_type,
      court, judge, advocate,
      remand_date, statutory_period_days,
      chargesheet_filed, chargesheet_date,
      applicable_law,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'BAIL-SHOW-002',
    'State v. Priya Chandrakant Joshi',
    `FIR No. 231/2024 registered at Vile Parle Police Station under Section 304-A IPC (Causing death by negligence). Accused, a doctor, arrested following death of a patient during an aesthetic procedure. Chargesheet filed within 20 days. Bail granted on ${bailGrantDate2} with conditions. Next hearing for framing of charges scheduled.`,
    'active',
    'bail',
    'Sessions Court, Mumbai — Court No. 4',
    "Hon'ble Smt. K.S. Godbole, ASJ",
    'Aditi Sharma',
    remandDate2,
    60,
    1,           // chargesheet FILED
    csDate2,
    'crpc',
    now, now
  ])
  show2Id = r2.lastInsertRowid as number
  console.log(`\n✓ [BAIL-SHOW-002] Case inserted — id ${show2Id}  (remand: ${remandDate2}, CS: ${csDate2})`)

  // Judicial orders
  run(`INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [show2Id, remandDate2, 'other', `First production. Accused remanded to judicial custody for 14 days. Bail application to be filed after consultation with defence.`, 'CMM Court, Vile Parle', now])

  run(`INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [show2Id, csDate2, 'other', `Chargesheet filed by Vile Parle PS under Sec 304-A IPC within 20 days of remand. Case committed to Sessions Court. Chargesheet names 4 witnesses.`, 'CMM Court, Vile Parle', now])

  const o2bail = run(`INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [show2Id, bailGrantDate2, 'bail_order', `Bail granted under Sec 437 CrPC. Defence counsel argued accused has no criminal antecedents, is a qualified medical professional, and is required for continued patient care. Prosecution did not strenuously oppose after chargesheet was filed. Conditions imposed as per order.`, 'Sessions Court No. 4, Mumbai', now])
  const o2bailId = o2bail.lastInsertRowid as number

  run(`INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [show2Id, daysFromNow(14), 'framing_charges', `Next date for framing of charges under Sec 304-A IPC. Prosecution to file list of documents. Defence to file objections if any.`, 'Sessions Court No. 4, Mumbai', now])

  console.log(`  ↳ 4 judicial orders inserted`)

  // Bail conditions
  const c2a = run(`INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [show2Id, 'Personal bond of ₹50,000 with one surety of ₹50,000 acceptable to the court.', 'surety', 'completed', o2bailId, now])
  const c2aId = c2a.lastInsertRowid as number

  const c2b = run(`INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [show2Id, 'Surrender medical registration certificate (MCI) to the Investigating Officer within 72 hours of release.', 'activity', 'completed', o2bailId, now])
  const c2bId = c2b.lastInsertRowid as number

  const c2c = run(`INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [show2Id, 'Report to Vile Parle Police Station every Monday and Thursday between 10:00 AM and 12:00 PM.', 'reporting', 'active', o2bailId, now])
  const c2cId = c2c.lastInsertRowid as number

  run(`INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [show2Id, 'Accused shall not leave Mumbai metropolitan region without prior permission of the court.', 'travel', 'active', o2bailId, now])

  console.log(`  ↳ 4 bail conditions inserted`)

  // Surety bond — verified
  run(`INSERT INTO surety_bonds (condition_id, surety_name, relationship, bond_amount, document_reference, verification_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [c2aId, 'Dr. Suhas Chandrakant Joshi', 'Father', '₹50,000', 'Bond executed before Sessions Court Registrar on ' + daysAgo(48), 'verified', now, now])
  console.log(`  ↳ Surety bond inserted (verified)`)

  // Compliance events — reporting since bail (3 weeks, all complied)
  const reportDates2: string[] = []
  for (let i = 49; i >= 0; i -= 3) {
    if (i >= 0) reportDates2.push(daysAgo(i))
  }
  for (const d of reportDates2.slice(0, 8)) {
    run(`INSERT INTO condition_compliance_events (condition_id, event_date, event_type, note, created_at) VALUES (?, ?, ?, ?, ?)`,
      [c2cId, d, 'complied', 'Reported as scheduled. Signed attendance register.', now])
  }
  // Activity condition compliance
  run(`INSERT INTO condition_compliance_events (condition_id, event_date, event_type, note, created_at) VALUES (?, ?, ?, ?, ?)`,
    [c2bId, daysAgo(48), 'complied', 'MCI registration certificate No. MH-2009-4532 surrendered to IO Insp. S. Pendse on ' + daysAgo(48) + '. Receipt issued.', now])

  console.log(`  ↳ 9 compliance events inserted`)

  // Hearings
  const h2 = [
    [remandDate2,    'bail_hearing',  'Accused produced before CMM. Remanded to JC pending investigation. Bail application deferred.', 'Remanded for 14 days.', 'CMM Court, Vile Parle'],
    [csDate2,        'order',         `Chargesheet filed within statutory period. Case committed to Sessions Court. Accused directed to surrender medical registration.`, 'Case committed to Sessions Court.', 'CMM Court, Vile Parle'],
    [bailGrantDate2, 'bail_hearing',  'Bail application heard. Prosecution not opposed after chargesheet filed. Accused has clean antecedents and medical responsibilities. Bail granted with conditions.', 'Bail granted with conditions.', 'Sessions Court No. 4, Mumbai'],
    [daysAgo(28),    'arguments',     'Preliminary arguments on framing of charges. Defence argued single negligent act, no intention to cause death. Prosecution cited expert medical opinion on sub-standard procedure.', null, 'Sessions Court No. 4, Mumbai'],
  ]
  for (const [date, type, desc, outcome, court] of h2) {
    run(`INSERT INTO hearings (case_id, hearing_date, event_type, description, outcome, judge, court, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [show2Id, date, type, desc, outcome ?? null, "Hon'ble Smt. K.S. Godbole, ASJ", court, now])
  }
  // Future hearing
  run(`INSERT INTO hearings (case_id, hearing_date, event_type, description, outcome, judge, court, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [show2Id, daysFromNow(14), 'charge_framing', 'Framing of charges under Sec 304-A IPC. Prosecution to file list of documents, exhibit list and list of witnesses.', null, "Hon'ble Smt. K.S. Godbole, ASJ", 'Sessions Court No. 4, Mumbai', now])
  console.log(`  ↳ 5 hearings inserted (1 upcoming in 14 days)`)

  // Audit trail
  run(`INSERT INTO audit_events (case_id, event_type, description, performed_at) VALUES (?, ?, ?, ?)`,
    [show2Id, 'bail_field_changed', JSON.stringify({ field: 'remandDate', oldValue: null, newValue: remandDate2 }), now])
  run(`INSERT INTO audit_events (case_id, event_type, description, performed_at) VALUES (?, ?, ?, ?)`,
    [show2Id, 'bail_field_changed', JSON.stringify({ field: 'chargesheetFiled', oldValue: 0, newValue: 1 }), now])
  run(`INSERT INTO audit_events (case_id, event_type, description, performed_at) VALUES (?, ?, ?, ?)`,
    [show2Id, 'bail_field_changed', JSON.stringify({ field: 'chargesheetDate', oldValue: null, newValue: csDate2 }), now])

  console.log(`  → Navigate to /bail-briefs/${show2Id}`)

} else {
  show2Id = existingShow2.id
  console.log(`→ BAIL-SHOW-002 already exists (id ${show2Id}), skipping.`)
}

// ════════════════════════════════════════════════════════════════════════════
// CASE 3 — PAROLE-SHOW-001
// State of Karnataka v. Ramesh Gopal Hegde
// Feature: PAROLE EXPIRING SOON — 4 days until surrender
// ════════════════════════════════════════════════════════════════════════════

let show3Id: number

if (!existingShow3) {
  const paroleGrantDate = daysAgo(26)    // Parole started 26 days ago
  const paroleEndDate   = daysFromNow(4) // Expires in 4 days — AMBER urgent state

  const r3 = run(`
    INSERT INTO cases (
      case_number, title, description, status, case_type,
      court, judge, advocate,
      parole_grant_date, parole_end_date, parole_reporting_frequency,
      applicable_law,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'PAROLE-SHOW-001',
    'State of Karnataka v. Ramesh Gopal Hegde',
    `Convicted under Section 326 IPC (Voluntarily causing grievous hurt by dangerous weapons) by Sessions Court, Dharwad on 4 April 2019. Sentenced to 5 years Rigorous Imprisonment. Serving sentence at Dharwad Central Prison. Parole granted on family grounds (daughter's marriage) for 30 days from ${paroleGrantDate}. Parolee must report weekly to Hubli-Dharwad Police Station. Parole expires ${paroleEndDate}. Surrender date approaching.`,
    'active',
    'parole',
    'Sessions Court, Dharwad — Court No. 1',
    "Hon'ble Shri V.S. Kulkarni, ASJ",
    'Aditi Sharma',
    paroleGrantDate,
    paroleEndDate,
    'weekly',
    'crpc',
    now, now
  ])
  show3Id = r3.lastInsertRowid as number
  console.log(`\n✓ [PAROLE-SHOW-001] Case inserted — id ${show3Id}  (parole: ${paroleGrantDate} → ${paroleEndDate})`)

  // Judicial orders
  run(`INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [show3Id, '2019-04-04', 'sentence', 'Conviction and sentencing order. Accused found guilty under Section 326 IPC for causing grievous hurt to the complainant using a sharp agricultural implement. Sentenced to 5 years Rigorous Imprisonment with fine of ₹5,000.', 'Sessions Court, Dharwad — Court No. 1', now])

  const o3p = run(`INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [show3Id, daysAgo(30), 'bail_order', `Parole granted under Karnataka Prisoners (Release on Parole) Rules, 1974 on compassionate grounds — daughter's marriage ceremony. Period: 30 days from ${paroleGrantDate} to ${paroleEndDate}. Weekly reporting at Hubli-Dharwad PS. Surety bond required.`, 'Inspector General of Prisons, Karnataka', now])
  const o3pId = o3p.lastInsertRowid as number

  console.log(`  ↳ 2 judicial orders inserted`)

  // Parole conditions
  const p3a = run(`INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [show3Id, 'Parolee shall report to Hubli-Dharwad Police Station (Gokul Road branch) every Saturday between 10:00 AM and 12:00 PM during the parole period.', 'reporting', 'active', o3pId, now])
  const p3aId = p3a.lastInsertRowid as number

  run(`INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [show3Id, 'Parolee shall not travel outside Dharwad, Gadag, and Haveri districts without prior written permission from the Superintendent, Dharwad Central Prison.', 'travel', 'active', o3pId, now])

  const p3b = run(`INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [show3Id, 'Parolee shall furnish a surety bond of ₹10,000 with one local surety before release from prison.', 'surety', 'completed', o3pId, now])
  const p3bId = p3b.lastInsertRowid as number

  run(`INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [show3Id, 'Parolee shall surrender to Dharwad Central Prison by 5:00 PM on the last day of parole (' + paroleEndDate + '). Failure to surrender will result in immediate forfeiture of parole and issuance of non-bailable warrant.', 'activity', 'active', o3pId, now])

  console.log(`  ↳ 4 parole conditions inserted`)

  // Surety bond
  run(`INSERT INTO surety_bonds (condition_id, surety_name, relationship, bond_amount, document_reference, verification_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [p3bId, 'Savitri Ramesh Hegde', 'Spouse', '₹10,000', 'Bond executed on ' + daysAgo(28) + ' before Superintendent, Dharwad Central Prison', 'verified', now, now])
  console.log(`  ↳ Surety bond inserted (verified)`)

  // Compliance events — weekly reporting (3 successful reportings so far)
  const saturdays = [daysAgo(21), daysAgo(14), daysAgo(7)]
  for (const d of saturdays) {
    run(`INSERT INTO condition_compliance_events (condition_id, event_date, event_type, note, created_at) VALUES (?, ?, ?, ?, ?)`,
      [p3aId, d, 'complied', 'Reported at scheduled time. Identity verified. Station diary entry made.', now])
  }
  // 4th reporting is today / upcoming — still pending
  console.log(`  ↳ 3 compliance events inserted (all complied — 1 upcoming reporting due)`)

  // Hearings
  const h3 = [
    ['2019-04-04', 'judgment',    'Final arguments concluded. Verdict pronounced. Accused convicted under Sec 326 IPC. Sentenced to 5 years RI. Accused remanded to judicial custody forthwith.', 'Convicted. 5 years RI + ₹5,000 fine.', 'Sessions Court, Dharwad No. 1'],
    [daysAgo(30),  'bail_hearing','Parole application filed through jail superintendent. Medical/social grounds cited: daughter\'s marriage. IG Prisons reviewed application and granted 30-day parole.', 'Parole granted for 30 days.', 'IG Prisons Office, Karnataka'],
    [paroleGrantDate, 'order',    `Formal release from Dharwad Central Prison on parole. Conditions explained to parolee in presence of family members. Bond executed. Surrender date: ${paroleEndDate}.`, 'Released on parole.', 'Dharwad Central Prison'],
  ]
  for (const [date, type, desc, outcome, court] of h3) {
    run(`INSERT INTO hearings (case_id, hearing_date, event_type, description, outcome, judge, court, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [show3Id, date, type, desc, outcome, "Hon'ble Shri V.S. Kulkarni, ASJ", court, now])
  }
  // Upcoming — surrender reminder
  run(`INSERT INTO hearings (case_id, hearing_date, event_type, description, outcome, judge, court, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [show3Id, paroleEndDate, 'order', `SURRENDER DATE — Parolee to report to Dharwad Central Prison by 5:00 PM. Parole period ends. Failure to surrender will result in NBW under Sec 229A IPC.`, null, "Dharwad Central Prison", 'Dharwad Central Prison', now])
  console.log(`  ↳ 4 hearings inserted (1 surrender deadline marked)`)

  // Audit trail
  run(`INSERT INTO audit_events (case_id, event_type, description, performed_at) VALUES (?, ?, ?, ?)`,
    [show3Id, 'bail_field_changed', JSON.stringify({ field: 'paroleGrantDate', oldValue: null, newValue: paroleGrantDate }), now])
  run(`INSERT INTO audit_events (case_id, event_type, description, performed_at) VALUES (?, ?, ?, ?)`,
    [show3Id, 'bail_field_changed', JSON.stringify({ field: 'paroleEndDate', oldValue: null, newValue: paroleEndDate }), now])
  run(`INSERT INTO audit_events (case_id, event_type, description, performed_at) VALUES (?, ?, ?, ?)`,
    [show3Id, 'bail_field_changed', JSON.stringify({ field: 'paroleReportingFrequency', oldValue: null, newValue: 'weekly' }), now])

  console.log(`  → Navigate to /bail-briefs/${show3Id}`)

} else {
  show3Id = existingShow3.id
  console.log(`→ PAROLE-SHOW-001 already exists (id ${show3Id}), skipping.`)
}

db.close()

console.log('\n✅ Showcase seeding complete.')
console.log('')
console.log('  ┌─────────────────────────────────────────────────────────────────────┐')
console.log('  │  BAIL-SHOW-001 — Default Bail ACCRUED (Red alert, no chargesheet)  │')
console.log(`  │  → /bail-briefs/${show1Id}                                          │`)
console.log('  │                                                                     │')
console.log('  │  BAIL-SHOW-002 — Chargesheet filed on time, bail granted (Green)   │')
console.log(`  │  → /bail-briefs/${show2Id}                                          │')`)
console.log('  │                                                                     │')
console.log('  │  PAROLE-SHOW-001 — Parole expiring in 4 days (Amber urgent)        │')
console.log(`  │  → /bail-briefs/${show3Id}                                          │`)
console.log('  └─────────────────────────────────────────────────────────────────────┘')
