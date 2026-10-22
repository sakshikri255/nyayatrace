/**
 * Comprehensive showcase seed: State of Rajasthan v. Vikram Singh Rathore
 * Case No: CR-2024-RJ-0731
 *
 * A full-lifecycle criminal case demonstrating EVERY platform feature:
 *  • Case with criminal + bail + parole workflow
 *  • 6 uploaded & OCR-processed documents (FIR, charge-sheet, medical report,
 *    bail order, parole order, witness deposition)
 *  • Document annotations (all 5 tags, all 5 colours)
 *  • Judicial orders covering remand → bail → parole
 *  • Bail & parole conditions (surety, travel, reporting, activity)
 *  • Surety bonds (pending → verified → rejected)
 *  • Condition compliance events (complied + violated)
 *  • 8 hearings across the case timeline
 *  • Analysis run with 6 cross-document findings + finding sources
 *  • Audit trail
 *
 * Run with: npm run db:seed-rathore
 */

import Database from 'better-sqlite3'
import path from 'node:path'

const db = new Database(path.join(process.cwd(), 'nyayatrace.db'))
db.pragma('foreign_keys = ON')
db.pragma('journal_mode = WAL')

function get<T>(sql: string, params: unknown[] = []): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined
}

function run(sql: string, params: unknown[] = []) {
  return db.prepare(sql).run(...params)
}

// ── Guard: wipe and re-seed on re-runs ───────────────────────────────────────
const existing = get<{ id: number }>(
  "SELECT id FROM cases WHERE case_number = ?",
  ['CR-2024-RJ-0731']
)
if (existing) {
  console.log(`Refreshing existing case (id ${existing.id})…`)
  run('DELETE FROM cases WHERE id = ?', [existing.id])
}

const now = new Date().toISOString()

// ════════════════════════════════════════════════════════════════════════════
// 1. CASE RECORD  — criminal case that progresses through bail and parole
// ════════════════════════════════════════════════════════════════════════════

const caseResult = run(`
  INSERT INTO cases (
    case_number, title, description, status, case_type,
    court, jurisdiction, judge, advocate,
    remand_date, statutory_period_days, max_punishment_years,
    chargesheet_filed, chargesheet_date,
    applicable_law,
    parole_grant_date, parole_end_date, parole_reporting_frequency,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`, [
  'CR-2024-RJ-0731',
  'State of Rajasthan v. Vikram Singh Rathore',
  `FIR No. 87/2024 registered at Sardar Patel Nagar Police Station, Jaipur under Sections 307 IPC (Attempt to Murder), 326 IPC (Grievous Hurt by Dangerous Weapon), and 34 IPC (Common Intention). Accused Vikram Singh Rathore (age 34) was arrested on 05 March 2024 following a road-rage incident in which he allegedly struck the complainant Mahesh Kumar Verma with an iron rod, causing grievous skull injury. Chargesheet filed on 20 April 2024 within the 60-day statutory window. Bail application contested by prosecution on grounds of repeat offender status and intimidation of witnesses. Sessions Court granted bail on 10 June 2024 with strict conditions. Accused subsequently applied for parole on 15 August 2024 on medical grounds (elderly mother critical). Parole active from 20 August 2024 to 19 September 2024.`,
  'active',
  'criminal',
  'Sessions Court, Jaipur — Court No. 5',
  'Jaipur Sessions Division, Rajasthan',
  "Hon'ble Shri K.L. Mathur, Additional Sessions Judge",
  'Aditi Sharma',
  '2024-03-05',   // remand_date
  60,             // statutory_period_days
  10,             // max_punishment_years (Sec 307 IPC carries 10 yr)
  1,              // chargesheet_filed = true
  '2024-04-20',  // chargesheet_date (day 46 — within 60-day window)
  'bnss',
  '2024-08-20',  // parole_grant_date
  '2024-09-19',  // parole_end_date
  'fortnightly',
  now, now,
])

const caseId = caseResult.lastInsertRowid as number
console.log(`✓ Case created: State of Rajasthan v. Vikram Singh Rathore (id ${caseId})`)

// ════════════════════════════════════════════════════════════════════════════
// 2. HEARINGS
// ════════════════════════════════════════════════════════════════════════════

const insertHearing = db.prepare(`
  INSERT INTO hearings (
    case_id, hearing_date, event_type, description, outcome,
    adjournment_reason, judge, court, source_document, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const hearings = [
  ['2024-03-05', 'bail_hearing',
   'First production. Accused Vikram Singh Rathore produced before Metropolitan Magistrate. Police remand sought for 5 days to recover seized weapon and examine CCTV.',
   'Police remand granted for 5 days.',
   null,
   'MM Court No. 2, Jaipur'],
  ['2024-03-10', 'bail_hearing',
   'Judicial custody hearing after police remand. Defence filed bail application citing clean antecedents and co-operation in investigation.',
   'Bail refused; judicial custody. Next date 25 March 2024.',
   'Prosecution cited witness intimidation concerns and filed prior criminal history.',
   'Sessions Court No. 5, Jaipur'],
  ['2024-03-25', 'adjournment',
   'Matter listed for bail arguments. Investigating Officer on leave; prosecution sought time.',
   null,
   'IO on medical leave; substitution letter filed.',
   'Sessions Court No. 5, Jaipur'],
  ['2024-04-20', 'charge_framing',
   'Chargesheet filed on day 46 of remand. Prosecution moved for framing of charges under Sections 307 and 326 IPC.',
   'Charges framed. Defence given 2 weeks to file reply.',
   null,
   'Sessions Court No. 5, Jaipur'],
  ['2024-06-10', 'bail_hearing',
   'Bail application heard on merits. Defence cited 97 days in custody, chargesheet filed, clean medical report. Two verified sureties tendered.',
   'Bail granted with conditions. Signed bail order.',
   null,
   'Sessions Court No. 5, Jaipur'],
  ['2024-07-15', 'arguments',
   'Prosecution examination of PW-1 Mahesh Kumar Verma and PW-2 Dr. Priya Meena (treating surgeon) commenced.',
   'PW-1 cross-examination deferred; PW-2 testimony recorded.',
   null,
   'Sessions Court No. 5, Jaipur'],
  ['2024-08-20', 'order',
   'Parole granted on humanitarian grounds. Accused released from Jaipur Central Jail on 30-day parole to attend to critically ill mother.',
   'Parole released. Reporting every fortnight to Sardar Patel Nagar PS.',
   null,
   'Sessions Court No. 5, Jaipur'],
  ['2024-10-05', 'arguments',
   'Resumed trial. Prosecution produced forensic weapon analysis. Defence moved to summon CCTV footage custodian.',
   'CCTV custodian summoned. Next date 20 October 2024.',
   null,
   'Sessions Court No. 5, Jaipur'],
]

for (const [date, type, desc, outcome, adj, court] of hearings) {
  insertHearing.run(
    caseId, date, type, desc, outcome ?? null, adj ?? null,
    "Hon'ble Shri K.L. Mathur, ASJ", court,
    null, now
  )
}
console.log(`  ↳ ${hearings.length} hearings inserted`)

// ════════════════════════════════════════════════════════════════════════════
// 3. JUDICIAL ORDERS
// ════════════════════════════════════════════════════════════════════════════

const insertOrder = db.prepare(`
  INSERT INTO judicial_orders (case_id, order_date, order_type, summary, issued_by, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`)

const oRemand = insertOrder.run(caseId, '2024-03-05', 'other',
  'Police remand order: Accused remanded to police custody for 5 days to facilitate recovery of iron rod weapon, examination of CCTV from petrol pump adjacent to incident site, and interrogation of co-accused.',
  'Metropolitan Magistrate, Court No. 2, Jaipur', now)

insertOrder.run(caseId, '2024-03-10', 'other',
  'Judicial custody order: Bail refused on account of serious nature of offence (Sec 307 IPC), prior FIR history (FIR No. 12/2021), and credible risk of witness intimidation. Judicial custody extended until chargesheet.',
  "Hon'ble Shri K.L. Mathur, ASJ, Sessions Court Jaipur", now)

const oBail = insertOrder.run(caseId, '2024-06-10', 'bail_order',
  'Bail order: After 97 days in custody and chargesheet filed on Day 46, bail application allowed. Conditions: (1) Personal bond ₹1,00,000 with two sureties ₹50,000 each; (2) No contact with complainant or prosecution witnesses; (3) Weekly reporting to Sardar Patel Nagar Police Station; (4) Surrender passport; (5) Permission required for travel outside Jaipur district.',
  "Hon'ble Shri K.L. Mathur, ASJ, Sessions Court Jaipur", now)
const bailOrderId = oBail.lastInsertRowid as number

const oParole = insertOrder.run(caseId, '2024-08-20', 'bail_order',
  'Parole order: 30-day parole on humanitarian grounds (aged mother admitted to Sawai Man Singh Hospital in critical condition). Conditions: fortnightly reporting, no travel outside Jaipur city, daily curfew after 9 PM, surrender before parole expiry on 19 September 2024.',
  "Superintendent, Jaipur Central Prison / Inspector General of Prisons, Rajasthan", now)
const paroleOrderId = oParole.lastInsertRowid as number

console.log(`  ↳ 4 judicial orders inserted`)

// ════════════════════════════════════════════════════════════════════════════
// 4. BAIL & PAROLE CONDITIONS
// ════════════════════════════════════════════════════════════════════════════

const insertCond = db.prepare(`
  INSERT INTO bail_conditions (case_id, condition_text, condition_type, status, order_id, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`)

// Bail conditions
const bc1 = insertCond.run(caseId,
  'Furnish personal bond of ₹1,00,000 with two solvent sureties of ₹50,000 each to the satisfaction of the Court Registrar, Sessions Court Jaipur.',
  'surety', 'completed', bailOrderId, now)
const bc1Id = bc1.lastInsertRowid as number

const bc2 = insertCond.run(caseId,
  'Report to Sardar Patel Nagar Police Station every Monday between 09:00 AM and 11:00 AM and sign the reporting register.',
  'reporting', 'active', bailOrderId, now)
const bc2Id = bc2.lastInsertRowid as number

const bc3 = insertCond.run(caseId,
  'Surrender passport and original government-issued identity documents to Court Registry. Do not leave Jaipur District without written leave of Court.',
  'travel', 'active', bailOrderId, now)

const bc4 = insertCond.run(caseId,
  'Accused shall not directly or indirectly contact, communicate with, or be within 500 metres of complainant Mahesh Kumar Verma or any prosecution witness.',
  'activity', 'active', bailOrderId, now)

// Parole conditions
const pc1 = insertCond.run(caseId,
  'Parolee shall report to Sardar Patel Nagar Police Station every fortnight — on 3 September 2024 and 17 September 2024 — between 10:00 AM and 11:00 AM.',
  'reporting', 'completed', paroleOrderId, now)
const pc1Id = pc1.lastInsertRowid as number

const pc2 = insertCond.run(caseId,
  'Parolee shall not travel outside Jaipur Municipal Corporation limits during parole period without prior written permission from Superintendent, Jaipur Central Prison.',
  'travel', 'active', paroleOrderId, now)

const pc3 = insertCond.run(caseId,
  'Parolee shall furnish a surety bond of ₹25,000 with one local surety acceptable to the Superintendent before release.',
  'surety', 'completed', paroleOrderId, now)
const pc3Id = pc3.lastInsertRowid as number

const pc4 = insertCond.run(caseId,
  'Parolee shall maintain a daily curfew — shall remain indoors at his registered residence after 9:00 PM and before 6:00 AM throughout the parole period.',
  'activity', 'active', paroleOrderId, now)

console.log(`  ↳ 8 bail/parole conditions inserted`)

// ════════════════════════════════════════════════════════════════════════════
// 5. SURETY BONDS
// ════════════════════════════════════════════════════════════════════════════

const insertSurety = db.prepare(`
  INSERT INTO surety_bonds (condition_id, surety_name, relationship, bond_amount,
    document_reference, verification_status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

// Bail surety bonds
insertSurety.run(bc1Id, 'Gajendra Singh Rathore', 'Elder Brother / Retired Govt. Teacher',
  '₹50,000', 'Aadhaar Card #XXXX-XXXX-8812 & Government Employee Service Certificate No. 2019-RJ-GEZ-1871 — verified by Registrar on 11 Jun 2024',
  'verified', now, now)

insertSurety.run(bc1Id, 'Sunita Devi Rathore', 'Mother / Homemaker',
  '₹50,000', 'Aadhaar Card #XXXX-XXXX-5540 — Rejected: property documents submitted are mortgaged and not free-hold; asked to re-submit',
  'rejected', now, now)

// Parole surety bond
insertSurety.run(pc3Id, 'Rajesh Kumar Sharma', 'Neighbour / Retired Bank Manager',
  '₹25,000', 'Surety bond executed on 19 August 2024 before Superintendent, Jaipur Central Prison. PAN Card + Property Tax Receipt enclosed.',
  'verified', now, now)

console.log(`  ↳ 3 surety bonds inserted (2 bail: 1 verified 1 rejected; 1 parole: verified)`)

// ════════════════════════════════════════════════════════════════════════════
// 6. COMPLIANCE EVENTS
// ════════════════════════════════════════════════════════════════════════════

const insertCompliance = db.prepare(`
  INSERT INTO condition_compliance_events (condition_id, event_date, event_type, note, created_at)
  VALUES (?, ?, ?, ?, ?)
`)

// Bail reporting compliance
const bailReportDates = [
  ['2024-06-17', 'complied', 'Reported at 09:30 AM. Attendance register signed. Officer on duty: HC Ramesh Kumar.'],
  ['2024-06-24', 'complied', 'Reported at 09:15 AM. Register signed.'],
  ['2024-07-01', 'complied', 'Reported at 10:00 AM. Register signed.'],
  ['2024-07-08', 'complied', 'Reported at 09:45 AM. Register signed.'],
  ['2024-07-15', 'violated', 'Failed to report. Advocate submitted medical certificate: accused hospitalised for knee surgery 13–16 July 2024. Court notice issued 16 Jul 2024.'],
  ['2024-07-22', 'complied', 'Reporting resumed post-hospital discharge. Register signed at 09:50 AM. Medical discharge summary verified.'],
  ['2024-07-29', 'complied', 'Reported at 09:30 AM. Register signed.'],
  ['2024-08-05', 'complied', 'Reported at 09:20 AM. Register signed.'],
]
for (const [d, t, n] of bailReportDates) {
  insertCompliance.run(bc2Id, d, t, n, now)
}

// Parole reporting compliance
insertCompliance.run(pc1Id, '2024-09-03', 'complied',
  'First fortnightly parole report. Reported at 10:05 AM. Identity verified. Mother\'s hospital discharge summary noted on record.', now)
insertCompliance.run(pc1Id, '2024-09-17', 'complied',
  'Second fortnightly parole report. Reported at 10:00 AM. Parole expiry reminder issued: must surrender to Jaipur Central Prison by 19 Sep 2024.', now)

console.log(`  ↳ 10 compliance events inserted`)

// ════════════════════════════════════════════════════════════════════════════
// 7. DOCUMENTS & EXTRACTED PAGES
// ════════════════════════════════════════════════════════════════════════════

const insertDoc = db.prepare(`
  INSERT INTO documents (
    case_id, filename, original_name, file_type, page_count,
    processing_status, file_size, language, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertPage = db.prepare(`
  INSERT INTO pages (document_id, page_number, extracted_text, quality, created_at)
  VALUES (?, ?, ?, ?, ?)
`)

// ── Document 1: FIR & Arrest Memo ───────────────────────────────────────────
const d1 = insertDoc.run(caseId,
  'DOC_01_FIR_87_2024_SPN_PS.pdf',
  '[Police Record] FIR No. 87-2024 & Arrest Memo.pdf',
  'pdf', 2, 'complete', 58400, 'eng', now)
const d1Id = d1.lastInsertRowid as number

insertPage.run(d1Id, 1, `FIRST INFORMATION REPORT
District: Jaipur City | Police Station: Sardar Patel Nagar | Year: 2024 | FIR No: 0087/2024
Acts & Sections: IPC Sections 307 (Attempt to Murder), 326 (Grievous Hurt by Dangerous Weapon), 34 (Common Intention)
Date and Time of Occurrence: 04-03-2024 at approximately 20:45 hrs
Place of Occurrence: Ring Road, Near Petrol Pump, Jaipur (0.8 km from Police Station)
Complainant / Informant: Mahesh Kumar Verma, 42 years, Shop Owner, Vaishali Nagar, Jaipur
Name of Accused: Vikram Singh Rathore, 34 years, Contractor, C-112 Mansarovar Colony, Jaipur.
Brief Allegation: A road-rage dispute escalated when accused Vikram Singh Rathore blocked complainant's vehicle and struck complainant Mahesh Kumar Verma with a heavy iron rod on the head causing severe skull injury. Victim collapsed unconscious at scene. Accused fled on motorcycle before police arrival. Eyewitness Ramkali Devi observed and reported the incident.
Arrested on: 05-03-2024 at 06:30 hrs from accused's residence C-112 Mansarovar Colony.`, 'good', now)

insertPage.run(d1Id, 2, `ARREST MEMO & SEIZURE PANCHNAMA
Accused: Vikram Singh Rathore | Date of Arrest: 05-03-2024 | Time: 06:30 hrs
Arresting Officer: Sub-Inspector Harish Chand Meena, Sardar Patel Nagar PS
Seized Items:
1. One iron rod (length approx 90 cm, weight ~1.2 kg) — blood-stained, recovered from accused's vehicle boot.
2. Mobile handset Samsung Galaxy A52 (IMEI: 352109110482017) — seized without contemporaneous Section 63 BSA / 65B IEA certificate.
3. Motorcycle Bajaj Pulsar 150 (RJ-14-CX-0912) — suspect vehicle used in escape.
Prior Criminal Record: FIR No. 12/2021 registered at Vaishali Nagar PS for Sec 325 IPC (Voluntarily Causing Grievous Hurt) — one prior conviction.`, 'good', now)

// ── Document 2: Medical/Injury Report (treating hospital) ───────────────────
const d2 = insertDoc.run(caseId,
  'DOC_02_Medical_Injury_Report_SMS_Hospital.pdf',
  '[Medical Report] Injury Certificate & Surgical Report — SMS Hospital Jaipur.pdf',
  'pdf', 2, 'complete', 47200, 'eng', now)
const d2Id = d2.lastInsertRowid as number

insertPage.run(d2Id, 1, `SAWAI MAN SINGH MEDICAL COLLEGE & HOSPITAL, JAIPUR
CASUALTY / EMERGENCY MEDICAL REPORT
Patient: Mahesh Kumar Verma | Age: 42 | Date of Admission: 04-03-2024 | Time: 21:20 hrs
Admitted via: Emergency | Brought by: Police personnel Sardar Patel Nagar PS
Examining Doctor: Dr. Priya Meena, MS (Orthopaedics), Casualty Medical Officer
Chief Complaint: Unconscious patient, head trauma, road-rage assault.
Examination Findings:
Lacerated wound 6 cm x 3 cm on right parietal region of skull. Depressed skull fracture confirmed on CT scan. Glasgow Coma Scale (GCS) on arrival: 7/15. Bilateral periorbital haematoma. BP: 90/60 (hypotensive). Emergency neurosurgery performed on 05-03-2024 at 02:00 hrs.
Declared Critically Injured. Injury Cause: Blunt force trauma consistent with a heavy metallic implement.`, 'good', now)

insertPage.run(d2Id, 2, `SMS HOSPITAL — DISCHARGE SUMMARY
Patient: Mahesh Kumar Verma | Discharge Date: 22-03-2024
Post-Surgical Note:
Successful decompressive craniotomy for epidural haematoma on right parietal lobe. Patient regained consciousness on Day 5 (09-03-2024). Partial hearing loss in left ear documented. Physiotherapy commenced. Patient discharged with recommendation for 3-month follow-up CT scan.
Medico-Legal Note: Injury classified as GRIEVOUS HURT under Section 320 IPC item (vii) — fracture of skull. Police Injury Certificate No. JP-MEDLEG-2024-087 issued accordingly.
Treating Consultant: Dr. Suresh Bhardwaj, MCh (Neurosurgery).`, 'good', now)

// ── Document 3: Chargesheet ──────────────────────────────────────────────────
const d3 = insertDoc.run(caseId,
  'DOC_03_Chargesheet_CR_87_2024.pdf',
  '[Court Record] Police Chargesheet — Crime No. 87-2024.pdf',
  'pdf', 2, 'complete', 63800, 'eng', now)
const d3Id = d3.lastInsertRowid as number

insertPage.run(d3Id, 1, `CHARGE-SHEET UNDER SECTION 193 BHARATIYA NAGARIK SURAKSHA SANHITA, 2023
[Equated to Section 173 Cr.P.C.]
Court: Sessions Court, Jaipur — Court No. 5 | Presented: 20-04-2024 (Day 46 of remand)
Crime No. and Year: 87/2024 | Police Station: Sardar Patel Nagar
Accused: Vikram Singh Rathore s/o Gajendra Singh Rathore, C-112 Mansarovar Colony, Jaipur.
Sections: 307, 326, 34 IPC.
Brief Prosecution Case: On 04-03-2024 at 20:45 hrs on Ring Road near petrol pump, accused and complainant had road-rage altercation. Accused retrieved iron rod from vehicle, struck complainant on head. Single eyewitness Ramkali Devi corroborated. Seizure of iron rod with bloodstains matching complainant's blood group (B+). Prior conviction establishes pattern of violent conduct.
Investigation Status: Complete. DNA report from FSL Jaipur received. Accused mobile CDR analysis shows location at crime scene. Electronic device seized.`, 'good', now)

insertPage.run(d3Id, 2, `CHARGESHEET — WITNESS LIST AND EVIDENCE
Prosecution Witnesses:
PW-1: Mahesh Kumar Verma (Complainant/Victim)
PW-2: Dr. Priya Meena, Casualty Officer, SMS Hospital (Medical expert)
PW-3: Ramkali Devi (Independent Eyewitness)
PW-4: Sub-Inspector Harish Chand Meena (Investigating Officer)
PW-5: Forensic Expert, Regional FSL Jaipur (Weapon & DNA analysis)

Documentary Evidence:
Exhibit 1: Iron rod — blood-stained weapon (Lab Report FSL-JP-2024-0231)
Exhibit 2: CCTV footage from petrol pump — SD card marked and sealed
Exhibit 3: Mobile CDR of accused showing location at Ring Road at 20:48 hrs
Exhibit 4: Medical Injury Certificate No. JP-MEDLEG-2024-087
Exhibit 5: Aadhaar-verified identity of accused and complainant

Note on Electronic Evidence: Certificate under Section 63 BSA for mobile handset seizure NOT generated at time of arrest. Certificate subsequently submitted post extraction from FSL.`, 'good', now)

// ── Document 4: FSL Weapon & DNA Report ─────────────────────────────────────
const d4 = insertDoc.run(caseId,
  'DOC_04_FSL_Weapon_DNA_Report_JP2024_0231.pdf',
  '[Forensic Report] FSL Weapon & DNA Analysis Report FSL-JP-2024-0231.pdf',
  'pdf', 1, 'complete', 51000, 'eng', now)
const d4Id = d4.lastInsertRowid as number

insertPage.run(d4Id, 1, `REGIONAL FORENSIC SCIENCE LABORATORY, JAIPUR
REPORT OF FORENSIC BIOLOGY & DNA ANALYSIS
Report No: FSL-JP-2024-0231 | Date: 15-04-2024
Reference: Sardar Patel Nagar PS Crime No. 87/2024 (Victim: Mahesh Kumar Verma)
Exhibits Received: One iron rod (blood-stained) | Swab samples from iron rod | Blood sample from victim Mahesh Kumar Verma
DNA Analysis Results:
1. Blood on iron rod (Sample A): Human blood. DNA profile extracted via STR profiling. Profile matches blood sample of victim Mahesh Kumar Verma (probability 1 in 7.3 x 10^9).
2. Fingerprint examination: Partial loop fingerprint of 12 ridge characteristics on iron rod handle matches right index finger of accused Vikram Singh Rathore (NCRB database comparison confirmed).
Conclusion: Forensic evidence conclusively links seized iron rod to victim and accused.
Certified by: Dr. Anita Joshi, Deputy Director (Forensic Biology), Regional FSL Jaipur.`, 'good', now)

// ── Document 5: Bail Order ───────────────────────────────────────────────────
const d5 = insertDoc.run(caseId,
  'DOC_05_Bail_Order_10Jun2024_Sessions_Court.pdf',
  '[Court Order] Sessions Court Bail Order dated 10-06-2024.pdf',
  'pdf', 1, 'complete', 38700, 'eng', now)
const d5Id = d5.lastInsertRowid as number

insertPage.run(d5Id, 1, `SESSIONS COURT, JAIPUR — COURT NO. 5
BAIL ORDER
Case No: CR-2024-RJ-0731 | Date: 10-06-2024
Coram: Hon'ble Shri K.L. Mathur, Additional Sessions Judge
Accused: Vikram Singh Rathore
Application under: Section 483 BNSS / Section 439 CrPC

ORDER:
Heard counsel for the accused and learned APP for the State.
Accused in custody since 05-03-2024 (97 days). Chargesheet filed on 20-04-2024 within the 60-day period. The Court notes that while the offence under Section 307 IPC is serious, the accused is not a flight risk given his deep community roots, and the compliant chargesheet filing diminishes the need for continued detention.
CONDITIONS: (1) Personal bond ₹1,00,000 with two sureties ₹50,000 each. One surety bond rejected (mortgaged property); replacement surety required within 7 days. (2) No contact with complainant or witnesses. (3) Surrender passport to Registry. (4) Weekly reporting Sardar Patel Nagar PS. (5) No travel outside Jaipur district without prior leave.
Sd/- K.L. Mathur, ASJ`, 'good', now)

// ── Document 6: Eyewitness Deposition ───────────────────────────────────────
const d6 = insertDoc.run(caseId,
  'DOC_06_Witness_Ramkali_Devi_Deposition.pdf',
  '[Witness Statement] PW-3 Independent Eyewitness — Ramkali Devi.pdf',
  'pdf', 1, 'complete', 33900, 'eng', now)
const d6Id = d6.lastInsertRowid as number

insertPage.run(d6Id, 1, `STATEMENT OF WITNESS UNDER SECTION 180 BNSS / SECTION 161 Cr.P.C.
Witness Name: Ramkali Devi | Age: 58 Years | Occupation: Tea Stall Owner
Location: Ring Road, Near Rajasthan Petroleum Pump, Jaipur
Statement recorded by: Sub-Inspector Harish Chand Meena on 05-03-2024
Deposition:
"On 04-03-2024 at around 20:45 hrs I was operating my tea stall opposite the petrol pump. I clearly saw a grey SUV (Mahindra Scorpio) blocking a white Maruti Ciaz near my stall. A tall man wearing a white shirt stepped out of the SUV, shouted at the Ciaz driver, then went to his vehicle, took out a long iron rod and hit the Ciaz driver on the head with full force. The injured man fell immediately. The attacker fled on a motorcycle that was parked nearby. I noted motorcycle registration RJ-14-CX-0912. I have known Vikram Rathore by sight as he regularly comes to my tea stall and I identified him from police photo identification parade on 06-03-2024."
Date of Deposition: 05-03-2024 | Signed: Ramkali Devi (L.T.I.)`, 'good', now)

console.log(`  ↳ 6 documents and all extracted pages inserted`)

// ════════════════════════════════════════════════════════════════════════════
// 8. DOCUMENT ANNOTATIONS
// ════════════════════════════════════════════════════════════════════════════

const insertAnnotation = db.prepare(`
  INSERT INTO document_annotations (
    case_id, document_id, page_number, selected_text, note, tag, color, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

insertAnnotation.run(caseId, d1Id, 1,
  'Date and Time of Occurrence: 04-03-2024 at approximately 20:45 hrs',
  'FIR timing benchmark: 20:45 hrs is the reference time against which CDR, eyewitness, and medical admission time must all be cross-checked.',
  'fir_lapse', 'amber', now)

insertAnnotation.run(caseId, d1Id, 2,
  'Mobile handset Samsung Galaxy A52 (IMEI: 352109110482017) — seized without contemporaneous Section 63 BSA / 65B IEA certificate.',
  'Procedural lapse: No hash certificate generated at seizure. Affects CDR admissibility. See Arjun Panditrao Khotkar v. Kailash Kushanrao Goratyal (SC 2020).',
  'procedural_lapse', 'rose', now)

insertAnnotation.run(caseId, d2Id, 1,
  'Glasgow Coma Scale (GCS) on arrival: 7/15. Bilateral periorbital haematoma.',
  'Medical severity evidence: GCS 7 on arrival confirms serious head injury consistent with Sec 307 IPC charge; relevant to bail opposition.',
  'medical', 'teal', now)

insertAnnotation.run(caseId, d5Id, 1,
  'One surety bond rejected (mortgaged property); replacement surety required within 7 days.',
  'Bail condition flag: Mother\'s surety rejected — replacement must be obtained. Track deadline.',
  'procedural_lapse', 'amber', now)

insertAnnotation.run(caseId, d6Id, 1,
  'I noted motorcycle registration RJ-14-CX-0912. I have known Vikram Rathore by sight as he regularly comes to my tea stall and I identified him from police photo identification parade on 06-03-2024.',
  'Eyewitness identification corroborated by (a) motorcycle registration matched seizure panchnama and (b) pre-existing acquaintance — robust identification.',
  'eyewitness', 'emerald', now)

insertAnnotation.run(caseId, d3Id, 2,
  'Certificate under Section 63 BSA for mobile handset seizure NOT generated at time of arrest. Certificate subsequently submitted post extraction from FSL.',
  'Chain-of-custody gap: belated 63 BSA certificate weakens CDR evidence; defence can challenge admissibility under Sec 63 BSA read with Arjun Panditrao.',
  'panchnama', 'blue', now)

console.log(`  ↳ 6 document annotations created`)

// ════════════════════════════════════════════════════════════════════════════
// 9. ANALYSIS RUN & FINDINGS WITH SOURCES
// ════════════════════════════════════════════════════════════════════════════

const arResult = run(`
  INSERT INTO analysis_runs (case_id, version, status, engine, review_notes, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`, [
  caseId, 1, 'complete', 'deterministic_local',
  'Multi-document cross-examination across FIR, Medical Report, Chargesheet, FSL DNA Report, Bail Order and Eyewitness Deposition. 6 discrepancies and critical procedural issues identified.',
  now,
])
const runId = arResult.lastInsertRowid as number

const insertFinding = db.prepare(`
  INSERT INTO findings (
    case_id, analysis_run_id, finding_type, description,
    extracted_value, comparison_value, severity, review_status,
    reviewed_by, reviewed_at, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertSource = db.prepare(`
  INSERT INTO finding_sources (finding_id, document_id, page_number, passage, role, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`)

// Finding 1: Electronic evidence certificate timing discrepancy
const fi1 = insertFinding.run(
  caseId, runId, 'missing_info',
  'Section 63 BSA certificate for seized mobile handset was NOT generated at the time of arrest — certificate produced retrospectively post-FSL extraction.',
  'Certificate under Section 63 BSA for mobile handset seizure NOT generated at time of arrest. Certificate subsequently submitted post extraction from FSL. (Chargesheet p.2)',
  'Mobile handset seized without contemporaneous Section 63 BSA / 65B IEA certificate at police station. (FIR/Arrest Memo p.2)',
  'high', 'needs_review', null, null, now, now)
const fi1Id = fi1.lastInsertRowid as number
insertSource.run(fi1Id, d1Id, 2,
  'Mobile handset Samsung Galaxy A52 (IMEI: 352109110482017) — seized without contemporaneous Section 63 BSA / 65B IEA certificate.',
  'primary', now)
insertSource.run(fi1Id, d3Id, 2,
  'Certificate under Section 63 BSA for mobile handset seizure NOT generated at time of arrest. Certificate subsequently submitted post extraction from FSL.',
  'comparison', now)

// Finding 2: Prior conviction disclosure — bail opposition
const fi2 = insertFinding.run(
  caseId, runId, 'missing_info',
  'FIR discloses prior conviction in FIR No. 12/2021 under Sec 325 IPC; chargesheet confirms pattern of violence, but bail order does not specifically address the prior conviction in its reasoning.',
  'Prior conviction established: FIR No. 12/2021, Vaishali Nagar PS, Sec 325 IPC. (FIR/Arrest Memo p.2)',
  'Bail order reasoning does not address the prior conviction mitigating factor. (Bail Order)',
  'medium', 'needs_review', null, null, now, now)
const fi2Id = fi2.lastInsertRowid as number
insertSource.run(fi2Id, d1Id, 2,
  'Prior Criminal Record: FIR No. 12/2021 registered at Vaishali Nagar PS for Sec 325 IPC (Voluntarily Causing Grievous Hurt) — one prior conviction.',
  'primary', now)
insertSource.run(fi2Id, d5Id, 1,
  'Accused in custody since 05-03-2024 (97 days). Chargesheet filed on 20-04-2024 within the 60-day period.',
  'comparison', now)

// Finding 3: FIR time vs medical admission time
const fi3 = insertFinding.run(
  caseId, runId, 'date_discrepancy',
  'FIR alleges incident at 20:45 hrs; victim admitted to SMS Hospital at 21:20 hrs — a 35-minute gap is plausible, but the FIR states complainant "collapsed immediately" which contradicts the hospital admission note showing independent travel time.',
  'Victim admission SMS Hospital: 21:20 hrs. Brought by police. (Medical Report p.1)',
  'Offence at 20:45 hrs — complainant collapsed unconscious at scene (FIR p.1)',
  'low', 'not_a_discrepancy', 'Adv. Senior Counsel', now, now, now)
const fi3Id = fi3.lastInsertRowid as number
insertSource.run(fi3Id, d1Id, 1,
  'Date and Time of Occurrence: 04-03-2024 at approximately 20:45 hrs',
  'primary', now)
insertSource.run(fi3Id, d2Id, 1,
  'Date of Admission: 04-03-2024 | Time: 21:20 hrs. Admitted via: Emergency | Brought by: Police personnel Sardar Patel Nagar PS',
  'comparison', now)

// Finding 4: Injury classification consistency
const fi4 = insertFinding.run(
  caseId, runId, 'missing_info',
  'Chargesheet charges Sec 307 (Attempt to Murder) and 326 IPC (Grievous Hurt); medical report confirms skull fracture constituting grievous hurt under Sec 320 IPC item (vii). The Sec 307 charge requires intent to kill — no direct evidence of intent in FIR.',
  'Medico-Legal classification: GRIEVOUS HURT under Sec 320 IPC item (vii) — fracture of skull. (Medical Report p.2)',
  'Accused charged under Section 307 IPC (Attempt to Murder) requiring proof of intent to kill. (Chargesheet p.1)',
  'high', 'needs_review', null, null, now, now)
const fi4Id = fi4.lastInsertRowid as number
insertSource.run(fi4Id, d2Id, 2,
  'Injury classified as GRIEVOUS HURT under Section 320 IPC item (vii) — fracture of skull. Police Injury Certificate No. JP-MEDLEG-2024-087 issued accordingly.',
  'primary', now)
insertSource.run(fi4Id, d3Id, 1,
  'Sections: 307, 326, 34 IPC.',
  'comparison', now)

// Finding 5: Eyewitness ID vs distance and lighting
const fi5 = insertFinding.run(
  caseId, runId, 'name_variation',
  'Eyewitness Ramkali Devi identified accused from photo parade on 06-03-2024, but deposition does not specify lighting conditions at time of incident (20:45 hrs, night time) or distance of observation from stall to incident site.',
  'Witness from tea stall — no mention of lighting conditions or estimated distance from stall to incident. (Eyewitness Deposition)',
  'Time of Occurrence: 20:45 hrs at Ring Road near petrol pump. (FIR p.1)',
  'medium', 'needs_review', null, null, now, now)
const fi5Id = fi5.lastInsertRowid as number
insertSource.run(fi5Id, d6Id, 1,
  'I was operating my tea stall opposite the petrol pump. I clearly saw a grey SUV (Mahindra Scorpio) blocking a white Maruti Ciaz near my stall.',
  'primary', now)
insertSource.run(fi5Id, d1Id, 1,
  'Date and Time of Occurrence: 04-03-2024 at approximately 20:45 hrs. Place of Occurrence: Ring Road, Near Petrol Pump, Jaipur',
  'comparison', now)

// Finding 6: Bail surety rejection — process gap
const fi6 = insertFinding.run(
  caseId, runId, 'missing_info',
  'Bail order notes one surety bond was rejected (mortgaged property); replacement surety required within 7 days. No confirmation in the case records that replacement surety was filed within the stipulated period.',
  'One surety bond rejected (mortgaged property); replacement surety required within 7 days. (Bail Order)',
  'Bail granted — surety bond compliance pending verification. (Bail conditions record)',
  'medium', 'needs_review', null, null, now, now)
const fi6Id = fi6.lastInsertRowid as number
insertSource.run(fi6Id, d5Id, 1,
  'One surety bond rejected (mortgaged property); replacement surety required within 7 days.',
  'primary', now)

console.log(`  ↳ 6 cross-document findings and source links created`)

// ════════════════════════════════════════════════════════════════════════════
// 10. AUDIT TRAIL
// ════════════════════════════════════════════════════════════════════════════

const insertAudit = db.prepare(`
  INSERT INTO audit_events (case_id, event_type, description, performed_by, performed_at)
  VALUES (?, ?, ?, ?, ?)
`)

insertAudit.run(caseId, 'case_created',       'Case State of Rajasthan v. Vikram Singh Rathore initialised in workspace', 'System Admin', now)
insertAudit.run(caseId, 'document_uploaded',  'FIR No. 87-2024 & Arrest Memo processed and OCR extracted',                  'System Admin', now)
insertAudit.run(caseId, 'document_uploaded',  'Medical Injury Report — SMS Hospital uploaded and extracted',                 'System Admin', now)
insertAudit.run(caseId, 'document_uploaded',  'Police Chargesheet Crime No. 87-2024 uploaded and extracted',                 'System Admin', now)
insertAudit.run(caseId, 'document_uploaded',  'FSL Weapon & DNA Analysis Report FSL-JP-2024-0231 uploaded',                  'System Admin', now)
insertAudit.run(caseId, 'document_uploaded',  'Sessions Court Bail Order dated 10-06-2024 uploaded and extracted',           'System Admin', now)
insertAudit.run(caseId, 'document_uploaded',  'PW-3 Eyewitness Deposition Ramkali Devi uploaded and extracted',              'System Admin', now)
insertAudit.run(caseId, 'bail_field_changed', JSON.stringify({ field: 'remandDate', oldValue: null, newValue: '2024-03-05' }), 'Advocate Clerk', now)
insertAudit.run(caseId, 'bail_field_changed', JSON.stringify({ field: 'chargesheetFiled', oldValue: 0, newValue: 1 }),         'Advocate Clerk', now)
insertAudit.run(caseId, 'bail_field_changed', JSON.stringify({ field: 'chargesheetDate', oldValue: null, newValue: '2024-04-20' }), 'Advocate Clerk', now)
insertAudit.run(caseId, 'bail_field_changed', JSON.stringify({ field: 'paroleGrantDate', oldValue: null, newValue: '2024-08-20' }), 'Advocate Clerk', now)
insertAudit.run(caseId, 'bail_field_changed', JSON.stringify({ field: 'paroleEndDate', oldValue: null, newValue: '2024-09-19' }),   'Advocate Clerk', now)
insertAudit.run(caseId, 'bail_field_changed', JSON.stringify({ field: 'paroleReportingFrequency', oldValue: null, newValue: 'fortnightly' }), 'Advocate Clerk', now)
insertAudit.run(caseId, 'analysis_run',       'Multi-document cross-examination: 6 discrepancies identified across 6 documents', 'Deterministic Engine', now)
insertAudit.run(caseId, 'bail_condition_logged', '4 bail conditions and 4 parole conditions recorded under respective orders', 'Advocate Clerk', now)

console.log(`  ↳ 16 audit events inserted`)

db.close()
console.log(`\n✅ Comprehensive case seeded successfully!`)
console.log(`   Case ID            : ${caseId}`)
console.log(`   Case Number        : CR-2024-RJ-0731`)
console.log(`   Case URL           : /cases/${caseId}`)
console.log(`   Verification URL   : /verification/${caseId}`)
console.log(`   Bail & Parole URL  : /bail-briefs/${caseId}`)
console.log(`   Report URL         : /reports/${caseId}`)
