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
  console.log(`Cleaning up existing case ID ${existingCase.id} to refresh with full 5-document suite...`)
  db.prepare('DELETE FROM cases WHERE id = ?').run(existingCase.id)
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
  'State of Maharashtra v. Aditi Sharma & Anr.',
  'FIR No. 184/2024 registered at Shivajinagar P.S., Pune under Sections 302, 120-B, and 201 IPC (punishable under BNSS §§ 103(1), 61, 238). Accused Aditi Sharma detained since 15 January 2024. Investigation pending forensic timeline analysis, cyber forensics report, and chemical viscera analysis. Defense moved statutory default bail under Section 483 BNSS (Section 439 / 167(2) CrPC) citing completion of 90-day statutory window without chargesheet and conclusive digital/physical alibi proof.',
  'active',
  'bail',
  'Sessions Court, Greater Mumbai / Pune — Special Court No. 4',
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
console.log(`✓ Case created: State of Maharashtra v. Aditi Sharma & Anr. (ID: ${caseId})`)

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
  'Initial production following arrest on 15 Jan 2024. Investigating Officer requested 7 days police custody for device seizure and interrogation.',
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
  'Prosecution requested time to file formal counter-affidavit and await chemical analysis',
  "Hon'ble P. R. Deshmukh",
  'Sessions Court, Pune — Court Hall No. 4',
  now
)

insertHearing.run(
  caseId,
  '2024-02-14',
  'arguments',
  'Arguments heard on defence submission regarding digital alibi (biometric access log and CCTV at Hinjewadi IT Park) vs FIR timeline.',
  'Adjourned for IO appearance with original case diary and Section 63 BSA certificate',
  'Investigating Officer engaged in law and order duty',
  "Hon'ble P. R. Deshmukh",
  'Sessions Court, Pune — Court Hall No. 4',
  now
)

insertHearing.run(
  caseId,
  '2024-03-20',
  'arguments',
  'Defence placed on record RFSL Chemical Analysis Report #9912 demonstrating negative toxicology for organophosphate poisons. IO directed to explain discrepancy.',
  'Court directed SP Cyber Cell to submit certified cell tower logs',
  'State sought 2 weeks to verify RFSL conclusion with medical board',
  "Hon'ble P. R. Deshmukh",
  'Sessions Court, Pune — Court Hall No. 4',
  now
)

insertHearing.run(
  caseId,
  '2026-10-28',
  'bail_hearing',
  'Hearing on Statutory / Default Bail Application under BNSS § 483 / CrPC § 167(2) upon expiry of 90-day investigation window.',
  'Listed for final arguments on indefeasible right to default bail',
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
  'Interim medical inspection allowed; Jail Superintendent instructed to provide necessary medical care and allow counsel interview twice weekly.',
  "Hon'ble P. R. Deshmukh",
  now
)
const orderId = order1.lastInsertRowid as number

insertOrder.run(
  caseId,
  '2024-02-16',
  'other',
  'Direction to the Cyber Crime Unit to submit certified electronic evidence extraction report under Section 63 BSA / Section 65B IEA by next date.',
  "Hon'ble P. R. Deshmukh",
  now
)

insertOrder.run(
  caseId,
  '2024-03-22',
  'other',
  'Show cause notice issued to Investigating Officer for non-production of case diary and failure to verify eye-witness Rajesh Kulkarni physical description discrepancies.',
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
insertCompliance.run(cond2.lastInsertRowid, '2024-03-16', 'complied', 'Reported at 10:10 AM; attendance register signed.', now)

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

// 7. Documents and Extracted Pages
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

// ── Document 1: Police FIR & Remand Panchnama
const doc1Result = insertDoc.run(
  caseId,
  'DOC_01_FIR_184_2024_Shivajinagar_PS.pdf',
  '[Police Record] FIR No. 184-2024 & Inquest Panchnama.pdf',
  'pdf',
  2,
  'complete',
  64500,
  'eng',
  now
)
const doc1Id = doc1Result.lastInsertRowid as number

const doc1Page1 = `FIRST INFORMATION REPORT (Under Section 154 Cr.P.C. / BNSS Section 173)
District: Pune City | Police Station: Shivajinagar | Year: 2024 | FIR No: 0184/2024
Acts & Sections: Indian Penal Code 1860 - Sections 302, 120-B, 201 (punishable under BNSS §§ 103(1), 61, 238)
Date and Time of Occurrence: 12-01-2024 at approximately 21:30 hrs
Place of Occurrence: Near FC Road, Deccan Gymkhana, Pune (approx 2.5 km South-West from P.S.)
Complainant / Informant: Sub-Inspector Vikas R. Shinde (Shivajinagar Police Station)
Name of Accused: Aditi Sharma, aged 26 years, resident of Model Colony, Pune.
Brief Allegation:
Information received that on 12-01-2024 at around 21:30 hrs an altercation ensued between the parties, following which victim Udit Bharti collapsed due to toxic substance ingestion. Complainant alleges that accused Aditi Sharma was seen having a physical altercation and administering a lethal organophosphate chemical poison to the victim, who succumbed shortly thereafter. Accused Aditi Sharma is alleged to have had conspiratorial communications and prior disputes with the victim.`

const doc1Page2 = `RECORD OF SEIZURE AND REMAND PANCHNAMA
Accused: Aditi Sharma | Date of Arrest: 15-01-2024 at 16:00 hrs
First Production before Magistrate: 16-01-2024 | Remand Period: 14 Days Judicial Custody
Seized Properties and Devices:
1. One smartphone Samsung Galaxy S22 (Model SM-S901B)
2. Office entry biometric smart card and swipe logs

Investigating Officer Note on Electronic Records:
Tower location triangulation shows handset pinging Shivajinagar tower at 21:42 hrs. Device seized without contemporaneous Section 65B IEA / Section 63 BSA certificate or forensic hash generation at police station. Forensic extraction from Regional Forensic Science Laboratory (RFSL), Ganeshkhind, Pune is awaited.`

insertPage.run(doc1Id, 1, doc1Page1, 'good', now)
insertPage.run(doc1Id, 2, doc1Page2, 'good', now)

// ── Document 2: PW-1 Eye-Witness Deposition
const doc2Result = insertDoc.run(
  caseId,
  'DOC_02_Witness_PW1_Rajesh_Kulkarni.pdf',
  '[Witness Statement] PW-1 Eye-Witness Deposition - Rajesh Kulkarni.pdf',
  'pdf',
  2,
  'complete',
  52100,
  'eng',
  now
)
const doc2Id = doc2Result.lastInsertRowid as number

const doc2Page1 = `STATEMENT OF WITNESS UNDER SECTION 180 BNSS / SECTION 161 Cr.P.C.
Witness Name: Rajesh Manohar Kulkarni | Age: 44 Years | Occupation: Senior Security Supervisor
Location: Deccan Gymkhana Commercial Complex, FC Road, Pune
Statement recorded by: Sub-Inspector Vikas R. Shinde on 14-01-2024
Deposition:
"On 12-01-2024 at approximately 21:05 hrs, I was stationed at the north vehicular entrance gate facing FC Road. I observed a heated argument near the sedan in the north parking bay. The individual arguing with victim Udit Bharti was wearing a dark navy hooded rain jacket, helmet, and left on a red motorcycle towards Senapati Bapat Road before 21:12 hrs. The victim was standing alone and collapsed on the pavement around 21:20 hrs."`

const doc2Page2 = `CONTINUATION OF DEPOSITION OF PW-1 RAJESH KULKARNI
Statement continued:
"When the police showed me photographs of accused Aditi Sharma, I clearly stated that I know Aditi Sharma by sight as she frequents the coffee shop adjacent to our complex. Aditi Sharma is approximately 5'3" and slender. She was definitely not the person who fled on the motorcycle at 21:12 hrs. The motorcyclist was a tall person, at least 5'10" tall, with broad shoulders. Furthermore, nobody approached the victim between 21:12 hrs and 21:20 hrs when he collapsed."`

insertPage.run(doc2Id, 1, doc2Page1, 'good', now)
insertPage.run(doc2Id, 2, doc2Page2, 'good', now)

// ── Document 3: PW-2 Alibi & Workplace Deposition
const doc3Result = insertDoc.run(
  caseId,
  'DOC_03_Witness_PW2_Dr_Meera_Deshmukh.pdf',
  '[Witness Statement] PW-2 Alibi & Workplace Deposition - Dr. Meera Deshmukh.pdf',
  'pdf',
  1,
  'complete',
  41800,
  'eng',
  now
)
const doc3Id = doc3Result.lastInsertRowid as number

const doc3Page1 = `STATEMENT OF WITNESS UNDER SECTION 180 BNSS / SECTION 161 Cr.P.C.
Witness Name: Dr. Meera Deshmukh | Age: 48 Years | Occupation: Vice President (Cloud Architecture)
Employer: Cognizant Technology Solutions India Pvt. Ltd., Hinjewadi Phase 1, Pune
Statement recorded on 18-01-2024:
Deposition regarding presence of Aditi Sharma:
"I am the direct reporting manager and project sponsor for Aditi Sharma. On the evening of 12-01-2024, our team conducted the quarterly client enterprise security architecture review for our global financial client. Accused Aditi Sharma was present in Conference Room Beta on the 4th floor continuously from 20:15 hrs to 22:00 hrs on 12-01-2024 for the quarterly client architecture review. She personally presented slides 14 to 28 between 21:15 hrs and 21:40 hrs. More than twelve team members were physically seated in the conference room. I personally spoke with her at 21:45 hrs regarding the deployment rollback strategy. Cognizant Hinjewadi campus is 19.4 kilometers away from FC Road, and navigating this distance on a Friday evening takes a minimum of 45 to 60 minutes."`

insertPage.run(doc3Id, 1, doc3Page1, 'good', now)

// ── Document 4: RFSL Chemical & Toxicology Analysis Report
const doc4Result = insertDoc.run(
  caseId,
  'DOC_04_RFSL_Toxicology_Report_9912.pdf',
  '[Forensic Proof] RFSL Chemical & Toxicology Analysis Report #9912.pdf',
  'pdf',
  2,
  'complete',
  58900,
  'eng',
  now
)
const doc4Id = doc4Result.lastInsertRowid as number

const doc4Page1 = `GOVERNMENT OF MAHARASHTRA — DIRECTORATE OF FORENSIC SCIENCE LABORATORIES
Regional Forensic Science Laboratory (RFSL), Ganeshkhind, Pune - 411007
REPORT OF CHEMICAL EXAMINER & FORENSIC TOXICOLOGIST
Report No: RFSL-PUN-TOX-2024-9912 | Date: 02-02-2024
Reference: Shivajinagar P.S. Crime No. 184/2024 (Victim: Udit Bharti)
Results of Chemical Analysis:
"Viscera parcels (Stomach and its contents, loop of small intestine, portions of liver, spleen, and kidney) and blood sample were subjected to chemical analysis, gas chromatography-mass spectrometry (GC-MS), and thin layer chromatography (TLC). Test for Organophosphate pesticides, Organochloro compounds, Cyanide, and Carbon Monoxide yielded NEGATIVE results. No toxic volatile or metallic poison detected."`

const doc4Page2 = `RFSL FORENSIC TOXICOLOGY REPORT #9912 (CONTINUED)
Toxicological Conclusion:
"Quantitative screening identified therapeutic trace concentrations of Metoprolol Tartrate (blood level 0.08 mg/L), consistent with standard prescribed cardiac anti-hypertensive medication. Pathological cross-examination of coronary arteries revealed 90% occlusion in the Left Anterior Descending (LAD) branch. The cause of death is certified as Acute Myocardial Infarction due to severe coronary atherosclerosis, devoid of chemical poisoning or toxic administration."`

insertPage.run(doc4Id, 1, doc4Page1, 'good', now)
insertPage.run(doc4Id, 2, doc4Page2, 'good', now)

// ── Document 5: Cyber Cell Biometric & CDR Tower Audit
const doc5Result = insertDoc.run(
  caseId,
  'DOC_05_Cyber_Cell_Biometric_CDR_Audit.pdf',
  '[Digital Proof] Cyber Cell Biometric & CDR Tower Audit (Sec 63 BSA).pdf',
  'pdf',
  2,
  'complete',
  71200,
  'eng',
  now
)
const doc5Id = doc5Result.lastInsertRowid as number

const doc5Page1 = `OFFICE OF THE SUPERINTENDENT OF POLICE — CYBER CRIME & FORENSIC DIGITAL CELL, PUNE
CERTIFICATE OF ELECTRONIC EVIDENCE UNDER SECTION 63 BHARATIYA SAKSHYA ADHINIYAM, 2023
[Equated to Section 65B of Indian Evidence Act, 1872]
Case Ref: State v. Aditi Sharma | Crime FIR No. 184/2024 | Audit Ref: CC-CYBER-2024-0418-E
Physical & Digital Turnstile Log Verification:
"The undersigned certified digital forensic examiner inspected the automated turnstile access system at Cognizant Technology Solutions, Hinjewadi Phase-1. Cryptographic SHA-256 hash was generated contemporaneous with data extraction. Turnstile smart card logs at Cognizant Hinjewadi: Inward swipe at 18:42:11 hrs, Outward swipe at 22:18:45 hrs. Active keystroke log on workstation #ENG-WS-409 indicates code commit at 21:34:02 hrs. High-resolution CCTV camera #CAM-04-NORTH shows accused entering boardroom at 20:28 hrs and leaving at 22:04 hrs."`

const doc5Page2 = `CYBER FORENSICS CELL — CELLULAR TOWER & CDR TRIANGULATION AUDIT
Analysis of Mobile Number 98230-XXXXX (Handset Samsung Galaxy S22 IMEI: 354892019482012):
"Cellular Call Detail Record (CDR) analysis: Accused mobile number 98230-XXXXX remained latched to Hinjewadi Phase-1 Cell Tower ID #HNJ-04-W (Azimuth 120°) throughout 20:00 to 22:30 hrs. The alleged Shivajinagar tower ping cited in FIR at 21:42 hrs belonged to SIM card 98231-YYYYY registered to an unrelated third party, which the local police station inadvertently conflated. Accused handset did not connect to Shivajinagar tower at any point during 12-01-2024."`

insertPage.run(doc5Id, 1, doc5Page1, 'good', now)
insertPage.run(doc5Id, 2, doc5Page2, 'good', now)

console.log('✓ 5 Documents and all extracted pages attached')

// 8. Document Annotations
const insertAnnotation = db.prepare(`
  INSERT INTO document_annotations (
    case_id, document_id, page_number, selected_text, note, tag, color, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

insertAnnotation.run(
  caseId,
  doc1Id,
  1,
  'Date and Time of Occurrence: 12-01-2024 at approximately 21:30 hrs',
  'Alleged crime time: 21:30 hrs. Benchmark for comparison against Hinjewadi turnstile, keystroke, and CCTV evidence.',
  'alibi',
  'teal',
  now
)

insertAnnotation.run(
  caseId,
  doc2Id,
  1,
  'The individual arguing with victim Udit Bharti was wearing a dark navy hooded rain jacket, helmet, and left on a red motorcycle towards Senapati Bapat Road before 21:12 hrs. The victim was standing alone and collapsed on the pavement around 21:20 hrs.',
  'Independent security guard PW-1 establishes assailant departed at 21:12 hrs and victim collapsed alone at 21:20 hrs, disproving FIR claim of 21:30 assault.',
  'eyewitness',
  'amber',
  now
)

insertAnnotation.run(
  caseId,
  doc3Id,
  1,
  'Accused Aditi Sharma was present in Conference Room Beta on the 4th floor continuously from 20:15 hrs to 22:00 hrs on 12-01-2024 for the quarterly client architecture review. She personally presented slides 14 to 28 between 21:15 hrs and 21:40 hrs.',
  'Impossibility alibi: Accused actively presenting to corporate client 19.4 km away during alleged crime window.',
  'alibi',
  'emerald',
  now
)

insertAnnotation.run(
  caseId,
  doc4Id,
  1,
  'Test for Organophosphate pesticides, Organochloro compounds, Cyanide, and Carbon Monoxide yielded NEGATIVE results. No toxic volatile or metallic poison detected.',
  'Conclusive medical proof: FSL chemical examiner found zero poison traces; death was natural cardiac arrest.',
  'medical',
  'rose',
  now
)

insertAnnotation.run(
  caseId,
  doc5Id,
  1,
  'Turnstile smart card logs at Cognizant Hinjewadi: Inward swipe at 18:42:11 hrs, Outward swipe at 22:18:45 hrs. Active keystroke log on workstation #ENG-WS-409 indicates code commit at 21:34:02 hrs. High-resolution CCTV camera #CAM-04-NORTH shows accused entering boardroom at 20:28 hrs and leaving at 22:04 hrs.',
  'Sec 63 BSA certified electronic proof corroborating physical alibi with cryptographic hash integrity.',
  'alibi',
  'emerald',
  now
)

insertAnnotation.run(
  caseId,
  doc1Id,
  2,
  'Device seized without contemporaneous Section 65B IEA / Section 63 BSA certificate or forensic hash generation at police station.',
  'Fatal procedural lapse: Seizure without hash value violates Supreme Court electronic evidence directives in Arjun Panditrao.',
  'procedural_lapse',
  'amber',
  now
)

console.log('✓ Document annotations created')

// 9. Analysis Run & Findings with Sources
const insertAnalysisRun = db.prepare(`
  INSERT INTO analysis_runs (case_id, version, status, engine, review_notes, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`)

const runResult = insertAnalysisRun.run(
  caseId,
  1,
  'complete',
  'deterministic_local',
  'Multi-document cross-examination completed across FIR, Witness Statements, Toxicology Report, and Cyber Cell Audit. 5 high-severity contradictions surfaced.',
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

const insertSource = db.prepare(`
  INSERT INTO finding_sources (finding_id, document_id, page_number, passage, role, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`)

// Finding 1: FIR vs Eye-Witness Contradiction on Departure & Suspect
const f1 = insertFinding.run(
  caseId,
  runId,
  'date_discrepancy',
  'Temporal & Identity contradiction between FIR allegation and Eye-Witness PW-1 deposition.',
  'Assailant fled on motorcycle before 21:12 hrs; victim collapsed alone at 21:20 hrs (PW-1 Deposition)',
  '21:30 hrs physical altercation and poisoning at FC Road (Police FIR)',
  'high',
  'verified',
  'Adv. Senior Counsel',
  now,
  now,
  now
)
const f1Id = f1.lastInsertRowid as number

insertSource.run(
  f1Id,
  doc1Id,
  1,
  '12-01-2024 at around 21:30 hrs an altercation ensued between the parties, following which victim Udit Bharti collapsed due to toxic substance ingestion. Complainant alleges that accused Aditi Sharma was seen having a physical altercation and administering a lethal organophosphate chemical poison',
  'primary',
  now
)

insertSource.run(
  f1Id,
  doc2Id,
  1,
  'The individual arguing with victim Udit Bharti was wearing a dark navy hooded rain jacket, helmet, and left on a red motorcycle towards Senapati Bapat Road before 21:12 hrs. The victim was standing alone and collapsed on the pavement around 21:20 hrs.',
  'comparison',
  now
)

// Finding 2: FIR Allegation vs Certified Biometric & CCTV Alibi Proof (Geographic Impossibility)
const f2 = insertFinding.run(
  caseId,
  runId,
  'location_mismatch',
  'Geographic Impossibility: Accused in Hinjewadi corporate boardroom (19.4 km away) during alleged FC Road incident.',
  'Inward swipe 18:42, keystroke code commit at 21:34, CCTV in boardroom until 22:04 (Cyber Cell Proof)',
  '21:30 hrs physical altercation at FC Road, Deccan Gymkhana (Police FIR)',
  'high',
  'verified',
  'Adv. Senior Counsel',
  now,
  now,
  now
)
const f2Id = f2.lastInsertRowid as number

insertSource.run(
  f2Id,
  doc1Id,
  1,
  'Date and Time of Occurrence: 12-01-2024 at approximately 21:30 hrs',
  'primary',
  now
)

insertSource.run(
  f2Id,
  doc5Id,
  1,
  'Turnstile smart card logs at Cognizant Hinjewadi: Inward swipe at 18:42:11 hrs, Outward swipe at 22:18:45 hrs. Active keystroke log on workstation #ENG-WS-409 indicates code commit at 21:34:02 hrs. High-resolution CCTV camera #CAM-04-NORTH shows accused entering boardroom at 20:28 hrs and leaving at 22:04 hrs.',
  'comparison',
  now
)

// Finding 3: FIR Poison Allegation vs Forensic Toxicology Lab Analysis
const f3 = insertFinding.run(
  caseId,
  runId,
  'missing_info',
  'Forensic Medical Contradiction: RFSL laboratory report refutes police allegation of lethal poisoning.',
  'Zero traces of organophosphates, organochloro, or cyanide; death due to cardiac infarction (RFSL Report)',
  'Lethal organophosphate chemical poisoning administered by accused (Police FIR)',
  'high',
  'verified',
  'Adv. Senior Counsel',
  now,
  now,
  now
)
const f3Id = f3.lastInsertRowid as number

insertSource.run(
  f3Id,
  doc1Id,
  1,
  'administering a lethal organophosphate chemical poison to the victim, who succumbed shortly thereafter',
  'primary',
  now
)

insertSource.run(
  f3Id,
  doc4Id,
  1,
  'Test for Organophosphate pesticides, Organochloro compounds, Cyanide, and Carbon Monoxide yielded NEGATIVE results. No toxic volatile or metallic poison detected.',
  'comparison',
  now
)

// Finding 4: FIR Tower Location vs Certified Cyber Cell CDR Tower Triangulation
const f4 = insertFinding.run(
  caseId,
  runId,
  'date_discrepancy',
  'Cellular Tower Conflation: Police FIR cited unrelated third-party SIM card tower ping.',
  'Continuous connection to Hinjewadi-West Tower from 20:00 to 22:30 hrs (Cyber Forensics CDR)',
  'Alleged 21:42 hrs ping at Shivajinagar tower (Police FIR Remand Report)',
  'high',
  'needs_review',
  null,
  null,
  now,
  now
)
const f4Id = f4.lastInsertRowid as number

insertSource.run(
  f4Id,
  doc1Id,
  2,
  'Tower location triangulation shows handset pinging Shivajinagar tower at 21:42 hrs.',
  'primary',
  now
)

insertSource.run(
  f4Id,
  doc5Id,
  2,
  'Cellular Call Detail Record (CDR) analysis: Accused mobile number 98230-XXXXX remained latched to Hinjewadi Phase-1 Cell Tower ID #HNJ-04-W (Azimuth 120°) throughout 20:00 to 22:30 hrs. The alleged Shivajinagar tower ping cited in FIR at 21:42 hrs belonged to SIM card 98231-YYYYY registered to an unrelated third party',
  'comparison',
  now
)

// Finding 5: Eye-Witness Physical Description vs Alibi Corroboration
const f5 = insertFinding.run(
  caseId,
  runId,
  'name_variation',
  'Physical description variance: PW-1 eyewitness confirms motorcyclist was male 5\'10", whereas accused is female 5\'3".',
  'Accused 5\'3" slender female presenting slides in corporate boardroom (PW-2 Alibi & PW-1 Deposition)',
  'Tall broad-shouldered person in helmet fleeing scene on motorcycle (PW-1 Deposition)',
  'medium',
  'verified',
  'Adv. Senior Counsel',
  now,
  now,
  now
)
const f5Id = f5.lastInsertRowid as number

insertSource.run(
  f5Id,
  doc2Id,
  2,
  'Aditi Sharma is approximately 5\'3" and slender. She was definitely not the person who fled on the motorcycle at 21:12 hrs.',
  'primary',
  now
)

insertSource.run(
  f5Id,
  doc3Id,
  1,
  'Accused Aditi Sharma was present in Conference Room Beta on the 4th floor continuously from 20:15 hrs to 22:00 hrs on 12-01-2024 for the quarterly client architecture review. She personally presented slides 14 to 28 between 21:15 hrs and 21:40 hrs.',
  'comparison',
  now
)

// Finding 6: Chain of Custody & Procedural Electronic Evidence Lapse
const f6 = insertFinding.run(
  caseId,
  runId,
  'missing_info',
  'Mandatory Section 63 BSA / 65B IEA certificate omitted during primary device seizure at police station.',
  'Device seized without hash generation or statutory certification (Remand Panchnama)',
  'Mandatory statutory compliance for electronic evidence admissibility under Sec 63 BSA',
  'medium',
  'needs_review',
  null,
  null,
  now,
  now
)
const f6Id = f6.lastInsertRowid as number

insertSource.run(
  f6Id,
  doc1Id,
  2,
  'Device seized without contemporaneous Section 65B IEA / Section 63 BSA certificate or forensic hash generation at police station.',
  'primary',
  now
)

insertSource.run(
  f6Id,
  doc5Id,
  1,
  'CERTIFICATE OF ELECTRONIC EVIDENCE UNDER SECTION 63 BHARATIYA SAKSHYA ADHINIYAM, 2023',
  'comparison',
  now
)

console.log('✓ 6 Cross-document findings and source links created')

// 10. Audit Trail Events
const insertAudit = db.prepare(`
  INSERT INTO audit_events (case_id, event_type, description, performed_by, performed_at)
  VALUES (?, ?, ?, ?, ?)
`)

insertAudit.run(caseId, 'case_created', 'Case State of Maharashtra v. Aditi Sharma & Anr. initialized in workspace', 'System Admin', now)
insertAudit.run(caseId, 'document_uploaded', 'Police FIR No. 184-2024 & Inquest Panchnama processed and extracted', 'System Admin', now)
insertAudit.run(caseId, 'document_uploaded', 'PW-1 Eye-Witness Deposition (Rajesh Kulkarni) uploaded', 'System Admin', now)
insertAudit.run(caseId, 'document_uploaded', 'PW-2 Alibi Deposition (Dr. Meera Deshmukh) uploaded', 'System Admin', now)
insertAudit.run(caseId, 'document_uploaded', 'RFSL Chemical & Toxicology Analysis Report #9912 processed', 'System Admin', now)
insertAudit.run(caseId, 'document_uploaded', 'Cyber Cell Biometric & CDR Tower Audit (Sec 63 BSA) processed', 'System Admin', now)
insertAudit.run(caseId, 'analysis_run', 'Multi-document cross-examination run: 6 discrepancies identified', 'Deterministic Engine', now)
insertAudit.run(caseId, 'bail_condition_logged', '3 bail conditions recorded under interim inspection order', 'Advocate Clerk', now)

console.log('✓ Audit trail events populated')

db.close()
console.log(`✨ Comprehensive Case Example with 5 Documents, Witness Statements, and Proof successfully created (ID: ${caseId})!`)
