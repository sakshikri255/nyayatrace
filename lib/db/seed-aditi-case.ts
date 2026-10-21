import Database from 'better-sqlite3'
import path from 'node:path'

const db = new Database(path.join(process.cwd(), 'nyayatrace.db'))
db.pragma('foreign_keys = ON')
db.pragma('journal_mode = WAL')

// Helper for single query
function get<T>(sql: string, params: unknown[] = []): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined
}

const existingCase = get<{ id: number }>(
  'SELECT id FROM cases WHERE case_number = ?',
  ['CR-2024-MH-0418']
)

if (existingCase) {
  console.log(`Case already exists with id ${existingCase.id}`)
  db.close()
  process.exit(0)
}

const now = new Date().toISOString()

// 1. Create Case Record
const insertCase = db.prepare(`
  INSERT INTO cases (
    case_number, title, description, status, case_type,
    court, jurisdiction, judge,
    remand_date, statutory_period_days, max_punishment_years,
    chargesheet_filed, chargesheet_date,
    applicable_law,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const caseResult = insertCase.run(
  'CR-2024-MH-0418',
  'State of Maharashtra v. Aditi Sharma',
  'FIR No. 184/2024 registered at Shivajinagar P.S., Pune under Sections 302, 120-B, and 201 IPC (punishable under BNSS §§ 103(1), 61, 238). Accused Aditi Sharma detained since 15 January 2024. Investigation pending forensic timeline analysis and cyber forensics report. Bail application moved under Section 483 BNSS (Section 439 CrPC) citing non-filing of chargesheet within statutory 90 days and conflicting digital tower evidence.',
  'active',
  'bail',
  'Sessions Court, Pune — Court Hall No. 4',
  'Pune Sessions Division, Maharashtra',
  "Hon'ble P. R. Deshmukh, Additional Sessions Judge",
  '2024-01-16',
  90,
  14,
  0,
  null,
  'bnss',
  now,
  now
)

const caseId = caseResult.lastInsertRowid as number
console.log(`✓ Case created: State of Maharashtra v. Aditi Sharma (ID: ${caseId})`)

// 2. Hearings
const insertHearing = db.prepare(`
  INSERT INTO hearings (
    case_id, hearing_date, event_type, description, outcome,
    adjournment_reason, judge, court, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

insertHearing.run(
  caseId,
  '2024-01-16',
  'bail_hearing',
  'Initial production following arrest on 15 Jan 2024. Investigating Officer requested 7 days police custody for device seizure.',
  'Police custody granted for 7 days',
  null,
  "Hon'ble P. R. Deshmukh",
  'Sessions Court, Pune — Court Hall No. 4',
  now
)

insertHearing.run(
  caseId,
  '2024-01-23',
  'bail_hearing',
  'Accused produced upon completion of police remand. Sent to judicial custody at Yerwada Central Jail. Regular bail application filed.',
  'Remanded to judicial custody',
  'Prosecution requested time to file formal counter-affidavit',
  "Hon'ble P. R. Deshmukh",
  'Sessions Court, Pune — Court Hall No. 4',
  now
)

insertHearing.run(
  caseId,
  '2024-02-14',
  'arguments',
  'Arguments heard on defence submission regarding digital alibi (biometric access log at IT Park) vs FIR timeline.',
  'Adjourned for IO appearance with original case diary',
  'Investigating Officer engaged in law and order duty',
  "Hon'ble P. R. Deshmukh",
  'Sessions Court, Pune — Court Hall No. 4',
  now
)

insertHearing.run(
  caseId,
  '2026-10-28',
  'bail_hearing',
  'Hearing on Statutory / Default Bail Application under BNSS § 483 / CrPC § 167(2) upon expiry of 90-day investigation window.',
  'Listed for final arguments on default entitlement',
  null,
  "Hon'ble P. R. Deshmukh",
  'Sessions Court, Pune — Court Hall No. 4',
  now
)

console.log('✓ Hearings added (including upcoming cause list listing)')

// 3. Judicial Orders
const insertOrder = db.prepare(`
  INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`)

const order1 = insertOrder.run(
  caseId,
  '2024-01-23',
  'bail_order',
  'Interim medical inspection allowed; Jail Superintendent instructed to provide necessary medical care. Bail application scheduled for reply.',
  "Hon'ble P. R. Deshmukh",
  now
)

const orderId = order1.lastInsertRowid as number

insertOrder.run(
  caseId,
  '2024-02-16',
  'other',
  'Direction to the Cyber Crime Unit to submit certified forensic extraction report under Section 63 BSA / Section 65B IEA by next date.',
  "Hon'ble P. R. Deshmukh",
  now
)

console.log('✓ Judicial orders added')

// 4. Bail Conditions
const insertCondition = db.prepare(`
  INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`)

insertCondition.run(
  caseId,
  'Surrender passport to Court Registry and do not leave Pune municipal boundaries without prior leave of the Court.',
  'travel',
  'active',
  orderId,
  now
)

const cond2 = insertCondition.run(
  caseId,
  'Report to Shivajinagar Police Station every alternate Saturday between 10:00 AM and 1:00 PM and sign the attendance register.',
  'reporting',
  'active',
  orderId,
  now
)

const cond3 = insertCondition.run(
  caseId,
  'Furnish personal bond of Rs 50,000 with two solvent local sureties in the like amount to the satisfaction of the Registrar.',
  'surety',
  'active',
  orderId,
  now
)

console.log('✓ Bail conditions added')

// 5. Condition Compliance Events
const insertCompliance = db.prepare(`
  INSERT INTO condition_compliance_events (condition_id, event_date, event_type, note, created_at)
  VALUES (?, ?, ?, ?, ?)
`)

insertCompliance.run(cond2.lastInsertRowid, '2024-02-03', 'complied', 'Reported at 10:30 AM; attendance register signed.', now)
insertCompliance.run(cond2.lastInsertRowid, '2024-02-17', 'complied', 'Reported at 11:15 AM; attendance register signed.', now)
insertCompliance.run(cond2.lastInsertRowid, '2024-03-02', 'complied', 'Reported at 10:45 AM; attendance register signed.', now)

console.log('✓ Compliance events logged')

// 6. Surety Bonds
const insertSurety = db.prepare(`
  INSERT INTO surety_bonds (condition_id, surety_name, relationship, bond_amount, document_reference, verification_status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

insertSurety.run(
  cond3.lastInsertRowid,
  'Dr. Ramesh Sharma',
  'Father / Retired Govt Officer',
  '50000',
  'Aadhaar Card & Property Tax Receipt #PUN-PROP-2023-9182',
  'verified',
  now,
  now
)

insertSurety.run(
  cond3.lastInsertRowid,
  'Kavita Sharma',
  'Sister / Software Architect',
  '50000',
  'Permanent Resident Certificate & Salary Slip #EMP-MH-7712',
  'verified',
  now,
  now
)

console.log('✓ Surety bonds recorded and verified')

// 7. Sample Document & Pages
const insertDoc = db.prepare(`
  INSERT INTO documents (
    case_id, filename, original_name, file_type, page_count,
    processing_status, file_size, language, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const docResult = insertDoc.run(
  caseId,
  'FIR_184_2024_Shivajinagar_PS.pdf',
  'FIR 184/2024 - Shivajinagar Police Station.pdf',
  'pdf',
  2,
  'complete',
  48200,
  'eng',
  now
)

const docId = docResult.lastInsertRowid as number

const insertPage = db.prepare(`
  INSERT INTO pages (document_id, page_number, extracted_text, quality, created_at)
  VALUES (?, ?, ?, ?, ?)
`)

const page1Text = `FIRST INFORMATION REPORT (Under Section 154 Cr.P.C. / BNSS Section 173)
District: Pune City | Police Station: Shivajinagar | Year: 2024 | FIR No: 0184/2024
Acts & Sections: Indian Penal Code 1860 - Sections 302, 120-B, 201 (now BNSS 103(1), 61, 238)
Date and Time of Occurrence: 12-01-2024 at approximately 21:30 hrs
Place of Occurrence: Near FC Road, Deccan Gymkhana, Pune (approx 2.5 km South-West from P.S.)
Complainant / Informant: Sub-Inspector Vikas R. Shinde
Name of Accused: Aditi Sharma, aged 26 years, resident of Model Colony, Pune.
Brief Allegation:
Information received that on 12-01-2024 at around 21:30 hrs an altercation ensued between the parties, following which victim Udit Bharti collapsed due to toxic substance ingestion. Accused Aditi Sharma is alleged to have had conspiratorial communications and prior disputes with the victim.`

const page2Text = `RECORD OF SEIZURE AND REMAND REPORT
Accused: Aditi Sharma | Date of Arrest: 15-01-2024 at 16:00 hrs
First Production before Magistrate: 16-01-2024 | Remand Period: 7 Days Police Custody
Seized Properties:
1. One smartphone Samsung Galaxy S22 (Model SM-S901B)
2. Office entry biometric smart card and swipe logs

Defence Submission / Notice of Alibi:
The accused stated during statement that she was present at her employer premises (Cognizant Technology Solutions, Hinjewadi Phase 1) continuously between 18:00 hrs and 22:15 hrs on 12-01-2024. Biometric turnstile log and work terminal timestamps indicate active user session at 21:35 hrs.

Investigating Officer Note:
Tower location triangulation shows handset pinging Shivajinagar tower at 21:42 hrs. Forensic extraction from Regional Forensic Science Laboratory (RFSL), Ganeshkhind, Pune is awaited.`

insertPage.run(docId, 1, page1Text, 'good', now)
insertPage.run(docId, 2, page2Text, 'good', now)

console.log('✓ Sample document and extracted pages attached')

// 8. Document Annotations
const insertAnnotation = db.prepare(`
  INSERT INTO document_annotations (
    case_id, document_id, page_number, selected_text, note, tag, color, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

insertAnnotation.run(
  caseId,
  docId,
  1,
  'Date and Time of Occurrence: 12-01-2024 at approximately 21:30 hrs',
  'Alleged crime time: 21:30 hrs. Key benchmark for verifying biometric alibi logs.',
  'alibi',
  'teal',
  now
)

insertAnnotation.run(
  caseId,
  docId,
  2,
  'Biometric turnstile log and work terminal timestamps indicate active user session at 21:35 hrs.',
  'Crucial alibi evidence: biometric turnstile shows active presence at Hinjewadi at 21:35 hrs, creating geographic impossibility with 21:30 incident at FC Road.',
  'alibi',
  'emerald',
  now
)

insertAnnotation.run(
  caseId,
  docId,
  2,
  'Forensic extraction from Regional Forensic Science Laboratory (RFSL), Ganeshkhind, Pune is awaited.',
  'Procedural lapse: 90 days elapsed since remand without FSL report placed on court record.',
  'procedural_lapse',
  'amber',
  now
)

console.log('✓ Document annotations created')

// 9. Analysis Run & Findings
const insertAnalysisRun = db.prepare(`
  INSERT INTO analysis_runs (case_id, version, status, engine, review_notes, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`)

const runResult = insertAnalysisRun.run(
  caseId,
  1,
  'complete',
  'deterministic_local',
  'Automated timeline discrepancy check completed. 2 key discrepancies identified across FIR and Remand logs.',
  now
)
const runId = runResult.lastInsertRowid as number

const insertFinding = db.prepare(`
  INSERT INTO findings (
    case_id, analysis_run_id, finding_type, description,
    extracted_value, comparison_value, severity, review_status,
    reviewed_by, reviewed_at, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

insertFinding.run(
  caseId,
  runId,
  'date_discrepancy',
  'Temporal discrepancy between alleged time of occurrence and accused workplace biometric log.',
  '21:35 hrs (Active Hinjewadi work session)',
  '21:30 hrs (Incident time at FC Road)',
  'high',
  'verified',
  'Adv. Counsel',
  now,
  now,
  now
)

insertFinding.run(
  caseId,
  runId,
  'missing_info',
  'Section 65B IEA / Section 63 BSA electronic certificate missing for telecom tower ping records.',
  'Raw tower log cited without Section 63 certificate',
  'Statutory requirement of electronic evidence admissibility',
  'medium',
  'needs_review',
  null,
  null,
  now,
  now
)

console.log('✓ Analysis findings and verification items created')

// 10. Audit Trail Event
const insertAudit = db.prepare(`
  INSERT INTO audit_events (case_id, event_type, description, performed_by, performed_at)
  VALUES (?, ?, ?, ?, ?)
`)

insertAudit.run(caseId, 'case_created', 'Case State of Maharashtra v. Aditi Sharma initialized in workspace', 'System Admin', now)
insertAudit.run(caseId, 'document_uploaded', 'FIR 184/2024 processed and text extracted via PDF.js', 'System Admin', now)
insertAudit.run(caseId, 'bail_condition_logged', '3 bail conditions recorded under interim inspection order', 'System Admin', now)

console.log('✓ Audit log populated')

db.close()
console.log('✨ All records inserted successfully for Aditi Sharma!')
