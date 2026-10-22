import type { CaseDetail } from '@/lib/queries/cases'
import type { DocumentWithPages } from '@/lib/queries/documents'
import type { AIAnalysis, CaseMetadataHeader, FactMatrixItem, VerifiedCitation } from '@/lib/analysis/openai'
import { extractLegalDates, cleanOcrRegex, categorizeLegalText, generateStoryAndDossier } from '@/lib/legalSanitizer'
import type { TechnicalDossierItem } from '@/lib/legalSanitizer'

export interface EvidenceReference {
  documentId: number
  documentName: string
  pageNumber: number
  passage: string
  /** Plain-English 4-5 sentence narrative about what this page is about */
  caseStory?: string
  /** Structured list of technical legal metadata from this page */
  technicalDossier?: TechnicalDossierItem[]
}

export interface PotentialInconsistency {
  field: string
  values: string[]
  sources: EvidenceReference[]
  origin?: 'local' | 'ai'
  explanation?: string
}

export interface KeyEntity {
  category: 'charges' | 'person' | 'datetime' | 'location' | 'evidence' | 'custody' | 'general'
  field: string
  value: string
  source: EvidenceReference
  contextSnippet?: string
}

export interface CaseSynopsis {
  caseOverview: {
    title: string
    reference: string
    caseType: string
    status: string
    court: string | null
    jurisdiction: string | null
    userNotes: string | null
  }
  metadataHeader?: CaseMetadataHeader
  language?: string
  executiveSynopsis: string
  aiAnalysis?: AIAnalysis
  keyEntities?: KeyEntity[]
  factMatrix?: FactMatrixItem[]
  facts: EvidenceReference[]
  chronology: Array<EvidenceReference & { date: string; dateNote: string }>
  documentSummaries: Array<{
    documentId: number
    documentName: string
    apparentType: string
    pageCount: number
    processingStatus: string
    summary: EvidenceReference | null
  }>
  importantStatements: EvidenceReference[]
  potentialInconsistencies: PotentialInconsistency[]
  missingOrUnclear: string[]
  ordersAndProceduralHistory: EvidenceReference[]
  sourceIndex: Array<{
    documentId: number
    documentName: string
    pageNumber: number
    readable: boolean
  }>
  method: string
}

const DATE_LABEL_PATTERN = /\b(date of (?:incident|occurrence|event|award|order|filing)|(?:incident|occurrence|event|award|order|filing) date)\b/gi
const PERSON_NAME_PATTERN = /\bname of (accused|applicant|witness|complainant|petitioner|respondent)\b|\b(accused|applicant|witness|complainant|petitioner|respondent)(?:'s)? name\b/gi
const INCIDENT_LOCATION_PATTERN = /\b(place of occurrence|location of incident|incident location|location of land|disputed property)\b/gi

function apparentDocumentType(documentName: string, text: string) {
  const content = `${documentName} ${text}`.toLowerCase()
  if (/\b(arbitration|section 34|section 37|arbitral award|cala)\b/.test(content)) return 'Arbitration Record / Petition'
  if (/\b(writ petition|w\.p\.|article 226|article 32)\b/.test(content)) return 'Writ Petition'
  if (/\b(first information report|\bfir\b|police complaint)\b/.test(content)) return 'FIR / Police Complaint'
  if (/\b(witness statement|statement of witness|deposition)\b/.test(content)) return 'Witness Statement'
  if (/\b(bail application|bail order|surety|parole)\b/.test(content)) return 'Bail & Release Record'
  if (/\b(judgment|judgement|court order|award|order of the court)\b/.test(content)) return 'Court Order / Award'
  if (/\b(investigation report|charge sheet|chargesheet)\b/.test(content)) return 'Investigation Report / Chargesheet'
  if (/\b(sale deed|conveyance|agreement|valuation report)\b/.test(content)) return 'Valuation / Property Record'
  return 'General Legal Record'
}

function extractiveSummary(text: string) {
  const cleaned = cleanOcrRegex(text)
  const sentences = cleaned.match(/[^.!?]+[.!?]?/g) ?? []
  return sentences.map((sentence) => sentence.trim()).filter((s) => s.length > 15).slice(0, 2).join(' ')
}

function excerpt(text: string, index = 0, length = 900) {
  const start = Math.max(0, Math.min(index, Math.max(0, text.length - length)))
  return cleanOcrRegex(text.slice(start, start + length).trim())
}

function passageForPage(document: DocumentWithPages, pageNumber: number, text: string): EvidenceReference {
  const { caseStory, technicalDossier } = generateStoryAndDossier(text, {
    fileName: document.originalName,
    pageNumber,
  })
  return {
    documentId: document.id,
    documentName: document.originalName,
    pageNumber,
    passage: excerpt(text),
    caseStory,
    technicalDossier,
  }
}

export function buildCaseChronology(documents: DocumentWithPages[]) {
  const chronology: Array<EvidenceReference & { date: string; dateNote: string }> = []

  for (const document of documents) {
    for (const page of document.pages) {
      const text = page.extractedText?.trim() ?? ''
      if (!text || page.quality === 'unreadable') continue

      const source = passageForPage(document, page.pageNumber, text)
      for (const { date, index } of extractLegalDates(text)) {
        chronology.push({
          ...source,
          date,
          dateNote: 'Document timeline reference',
          passage: excerpt(text, Math.max(0, index - 90), 240),
        })
      }
    }
  }

  return chronology
}

export function buildCaseSynopsis(
  caseRecord: CaseDetail,
  documents: DocumentWithPages[]
): CaseSynopsis {
  const facts: EvidenceReference[] = []
  const chronology: Array<EvidenceReference & { date: string; dateNote: string }> = []
  const importantStatements: EvidenceReference[] = []
  const ordersAndProceduralHistory: EvidenceReference[] = []
  const sourceIndex: CaseSynopsis['sourceIndex'] = []
  const missingOrUnclear: string[] = []
  const labeledValues = new Map<string, Array<{ value: string; source: EvidenceReference }>>()
  const addLabeledValue = (field: string, value: string, source: EvidenceReference) => {
    const entries = labeledValues.get(field) ?? []
    entries.push({ value: value.trim(), source })
    labeledValues.set(field, entries)
  }

  // Aggregate readable text across all pages
  let allPagesText = ''

  for (const document of documents) {
    if (document.processingError) {
      missingOrUnclear.push(`${document.originalName}: ${document.processingError}`)
    }

    for (const page of document.pages) {
      const raw = page.extractedText?.trim() ?? ''
      const text = cleanOcrRegex(raw)
      sourceIndex.push({
        documentId: document.id,
        documentName: document.originalName,
        pageNumber: page.pageNumber,
        readable: page.quality !== 'unreadable' && text.length > 0,
      })

      if (!text || page.quality === 'unreadable') {
        missingOrUnclear.push(`${document.originalName}, page ${page.pageNumber}: text could not be read.`)
        continue
      }

      allPagesText += ' ' + text
      const source = passageForPage(document, page.pageNumber, text)
      facts.push(source)

      const statementMatch = /\b(?:statement|states|reported|witness|observed|recorded|according to|argued|contended|submitted|findings)\b/i.exec(text)
      if (statementMatch) {
        importantStatements.push({ ...source, passage: excerpt(text, statementMatch.index) })
      }

      if (/\b(?:court order|judgment|award|hearing|procedural|adjourned|granted|dismissed|allowed)\b/i.test(text)) {
        ordersAndProceduralHistory.push(source)
      }

      const extractedDates = extractLegalDates(text)
      for (const { date, index } of extractedDates) {
        chronology.push({
          ...source,
          date,
          dateNote: 'Found directly in document text',
          passage: excerpt(text, Math.max(0, index - 90), 240),
        })
      }

      DATE_LABEL_PATTERN.lastIndex = 0
      let labelMatch: RegExpExecArray | null
      while ((labelMatch = DATE_LABEL_PATTERN.exec(text)) !== null) {
        const index = labelMatch.index
        const nearby = text.slice(index, index + 140)
        const date = extractLegalDates(nearby)[0]?.date
        if (!date) continue
        const field = labelMatch[0].toLowerCase().replace(/\s+/g, ' ')
        addLabeledValue(field, date, { ...source, passage: excerpt(text, index, 240) })
      }
    }
  }

  // ── DYNAMIC METADATA EXTRACTION ────────────────────────────────
  let detectedCourt: string | null = caseRecord.court || null
  let detectedCaseNumber: string | null = caseRecord.caseNumber || null
  let detectedParties: string | null = null
  let detectedPrimaryActs: string | null = null
  let detectedFilingDate: string | null = null
  let detectedOrderDate: string | null = null

  // Court Name Regexes (Arbitration / Civil / Criminal / High Court / District Judge)
  const courtMatches = [
    allPagesText.match(/\b(?:In\s+the\s+Court\s+of\s+the|In\s+the\s+Court\s+of|Court\s+of)\s+([A-Za-z\s,.'\-]+(?:Court|Judge|patna|purnea|delhi|mumbai|kolkata|tribunal)[^\n,;]{0,50})/i),
    allPagesText.match(/\b(District\s+Judge\s+Court[\s,]+[A-Za-z\s]+|District\s+&\s+Sessions\s+Judge[\s,]+[A-Za-z\s]+|High\s+Court\s+of\s+Judicature\s+at\s+[A-Za-z]+|High\s+Court\s+of\s+[A-Za-z]+|Arbitral\s+Tribunal[\s,A-Za-z]*|Supreme\s+Court\s+of\s+India)/i),
  ]
  for (const m of courtMatches) {
    if (m && m[1]?.trim() && !detectedCourt) {
      detectedCourt = m[1].trim()
      break
    }
  }

  // Case Number Regexes (Multi-domain: Criminal, Civil, Writs, Commercial, Arbitration)
  const caseNumberMatches = [
    allPagesText.match(/\b((?:CRIMINAL|CIVIL|MISC\.?|COMMERCIAL|TITLE|EXECUTION|W\.?P\.?|SPECIAL\s+LEAVE)\s*(?:MISCELLANEOUS|APPEAL|PETITION|SUIT|APPLICATION|CASE)?\s*(?:NO\.?|NUMBER)?\s*[:\-]?\s*[0-9A-Za-z/_\-]+(?:\s*OF\s*\d{4})?)/i),
    allPagesText.match(/\b(Arb\.?\s*R\.?D\.?\s*Case\s*No\.?\s*[0-9A-Za-z/_-]+)/i),
    allPagesText.match(/\b(Arb\.?\s*(?:Case|Petition|Appln\.?)\s*No\.?\s*[0-9A-Za-z/_-]+)/i),
    allPagesText.match(/\b(P\.?S\.?\s*Case\s*No\.?\s*[-:]?\s*[0-9A-Za-z/_\-]+(?:\s*Year[-:]?\s*\d{4})?)/i),
    allPagesText.match(/\b(FIR\s*(?:No\.?|Number)\s*[:\-]?\s*[0-9A-Z/_-]+)/i),
  ]
  for (const m of caseNumberMatches) {
    if (m && m[1]?.trim()) {
      detectedCaseNumber = m[1].trim()
      break
    }
  }

  // Parties Regexes
  const partyMatch = allPagesText.match(/\b([A-Z][A-Za-z\s.,&'-]{3,50})\s+(?:Versus|Vs\.?|V\/s)\s+([A-Z][A-Za-z\s.,&'-]{3,50})\b/)
  if (partyMatch) {
    detectedParties = `${partyMatch[1].trim()} vs. ${partyMatch[2].trim()}`
  }

  // Primary Acts Regexes (Multi-domain: Penal, Criminal Procedure, Arbitration, NH Act, Writs, Commercial)
  const actMatches = [
    allPagesText.match(/\b((?:Section|Sec\.?|U\/s)\s*\d+[A-Za-z]*(?:\s*,\s*\d+[A-Za-z]*)*(?:\s*\/\s*\d+)?(?:\s+of\s+(?:the\s+)?(?:IPC|Indian\s+Penal\s+Code|BNS|Bharatiya\s+Nyaya\s+Sanhita))\b)/i),
    allPagesText.match(/\b((?:Section|Sec\.?|U\/s)\s*\d+[A-Za-z]*(?:\s*\([0-9A-Za-z]+\))*(?:\s+of\s+(?:the\s+)?(?:Cr\.?P\.?C|Code\s+of\s+Criminal\s+Procedure|BNSS))\b)/i),
    allPagesText.match(/\b((?:Section|Sec\.?)\s*34\b[A-Za-z]*(?:\s*\([0-9A-Za-z]+\))*(?:\s+of\s+the\s+Arbitration\s+and\s+Conciliation\s+Act(?:,\s*\d{4})?)?)/i),
    allPagesText.match(/\b((?:Section|Sec\.?)\s*3G[A-Za-z]*(?:\s+of\s+the\s+National\s+Highways\s+Act(?:,\s*\d{4})?)?)/i),
    allPagesText.match(/\b((?:Section|Sec\.?)\s*138[A-Za-z]*(?:\s+of\s+the\s+Negotiable\s+Instruments\s+Act(?:,\s*\d{4})?)?)/i),
    allPagesText.match(/\b((?:Article|Art\.?)\s*(?:226|32|136)\s+of\s+the\s+Constitution\s+of\s+India)/i),
    allPagesText.match(/\b(Arbitration\s+and\s+Conciliation\s+Act(?:,\s*1996)?)/i),
    allPagesText.match(/\b(National\s+Highways\s+Act(?:,\s*\d{4})?)/i),
    allPagesText.match(/\b(Indian\s+Penal\s+Code(?:,\s*\d{4})?)/i),
  ]
  for (const m of actMatches) {
    if (m && m[1]?.trim()) {
      detectedPrimaryActs = m[1].trim()
      break
    }
  }

  // Dates
  const orderDateMatch = allPagesText.match(/(?:Award\s+dated|Award\s+passed\s+on|Order\s+dated|Impugned\s+order\s+dated)\s*[:\-]?\s*([A-Za-z0-9\s,./-]{6,30})/i)
  if (orderDateMatch) {
    const dates = extractLegalDates(orderDateMatch[1])
    if (dates.length > 0) detectedOrderDate = dates[0].date
  }

  const filingDateMatch = allPagesText.match(/(?:Filed\s+on|Filing\s+date|Date\s+of\s+filing|Application\s+dated)\s*[:\-]?\s*([A-Za-z0-9\s,./-]{6,30})/i)
  if (filingDateMatch) {
    const dates = extractLegalDates(filingDateMatch[1])
    if (dates.length > 0) detectedFilingDate = dates[0].date
  }

  const metadataHeader: CaseMetadataHeader = {
    courtName: detectedCourt,
    caseNumber: detectedCaseNumber,
    parties: detectedParties,
    primaryActs: detectedPrimaryActs,
    keyDates: {
      filingDate: detectedFilingDate,
      orderDate: detectedOrderDate,
      noticeDate: null,
      limitationDeadline: null,
    },
  }

  // ── KEY ENTITIES & FACT MATRIX ─────────────────────────────────
  const keyEntities: KeyEntity[] = []
  const factMatrix: FactMatrixItem[] = []

  const addMatrixItem = (
    category: FactMatrixItem['category'],
    parameter: string,
    value: string,
    source: EvidenceReference
  ) => {
    if (!factMatrix.some((m) => m.parameter === parameter && m.value === value)) {
      factMatrix.push({ category, parameter, value, source })
    }
  }

  for (const document of documents) {
    for (const page of document.pages) {
      const text = page.extractedText?.trim() ?? ''
      if (!text || page.quality === 'unreadable') continue
      const source = passageForPage(document, page.pageNumber, text)

      // 1. Jurisdiction Parameters
      if (/six[\s-]+men[\s-]+committee/i.test(text)) {
        addMatrixItem('Jurisdiction', 'Arbitral Committee / Authority', 'Six-Men Committee formed without statutory jurisdiction', source)
      }
      if (/cala/i.test(text)) {
        addMatrixItem('Jurisdiction', 'Competent Authority (CALA)', 'Action taken under CALA / National Highways Act', source)
      }
      if (/Section\s*34/i.test(text)) {
        addMatrixItem('Jurisdiction', 'Governing Provision', 'Section 34, Arbitration & Conciliation Act 1996', source)
      }

      // 2. Compensation & Valuation
      const valMatch = text.match(/(?:valuation|compensation|market\s*value|sale\s*deed\s*no\.?)\s*[:\-]?\s*([A-Za-z0-9\s,./₹Rs-]+)/i)
      if (valMatch) {
        addMatrixItem('Compensation / Damages', 'Compensation / Valuation Basis', valMatch[0].slice(0, 100).trim(), source)
      }
      if (/commercial/i.test(text) && /land|plot|nature/i.test(text)) {
        addMatrixItem('Compensation / Damages', 'Nature of Land', 'Commercial classification claimed for enhanced compensation', source)
      }

      // 3. Procedural Compliance
      if (/exhibited|opportunity\s*of\s*hearing|natural\s*justice/i.test(text)) {
        addMatrixItem('Procedural Compliance', 'Due Process / Exhibits', 'Objections regarding non-exhibition or procedural hearing', source)
      }

      // 4. Limitation
      if (/limitation|service\s*of\s*award|34\s*\(\s*3\s*\)/i.test(text)) {
        addMatrixItem('Limitation', 'Statutory Limitation', 'Limitation period under Section 34(3) Arbitration Act', source)
      }

      // 5. Criminal / Police details fallback (FIR, Charges, Accused)
      const firMatch = text.match(/\bFIR\s*(?:No\.?|Number)\s*[:\-]?\s*([0-9A-Z/_-]+)/i)
      if (firMatch && !keyEntities.some((k) => k.field === 'FIR / Crime Number')) {
        const item = {
          category: 'charges' as const,
          field: 'FIR / Crime Number',
          value: firMatch[1].trim(),
          source: { ...source, passage: excerpt(text, firMatch.index ?? 0, 160) },
          contextSnippet: 'Official police crime registration number',
        }
        keyEntities.push(item)
        addMatrixItem('Merits', 'FIR / Crime Number', firMatch[1].trim(), item.source)
      }

      const actsSecMatch = text.match(/\bActs?\s*&\s*Sections?\s*[:\-]?\s*([^\n;]{3,130})/i)
      if (actsSecMatch && !keyEntities.some((k) => k.field === 'Applicable Penal Sections')) {
        const item = {
          category: 'charges' as const,
          field: 'Applicable Penal Sections',
          value: actsSecMatch[1].trim(),
          source: { ...source, passage: excerpt(text, actsSecMatch.index ?? 0, 180) },
          contextSnippet: 'Substantive penal charges and corresponding sections',
        }
        keyEntities.push(item)
        addMatrixItem('Merits', 'Applicable Penal Sections', actsSecMatch[1].trim(), item.source)
      }

      const accMatch = text.match(/(?:Name\s*of\s*Accused|Accused(?:\s*Name)?)\s*[:\-]?\s*([^\n;|]{2,80})/i)
      if (accMatch && !keyEntities.some((k) => k.field === 'Accused Person')) {
        const item = {
          category: 'person' as const,
          field: 'Accused Person',
          value: accMatch[1].trim(),
          source: { ...source, passage: excerpt(text, accMatch.index ?? 0, 160) },
          contextSnippet: 'Named individual in court record',
        }
        keyEntities.push(item)
        addMatrixItem('Merits', 'Accused Person', accMatch[1].trim(), item.source)
      }
    }
  }

  // Populate KeyEntities from FactMatrix so both representations are rich
  for (const item of factMatrix) {
    const fieldName = item.parameter
    if (!keyEntities.some((k) => k.field === fieldName)) {
      const cat = item.category === 'Jurisdiction' ? 'charges'
        : item.category === 'Limitation' ? 'datetime'
        : item.category === 'Compensation / Damages' ? 'evidence'
        : item.category === 'Procedural Compliance' ? 'evidence'
        : 'general'
      keyEntities.push({
        category: cat,
        field: fieldName,
        value: item.value,
        source: {
          documentId: item.source.documentId,
          documentName: item.source.documentName || 'Document.pdf',
          pageNumber: item.source.pageNumber,
          passage: item.source.passage || item.source.quote || item.value,
        },
        contextSnippet: `Domain: ${item.category}`,
      })
    }
  }

  const potentialInconsistencies: PotentialInconsistency[] = []
  labeledValues.forEach((entries, field) => {
    const values = Array.from(new Set(entries.map((entry) => entry.value.toLowerCase())))
    const distinctDocuments = new Set(entries.map((entry) => entry.source.documentId))
    if (values.length > 1 && distinctDocuments.size > 1) {
      potentialInconsistencies.push({
        field,
        values: Array.from(new Set(entries.map((entry) => entry.value))),
        sources: entries.map((entry) => entry.source),
        origin: 'local',
      })
    }
  })

  chronology.sort((first, second) => {
    const normalize = (date: string) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return Date.parse(`${date}T00:00:00Z`)
      if (/^[A-Za-z]+\s+\d{1,2},?\s+\d{4}$/.test(date)) return Date.parse(date)
      return Number.NaN
    }
    const firstTime = normalize(first.date)
    const secondTime = normalize(second.date)
    if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) return 0
    return firstTime - secondTime
  })

  // ── 3-PART EXECUTIVE SYNTHESIS ─────────────────────────────────
  const courtStr = detectedCourt || caseRecord.court || 'the designated Court'
  const caseNumStr = detectedCaseNumber || caseRecord.caseNumber || 'the registered proceeding'
  const actsStr = detectedPrimaryActs || 'the applicable statutory provisions'
  const disputeSummary = detectedParties
    ? `This matter involves ${detectedParties} pending before ${courtStr} (${caseNumStr}), governed under ${actsStr}.`
    : `This case is pending before ${courtStr} under ${caseNumStr}, concerning proceedings under ${actsStr}.`

  const executiveSynopsis = documents.length === 0
    ? 'No documents have been uploaded for this case yet.'
    : [
        '## 1. Core Dispute & Relief Sought',
        disputeSummary + ' The petitioner challenges the determination and seeks judicial intervention/setting aside of the impugned order or award on foundational legal grounds.',
        '',
        '## 2. Factual Background & Chronology',
        `The record contains ${documents.length} reviewed document${documents.length === 1 ? '' : 's'} across ${sourceIndex.filter((s) => s.readable).length} readable page${sourceIndex.filter((s) => s.readable).length === 1 ? '' : 's'}. Key milestones include official notices, submissions before the competent authority/arbitrator, and the passing of the award or order under review.`,
        '',
        '## 3. Primary Legal Grounds for Challenge/Defense',
        '- Jurisdiction & Authority: The petition challenges jurisdiction and competence regarding statutory mandates.\n- Valuation / Damages: Dispute regarding evidentiary basis for assessment and commercial classification.\n- Procedural Due Process: Submissions regarding statutory notice, exhibit handling, and natural justice.\n- Limitation: Compliance with statutory limitation deadlines under governing Acts.',
      ].join('\n')

  // ── Deduplicate facts[] by caseStory prefix ────────────────────────────────
  // Different pages can yield the same high-scoring sentences (e.g. repeated
  // header text across pages).  Drop any fact whose first 60 chars of caseStory
  // already appeared in a prior fact so the Key Facts cards show unique content.
  const seenStoryPrefixes = new Set<string>()
  const dedupedFacts = facts.filter((fact) => {
    const story = fact.caseStory?.trim() ?? fact.passage?.trim() ?? ''
    if (!story) return true  // keep empty ones as-is
    const prefix = story.slice(0, 60).toLowerCase()
    if (seenStoryPrefixes.has(prefix)) return false
    seenStoryPrefixes.add(prefix)
    return true
  })

  return {
    caseOverview: {
      title: caseRecord.title,
      reference: caseRecord.caseNumber,
      caseType: caseRecord.caseType,
      status: caseRecord.status,
      court: detectedCourt,
      jurisdiction: caseRecord.jurisdiction,
      userNotes: caseRecord.description,
    },
    metadataHeader,
    language: 'English',
    executiveSynopsis,
    keyEntities,
    factMatrix,
    facts: dedupedFacts,
    chronology,
    documentSummaries: documents.map((document) => {
      const firstReadable = document.pages.find(
        (page) => page.quality !== 'unreadable' && page.extractedText?.trim()
      )
      return {
        documentId: document.id,
        documentName: document.originalName,
        apparentType: apparentDocumentType(
          document.originalName,
          document.pages.map((page) => page.extractedText ?? '').join(' ')
        ),
        pageCount: document.pageCount ?? document.pages.length,
        processingStatus: document.processingStatus,
        summary: firstReadable
          ? {
              ...passageForPage(document, firstReadable.pageNumber, firstReadable.extractedText ?? ''),
              passage: extractiveSummary(firstReadable.extractedText ?? ''),
            }
          : null,
      }
    }),
    importantStatements,
    potentialInconsistencies,
    missingOrUnclear: Array.from(new Set(missingOrUnclear)),
    ordersAndProceduralHistory,
    sourceIndex,
    method: 'Dynamic legal intelligence parser. Verbatim excerpts matched with source citations.',
  }
}
