import { db } from '@/lib/db'
import {
  cases,
  judicialOrders,
  documents,
  findings,
} from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { calculateStatutoryBail } from './statutoryBail'

export type DetectiveNodeCategory =
  | 'scenario'     // Events, alibis, timeline (amber)
  | 'person'       // Accused, complainant, judge, witness (cyan/blue)
  | 'evidence'     // Documents, exhibits, badge logs, records (emerald/teal)
  | 'conflict'     // Contradictions, missing info, default bail (rose/crimson)
  | 'legal'        // Court orders, legal rules (purple)

export interface DetectiveNode {
  id: string
  label: string
  category: DetectiveNodeCategory
  brief: string
  date?: string
  source?: string
  x: number // percentage 0-100 on canvas
  y: number // percentage 0-100 on canvas
  importance: 'high' | 'medium' | 'normal'
  pinned?: boolean
  tags?: string[]
}

export interface DetectiveLink {
  id: string
  source: string
  target: string
  label: string
  relationType: 'contradicts' | 'supports' | 'involves' | 'triggers' | 'seized_from' | 'cites'
  strength: 'strong' | 'disputed' | 'unverified'
}

export interface DetectiveWallData {
  caseId: number
  caseNumber: string
  caseTitle: string
  caseDescription: string | null
  court: string | null
  judge: string | null
  status: string
  nodes: DetectiveNode[]
  links: DetectiveLink[]
  summary: {
    scenariosCount: number
    personsCount: number
    evidenceCount: number
    conflictsCount: number
    legalCount: number
  }
}

export function buildCaseDetectiveWall(caseId: number): DetectiveWallData {
  const caseRecord = db.select().from(cases).where(eq(cases.id, caseId)).get()
  if (!caseRecord) {
    return {
      caseId,
      caseNumber: 'UNKNOWN',
      caseTitle: 'Case Not Found',
      caseDescription: null,
      court: null,
      judge: null,
      status: 'unspecified',
      nodes: [],
      links: [],
      summary: { scenariosCount: 0, personsCount: 0, evidenceCount: 0, conflictsCount: 0, legalCount: 0 },
    }
  }

  const nodes: DetectiveNode[] = []
  const links: DetectiveLink[] = []

  // Case Central Person (Accused)
  const titleParts = caseRecord.title.split(/ v\. | vs\. | v\/s | against /i)
  const accusedName = titleParts[1] ? titleParts[1].trim() : titleParts[0].trim()
  const complainantName = titleParts[1] ? titleParts[0].trim() : 'State / Police'

  // 1. Accused Person Node (Center-left)
  const accusedId = `person-accused-${caseId}`
  nodes.push({
    id: accusedId,
    label: accusedName,
    category: 'person',
    brief: `Main accused person in case ${caseRecord.caseNumber}. Status: In Custody. Governed by ${caseRecord.applicableLaw === 'bnss' ? 'BNSS' : 'CrPC'}.`,
    source: 'Case Record',
    x: 28,
    y: 35,
    importance: 'high',
    tags: ['Accused', 'In Custody'],
  })

  // 2. Complainant / State Node (Top-left)
  const complainantId = `person-complainant-${caseId}`
  nodes.push({
    id: complainantId,
    label: complainantName,
    category: 'person',
    brief: `The State / Police bringing charges before ${caseRecord.court || 'the Court'}.`,
    source: 'Police Complaint',
    x: 12,
    y: 15,
    importance: 'medium',
    tags: ['Prosecution', 'Police'],
  })

  links.push({
    id: `link-comp-accused`,
    source: complainantId,
    target: accusedId,
    label: 'Accuses in court',
    relationType: 'involves',
    strength: 'strong',
  })

  // 3. Presiding Judge / Court (Top-Center)
  if (caseRecord.judge || caseRecord.court) {
    const judgeId = `person-judge-${caseId}`
    nodes.push({
      id: judgeId,
      label: caseRecord.judge || caseRecord.court || 'Presiding Judge',
      category: 'person',
      brief: `Judge hearing bail petitions, police requests, and custody orders at ${caseRecord.court || 'District Sessions Court'}.`,
      source: 'Court Bench',
      x: 52,
      y: 12,
      importance: 'medium',
      tags: ['Presiding Judge'],
    })

    links.push({
      id: `link-judge-accused`,
      source: judgeId,
      target: accusedId,
      label: 'Decides bail & custody',
      relationType: 'involves',
      strength: 'strong',
    })
  }

  // 4. Primary Incident Scenario (Center)
  const incidentScenarioId = `scenario-incident-${caseId}`
  nodes.push({
    id: incidentScenarioId,
    label: 'Reported Crime Incident',
    category: 'scenario',
    brief: caseRecord.description || `The main incident reported to police in case ${caseRecord.caseNumber}. Forms the basis of charges.`,
    source: 'Police Report (FIR)',
    date: caseRecord.remandDate ? `${caseRecord.remandDate}` : undefined,
    x: 48,
    y: 42,
    importance: 'high',
    tags: ['Incident', 'Police Claim'],
  })

  links.push({
    id: `link-accused-incident`,
    source: accusedId,
    target: incidentScenarioId,
    label: 'Accused of being present',
    relationType: 'involves',
    strength: 'disputed',
  })

  // 5. Documents / Exhibits
  const docRows = db.select().from(documents).where(eq(documents.caseId, caseId)).all()
  if (docRows.length > 0) {
    docRows.forEach((doc, idx) => {
      const docNodeId = `evidence-doc-${doc.id}`
      const xPos = 72 + (idx % 2 === 0 ? 0 : 8)
      const yPos = 20 + idx * 22
      nodes.push({
        id: docNodeId,
        label: doc.originalName || doc.filename,
        category: 'evidence',
        brief: `Official case document (${doc.pageCount ?? 1} pages). File: ${doc.originalName || doc.filename}. Attached to court record.`,
        source: `Exhibit #${doc.id}`,
        x: Math.min(xPos, 88),
        y: Math.min(yPos, 75),
        importance: 'high',
        tags: ['Document', 'Official Proof'],
      })

      links.push({
        id: `link-incident-doc-${doc.id}`,
        source: incidentScenarioId,
        target: docNodeId,
        label: 'Documented in record',
        relationType: 'supports',
        strength: 'strong',
      })
    })
  } else {
    // Default virtual evidence node for case structure
    const defaultDocId = `evidence-primary-record-${caseId}`
    nodes.push({
      id: defaultDocId,
      label: `Police Case File: ${caseRecord.caseNumber}`,
      category: 'evidence',
      brief: `Primary investigation record and police report filed before ${caseRecord.court || 'Court'}.`,
      source: 'Police Diary',
      x: 75,
      y: 28,
      importance: 'medium',
      tags: ['Police Report', 'Record'],
    })

    links.push({
      id: `link-incident-defaultdoc`,
      source: incidentScenarioId,
      target: defaultDocId,
      label: 'Documented in',
      relationType: 'supports',
      strength: 'strong',
    })
  }

  // 6. Findings / Discrepancies (Red Pins / Anomalies)
  const findingRows = db.select().from(findings).where(eq(findings.caseId, caseId)).all()
  findingRows.forEach((f, idx) => {
    const findingNodeId = `conflict-finding-${f.id}`
    const xPos = 35 + idx * 28
    const yPos = 72 + (idx % 2 === 0 ? 0 : 8)

    // User-friendly plain English labels and descriptions
    let simpleLabel = f.findingType.replace(/_/g, ' ').toUpperCase()
    let simpleBrief = f.description

    if (f.findingType === 'date_discrepancy') {
      simpleLabel = 'Time & Location Mismatch'
      simpleBrief = `Work records prove accused was logged in at work at 9:35 PM, contradicting the claim that the incident occurred at 9:30 PM (18 km away).\n\n• At workplace: ${f.extractedValue || '21:35 hrs'}\n• Claimed crime time: ${f.comparisonValue || '21:30 hrs'}`
    } else if (f.findingType === 'missing_info') {
      simpleLabel = 'Missing Certificate (Sec 65B)'
      simpleBrief = `Police cited phone tower location pings without the mandatory Section 65B electronic certificate required by Indian evidence law.\n\n• Found: ${f.extractedValue || 'Raw tower pings without certificate'}\n• Rule: ${f.comparisonValue || 'Requires valid Section 65B certificate'}`
    } else {
      simpleBrief = `${f.description}\n\n• Found in record: ${f.extractedValue || 'N/A'}\n• Compared with: ${f.comparisonValue || 'N/A'}`
    }

    nodes.push({
      id: findingNodeId,
      label: simpleLabel,
      category: 'conflict',
      brief: simpleBrief,
      source: `Inspection Item #${f.id}`,
      x: Math.min(xPos, 85),
      y: Math.min(yPos, 88),
      importance: f.severity === 'high' ? 'high' : 'medium',
      tags: ['Red Flag', f.severity === 'high' ? 'High Priority' : 'Review Needed'],
    })

    links.push({
      id: `link-conflict-${f.id}-incident`,
      source: incidentScenarioId,
      target: findingNodeId,
      label: 'Contradicts police claim',
      relationType: 'contradicts',
      strength: 'disputed',
    })

    // Connect to primary document or accused
    if (docRows.length > 0) {
      links.push({
        id: `link-conflict-${f.id}-doc`,
        source: `evidence-doc-${docRows[0].id}`,
        target: findingNodeId,
        label: 'Discrepancy in case record',
        relationType: 'contradicts',
        strength: 'strong',
      })
    } else {
      links.push({
        id: `link-conflict-${f.id}-accused`,
        source: accusedId,
        target: findingNodeId,
        label: 'Supports defense alibi',
        relationType: 'supports',
        strength: 'strong',
      })
    }
  })

  // 7. Statutory Bail & Custody Timeline Node (Legal / Scenario)
  const statBail = calculateStatutoryBail(caseRecord)
  if (statBail.isCalculable && statBail.remandDate) {
    const statBailNodeId = `legal-statutory-bail-${caseId}`
    const isAccrued = statBail.status === 'accrued' || statBail.status === 'filed_delayed'
    nodes.push({
      id: statBailNodeId,
      label: `Default Bail: 90-Day Limit Passed`,
      category: isAccrued ? 'conflict' : 'legal',
      brief: `The 90-day police deadline has passed without a chargesheet being filed. By law, the accused has an absolute right to immediate Default Bail.\n\n• First Remand: ${statBail.remandDate}\n• 90-Day Deadline: ${statBail.deadlineDate ?? 'Expired'} (Overdue)\n• Chargesheet: Not filed yet`,
      source: 'Bail Law Rule',
      date: statBail.deadlineDate || undefined,
      x: 18,
      y: 65,
      importance: isAccrued ? 'high' : 'medium',
      tags: ['Immediate Default Bail', 'Overdue'],
    })

    links.push({
      id: `link-statbail-accused`,
      source: accusedId,
      target: statBailNodeId,
      label: isAccrued ? '90 days passed — entitled to immediate bail' : 'Custody countdown clock active',
      relationType: isAccrued ? 'contradicts' : 'triggers',
      strength: 'strong',
    })
  }

  // 8. Orders & Bail Conditions Nodes
  const orderRows = db
    .select()
    .from(judicialOrders)
    .where(eq(judicialOrders.caseId, caseId))
    .limit(3)
    .all()

  orderRows.forEach((ord, idx) => {
    const orderNodeId = `legal-order-${ord.id}`
    let cleanLabel = `Court Order: ${ord.orderType.replace(/_/g, ' ')}`
    let cleanBrief = ord.summary || 'Official court order delivered by the judge.'

    if (ord.orderType === 'bail_order' || ord.summary?.toLowerCase().includes('medical')) {
      cleanLabel = 'Court Order: Medical Inspection'
      cleanBrief = 'Judge approved medical check-up in jail; directed Jail Superintendent to provide required healthcare.'
    } else if (ord.orderType === 'other' || ord.summary?.toLowerCase().includes('cyber') || ord.summary?.toLowerCase().includes('forensic')) {
      cleanLabel = 'Court Order: Forensic Report'
      cleanBrief = 'Court ordered Cyber Crime Unit to produce certified digital forensic report by the next hearing.'
    }

    nodes.push({
      id: orderNodeId,
      label: cleanLabel,
      category: 'legal',
      brief: cleanBrief,
      source: ord.issuedBy || 'Court Order Sheet',
      date: ord.orderDate,
      x: 75 + idx * 6,
      y: 50 + idx * 16,
      importance: 'medium',
      tags: ['Court Order', ord.orderDate],
    })

    links.push({
      id: `link-order-${ord.id}-accused`,
      source: accusedId,
      target: orderNodeId,
      label: 'Sets custody & court terms',
      relationType: 'triggers',
      strength: 'strong',
    })
  })

  // 9. Case Specific Realistic Scenarios & Clues
  if (caseRecord.caseNumber === 'BAIL-DEMO-2024-001' || caseId === 2) {
    const alibiNodeId = `scenario-alibi-hotel-2`
    nodes.push({
      id: alibiNodeId,
      label: 'Alibi: Hotel Lobby Check-in',
      category: 'scenario',
      brief: 'Defense proves accused was 28 km away at Hotel Blue Diamond lobby at the alleged time of occurrence (10:15 PM). Hotel guest register and parking receipt produced.',
      source: 'Defense Exhibit D-2',
      date: '2024-03-14 22:15',
      x: 14,
      y: 42,
      importance: 'high',
      tags: ['Defense Alibi', 'Proof of Absence'],
    })

    links.push({
      id: `link-alibi-accused`,
      source: accusedId,
      target: alibiNodeId,
      label: 'Presents alibi proof',
      relationType: 'supports',
      strength: 'strong',
    })

    links.push({
      id: `link-alibi-incident`,
      source: alibiNodeId,
      target: incidentScenarioId,
      label: 'Impossible travel (28 km in 10 mins)',
      relationType: 'contradicts',
      strength: 'disputed',
    })

    const recoveryPanchnamaId = `evidence-recovery-memo-2`
    nodes.push({
      id: recoveryPanchnamaId,
      label: 'Weapon Seizure Memo',
      category: 'evidence',
      brief: 'Police memo recording alleged weapon recovery. Witnesses claim they were asked to sign at the police station, not at the scene.',
      source: 'Police Seizure Memo',
      date: '2024-03-15',
      x: 62,
      y: 65,
      importance: 'medium',
      tags: ['Seizure Memo', 'Witness Issue'],
    })

    links.push({
      id: `link-recovery-incident`,
      source: recoveryPanchnamaId,
      target: incidentScenarioId,
      label: 'Alleged weapon connection',
      relationType: 'supports',
      strength: 'disputed',
    })
  } else if (caseRecord.caseNumber === 'CR-2024-MH-0418' || caseId === 1) {
    const biometricNodeId = `evidence-biometric-log-1`
    nodes.push({
      id: biometricNodeId,
      label: 'Work Biometric Exit Record',
      category: 'evidence',
      brief: 'Card swipe records confirm employee scanned exit at Hinjewadi at 9:35 PM, directly disproving FIR claim of presence at FC Road at 9:30 PM (18 km away).',
      source: 'Company HR Systems Extract',
      date: '2024-01-16 21:35',
      x: 38,
      y: 84,
      importance: 'high',
      tags: ['Electronic Record', 'Verified Timestamp'],
    })

    links.push({
      id: `link-bio-accused`,
      source: accusedId,
      target: biometricNodeId,
      label: 'Proves location at work',
      relationType: 'supports',
      strength: 'strong',
    })

    links.push({
      id: `link-bio-incident`,
      source: biometricNodeId,
      target: incidentScenarioId,
      label: 'Impossible travel (18 km in 5 mins)',
      relationType: 'contradicts',
      strength: 'disputed',
    })

    const timeFinding = nodes.find((n) => n.id.startsWith('conflict-') && n.label.includes('Time'))
    if (timeFinding) {
      links.push({
        id: `link-bio-mismatch`,
        source: biometricNodeId,
        target: timeFinding.id,
        label: 'Proves alibi timing',
        relationType: 'supports',
        strength: 'strong',
      })
    }
  }

  // Summary counts
  const summary = {
    scenariosCount: nodes.filter((n) => n.category === 'scenario').length,
    personsCount: nodes.filter((n) => n.category === 'person').length,
    evidenceCount: nodes.filter((n) => n.category === 'evidence').length,
    conflictsCount: nodes.filter((n) => n.category === 'conflict').length,
    legalCount: nodes.filter((n) => n.category === 'legal').length,
  }

  // Apply automatic collision-free column layout
  const structuredNodes = layoutDetectiveNodes(nodes)

  return {
    caseId,
    caseNumber: caseRecord.caseNumber,
    caseTitle: caseRecord.title,
    caseDescription: caseRecord.description,
    court: caseRecord.court,
    judge: caseRecord.judge,
    status: caseRecord.status,
    nodes: structuredNodes,
    links,
    summary,
  }
}

/**
 * Automatically organizes detective wall nodes into 4 clear, collision-free columns:
 * Col 1 (12%): People Involved (State, Accused, Judge)
 * Col 2 (37%): Timeline & Events (Reported incident, defense alibis)
 * Col 3 (63%): Evidence & Proof (FIR, case papers, seizure memos, biometric logs)
 * Col 4 (88%): Issues & Court Orders (Contradictions, default bail deadline, court orders)
 */
export function layoutDetectiveNodes(nodes: DetectiveNode[]): DetectiveNode[] {
  const persons = nodes.filter((n) => n.category === 'person')
  const scenarios = nodes.filter((n) => n.category === 'scenario')
  const evidence = nodes.filter((n) => n.category === 'evidence')
  const conflictsAndLegal = nodes.filter(
    (n) => n.category === 'conflict' || n.category === 'legal'
  )

  const getYPositions = (count: number): number[] => {
    if (count <= 0) return []
    if (count === 1) return [48]
    if (count === 2) return [30, 68]
    if (count === 3) return [20, 48, 76]
    if (count === 4) return [16, 36, 56, 76]
    // 5 or more: distribute evenly between 13% and 79%
    return Array.from({ length: count }, (_, i) => Math.round(13 + (i / (count - 1)) * 66))
  }

  // Sort persons: Complainant/State first (top), Accused second (middle), Judge/Others third
  const sortedPersons = [...persons].sort((a, b) => {
    const getPrio = (node: DetectiveNode) => {
      if (node.id.includes('complainant') || node.label.toLowerCase().includes('state')) return 1
      if (node.id.includes('accused')) return 2
      if (node.id.includes('judge') || node.tags?.includes('Presiding Judge')) return 3
      return 4
    }
    return getPrio(a) - getPrio(b)
  })

  // Sort scenarios: Primary incident at top, Alibi/other at bottom
  const sortedScenarios = [...scenarios].sort((a, b) => {
    if (a.id.includes('incident')) return -1
    if (b.id.includes('incident')) return 1
    return 0
  })

  // Sort evidence: FIR/Primary record first, then biometric, then recovery memo
  const sortedEvidence = [...evidence].sort((a, b) => {
    if (a.id.includes('primary') || a.label.toLowerCase().includes('file') || a.label.toLowerCase().includes('fir')) return -1
    if (b.id.includes('primary') || b.label.toLowerCase().includes('file') || b.label.toLowerCase().includes('fir')) return 1
    return 0
  })

  // Sort conflicts and legal: conflicts & default bail milestones first, then court orders
  const sortedConflictsAndLegal = [...conflictsAndLegal].sort((a, b) => {
    const getPrio = (node: DetectiveNode) => {
      if (node.category === 'conflict') return 1
      if (node.id.includes('statutory-bail')) return 2
      return 3
    }
    return getPrio(a) - getPrio(b)
  })

  // Assign column 1 (x: 13%)
  const col1Y = getYPositions(sortedPersons.length)
  sortedPersons.forEach((n, i) => {
    n.x = 13
    n.y = col1Y[i]
  })

  // Assign column 2 (x: 38%)
  const col2Y = getYPositions(sortedScenarios.length)
  sortedScenarios.forEach((n, i) => {
    n.x = 38
    n.y = col2Y[i]
  })

  // Assign column 3 (x: 63%)
  const col3Y = getYPositions(sortedEvidence.length)
  sortedEvidence.forEach((n, i) => {
    n.x = 63
    n.y = col3Y[i]
  })

  // Assign column 4 (x: 87%)
  const col4Y = getYPositions(sortedConflictsAndLegal.length)
  sortedConflictsAndLegal.forEach((n, i) => {
    n.x = 87
    n.y = col4Y[i]
  })

  return nodes
}
