import type { CaseDetail } from '@/lib/queries/cases'
import type { DocumentWithPages } from '@/lib/queries/documents'
import type { AIAnalysis } from '@/lib/analysis/openai'
import { extractLegalDates } from '@/lib/legalSanitizer'

export interface EvidenceReference {
  documentId: number
  documentName: string
  pageNumber: number
  passage: string
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
  language?: string
  executiveSynopsis: string
  aiAnalysis?: AIAnalysis
  keyEntities?: KeyEntity[]
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

const DATE_LABEL_PATTERN = /\b(date of (?:incident|occurrence|event)|(?:incident|occurrence|event) date)\b/gi
const PERSON_NAME_PATTERN = /\bname of (accused|applicant|witness|complainant)\b|\b(accused|applicant|witness|complainant)(?:'s)? name\b/gi
const INCIDENT_LOCATION_PATTERN = /\b(place of occurrence|location of incident|incident location)\b/gi

function apparentDocumentType(documentName: string, text: string) {
  const content = `${documentName} ${text}`.toLowerCase()
  if (/\b(first information report|\bfir\b|police complaint)\b/.test(content)) return 'FIR / Police Complaint'
  if (/\b(witness statement|statement of witness|deposition)\b/.test(content)) return 'Witness Statement'
  if (/\b(bail application|bail order|surety|parole)\b/.test(content)) return 'Bail & Release Record'
  if (/\b(judgment|judgement|court order|order of the court)\b/.test(content)) return 'Court Order / Judgment'
  if (/\b(investigation report|investigation|charge sheet|chargesheet)\b/.test(content)) return 'Investigation Report / Chargesheet'
  return 'General Case Document'
}

function extractiveSummary(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]?/g) ?? []
  return sentences.map((sentence) => sentence.trim()).filter(Boolean).slice(0, 2).join(' ')
}

function excerpt(text: string, index = 0, length = 500) {
  const start = Math.max(0, Math.min(index, Math.max(0, text.length - length)))
  return text.slice(start, start + length).trim()
}

function passageForPage(document: DocumentWithPages, pageNumber: number, text: string): EvidenceReference {
  return {
    documentId: document.id,
    documentName: document.originalName,
    pageNumber,
    passage: excerpt(text),
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
          dateNote: 'Found directly in document text',
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

  for (const document of documents) {
    if (document.processingError) {
      missingOrUnclear.push(`${document.originalName}: ${document.processingError}`)
    }

    for (const page of document.pages) {
      const text = page.extractedText?.trim() ?? ''
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

      const source = passageForPage(document, page.pageNumber, text)
      facts.push(source)

      const statementMatch = /\b(?:statement|states|reported|witness|observed|recorded|according to|evidence)\b/i.exec(text)
      if (statementMatch) {
        importantStatements.push({ ...source, passage: excerpt(text, statementMatch.index) })
      }

      if (/\b(?:court order|judgment|hearing|procedural|adjourned|granted|dismissed)\b/i.test(text)) {
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

      PERSON_NAME_PATTERN.lastIndex = 0
      let personMatch: RegExpExecArray | null
      while ((personMatch = PERSON_NAME_PATTERN.exec(text)) !== null) {
        const role = (personMatch[1] ?? personMatch[2]).toLowerCase()
        const index = personMatch.index
        const value = text
          .slice(index + personMatch[0].length, index + personMatch[0].length + 100)
          .match(/^\s*[:\-]\s*([^.;,\n]{2,80})/)?.[1]
        if (value) {
          addLabeledValue(`name of ${role}`, value, { ...source, passage: excerpt(text, index, 240) })
        }
      }

      INCIDENT_LOCATION_PATTERN.lastIndex = 0
      let locationMatch: RegExpExecArray | null
      while ((locationMatch = INCIDENT_LOCATION_PATTERN.exec(text)) !== null) {
        const index = locationMatch.index
        const value = text
          .slice(index + locationMatch[0].length, index + locationMatch[0].length + 120)
          .match(/^\s*[:\-]\s*([^.;\n]{2,100})/)?.[1]
        if (value) {
          addLabeledValue('incident location', value, { ...source, passage: excerpt(text, index, 240) })
        }
      }
    }
  }

  const keyEntities: KeyEntity[] = []
  for (const document of documents) {
    for (const page of document.pages) {
      const text = page.extractedText?.trim() ?? ''
      if (!text || page.quality === 'unreadable') continue
      const source = passageForPage(document, page.pageNumber, text)

      // FIR No
      const firMatch = text.match(/\bFIR\s*(?:No\.?|Number)\s*[:\-]?\s*([0-9A-Z/_-]+)/i)
      if (firMatch && !keyEntities.some((k) => k.field === 'FIR / Crime Number' && k.value === firMatch[1].trim())) {
        keyEntities.push({
          category: 'charges',
          field: 'FIR / Crime Number',
          value: firMatch[1].trim(),
          source: { ...source, passage: excerpt(text, firMatch.index ?? 0, 160) },
          contextSnippet: 'Official police crime registration number',
        })
      }

      // Police Station
      const psMatch = text.match(/\bPolice\s*Station\s*[:\-]?\s*([A-Za-z\s]+?)(?:\||\n|;|\.|\s{2,})/i)
      if (psMatch && !keyEntities.some((k) => k.field === 'Police Station')) {
        keyEntities.push({
          category: 'location',
          field: 'Police Station',
          value: psMatch[1].trim(),
          source: { ...source, passage: excerpt(text, psMatch.index ?? 0, 160) },
          contextSnippet: 'Jurisdictional police station handling the investigation',
        })
      }

      // District
      const distMatch = text.match(/\bDistrict\s*[:\-]?\s*([A-Za-z\s]+?)(?:\||\n|;|\.|\s{2,})/i)
      if (distMatch && !keyEntities.some((k) => k.field === 'District / Jurisdiction')) {
        keyEntities.push({
          category: 'location',
          field: 'District / Jurisdiction',
          value: distMatch[1].trim(),
          source: { ...source, passage: excerpt(text, distMatch.index ?? 0, 160) },
          contextSnippet: 'Judicial district having territorial jurisdiction',
        })
      }

      // Acts & Sections (Substantive Charges)
      const actsSecMatch = text.match(/\bActs?\s*&\s*Sections?\s*[:\-]?\s*([^\n;]{3,130})/i)
      if (actsSecMatch && !keyEntities.some((k) => k.field === 'Applicable Penal Sections')) {
        keyEntities.push({
          category: 'charges',
          field: 'Applicable Penal Sections',
          value: actsSecMatch[1].trim(),
          source: { ...source, passage: excerpt(text, actsSecMatch.index ?? 0, 180) },
          contextSnippet: 'Substantive penal charges and corresponding criminal sections',
        })
      } else if (!keyEntities.some((k) => k.field === 'Applicable Penal Sections')) {
        const secMatch = text.match(/\b(?:Sections?|U\/s)\s*[:\-]?\s*([^\n;]{3,110})/i)
        if (secMatch) {
          keyEntities.push({
            category: 'charges',
            field: 'Applicable Penal Sections',
            value: secMatch[1].trim(),
            source: { ...source, passage: excerpt(text, secMatch.index ?? 0, 180) },
            contextSnippet: 'Substantive penal charges and corresponding criminal sections',
          })
        }
      }

      // Occurrence Date & Time
      const occMatch = text.match(/(?:Date\s*and\s*Time\s*of\s*Occurrence|Incident\s*Date\s*and\s*Time|Time\s*of\s*Incident)\s*[:\-]?\s*([^\n;]{4,80})/i)
      if (occMatch && !keyEntities.some((k) => k.field === 'Incident Date & Time')) {
        keyEntities.push({
          category: 'datetime',
          field: 'Incident Date & Time',
          value: occMatch[1].trim(),
          source: { ...source, passage: excerpt(text, occMatch.index ?? 0, 160) },
          contextSnippet: 'Alleged time and date when offense took place',
        })
      }

      // Place of Occurrence
      const placeMatch = text.match(/(?:Place\s*of\s*Occurrence|Incident\s*Location|Location\s*of\s*Incident)\s*[:\-]?\s*([^\n;]{3,100})/i)
      if (placeMatch && !keyEntities.some((k) => k.field === 'Place of Incident')) {
        keyEntities.push({
          category: 'location',
          field: 'Place of Incident',
          value: placeMatch[1].trim(),
          source: { ...source, passage: excerpt(text, placeMatch.index ?? 0, 160) },
          contextSnippet: 'Geographic location and distance from police station',
        })
      }

      // Accused Person
      const accMatch = text.match(/(?:Name\s*of\s*Accused|Accused(?:\s*Name)?)\s*[:\-]?\s*([^\n;|]{2,80})/i)
      if (accMatch) {
        const accValue = accMatch[1].trim()
        if (!keyEntities.some((k) => k.field === 'Accused Person' && (k.value.includes(accValue) || accValue.includes(k.value)))) {
          keyEntities.push({
            category: 'person',
            field: 'Accused Person',
            value: accValue,
            source: { ...source, passage: excerpt(text, accMatch.index ?? 0, 160) },
            contextSnippet: 'Named individual facing prosecution',
          })
        }
      }

      // Victim / Deceased
      const vicMatch = text.match(/(?:Victim|Deceased)\s*[:\-]?\s*([A-Za-z\s]{2,40})(?:\s+collapsed|\s+died|\s+injured|\s+was|\.|\n|$)/i) ||
                       text.match(/\bvictim\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
      if (vicMatch) {
        const val = (vicMatch[1] || '').trim()
        if (val && !keyEntities.some((k) => k.field === 'Victim / Deceased')) {
          keyEntities.push({
            category: 'person',
            field: 'Victim / Deceased',
            value: val,
            source: { ...source, passage: excerpt(text, vicMatch.index ?? 0, 160) },
            contextSnippet: 'Aggrieved or deceased party cited in police record',
          })
        }
      }

      // Complainant / Informant
      const compMatch = text.match(/\bComplainant(?:\s*\/\s*Informant)?\s*[:\-]?\s*([^\n;]{2,60})/i)
      if (compMatch && !keyEntities.some((k) => k.field === 'Complainant / Informant')) {
        keyEntities.push({
          category: 'person',
          field: 'Complainant / Informant',
          value: compMatch[1].trim(),
          source: { ...source, passage: excerpt(text, compMatch.index ?? 0, 160) },
          contextSnippet: 'Officer or citizen who lodged the initial complaint',
        })
      }

      // Date of Arrest
      const arrestMatch = text.match(/(?:Date\s*of\s*Arrest|Arrested\s*on)\s*[:\-]?\s*([^\n;|]{4,60})/i)
      if (arrestMatch && !keyEntities.some((k) => k.field === 'Date & Time of Arrest')) {
        keyEntities.push({
          category: 'custody',
          field: 'Date & Time of Arrest',
          value: arrestMatch[1].trim(),
          source: { ...source, passage: excerpt(text, arrestMatch.index ?? 0, 160) },
          contextSnippet: 'Official police detention timestamp',
        })
      }

      // First Magistrate Production
      const prodMatch = text.match(/(?:First\s*Production\s*before\s*Magistrate|Produced\s*before\s*Magistrate)\s*[:\-]?\s*([^\n;|]{4,60})/i)
      if (prodMatch && !keyEntities.some((k) => k.field === 'Magistrate Production')) {
        keyEntities.push({
          category: 'custody',
          field: 'Magistrate Production',
          value: prodMatch[1].trim(),
          source: { ...source, passage: excerpt(text, prodMatch.index ?? 0, 160) },
          contextSnippet: 'Mandatory 24-hour judicial production',
        })
      }

      // Remand Period
      const remandMatch = text.match(/(?:Remand\s*Period|Police\s*Custody|Judicial\s*Custody)\s*[:\-]?\s*([^\n;|]{3,60})/i)
      if (remandMatch && !keyEntities.some((k) => k.field === 'Remand / Custody Orders')) {
        keyEntities.push({
          category: 'custody',
          field: 'Remand / Custody Orders',
          value: remandMatch[1].trim(),
          source: { ...source, passage: excerpt(text, remandMatch.index ?? 0, 160) },
          contextSnippet: 'Duration of police custody authorized by court',
        })
      }

      // Seized Properties
      const propMatch = text.match(/(?:Seized\s*Properties?|Properties\s*Seized)\s*:\s*([\s\S]*?)(?=\n\n|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s*:|$)/i)
      if (propMatch) {
        const items = propMatch[1].split('\n').map((s) => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)
        items.forEach((item, idx) => {
          const fieldName = `Seized Property #${idx + 1}`
          if (!keyEntities.some((k) => k.field === fieldName)) {
            keyEntities.push({
              category: 'evidence',
              field: fieldName,
              value: item,
              source: { ...source, passage: excerpt(text, propMatch.index ?? 0, 160) },
              contextSnippet: 'Physical/digital material seized during investigation',
            })
          }
        })
      }

      // Defence Alibi Notice
      const alibiMatch = text.match(/(?:Defence\s*Submission|Notice\s*of\s*Alibi|Alibi\s*Claim)\s*:\s*([\s\S]*?)(?=\n\n|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s*:|$)/i)
      if (alibiMatch && !keyEntities.some((k) => k.field === 'Defence Alibi Submission')) {
        keyEntities.push({
          category: 'evidence',
          field: 'Defence Alibi Submission',
          value: alibiMatch[1].slice(0, 160).trim() + '…',
          source: { ...source, passage: excerpt(text, alibiMatch.index ?? 0, 220) },
          contextSnippet: 'Turnstile logs and employer presence claim',
        })
      }

      // Tower Location
      const ioMatch = text.match(/(?:Tower\s*location[^\n]{10,120})/i)
      if (ioMatch && !keyEntities.some((k) => k.field === 'Tower CDR Triangulation')) {
        keyEntities.push({
          category: 'evidence',
          field: 'Tower CDR Triangulation',
          value: ioMatch[0].trim(),
          source: { ...source, passage: excerpt(text, ioMatch.index ?? 0, 160) },
          contextSnippet: 'Cellular network tower ping during incident window',
        })
      }
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

  const readablePageCount = sourceIndex.filter((source) => source.readable).length
  const executiveSynopsis = documents.length === 0
    ? 'No documents have been uploaded for this case yet.'
    : `This case has ${documents.length} document${documents.length === 1 ? '' : 's'} across ${readablePageCount} readable page${readablePageCount === 1 ? '' : 's'}. We found ${chronology.length} key date${chronology.length === 1 ? '' : 's'} and identified ${potentialInconsistencies.length} potential difference${potentialInconsistencies.length === 1 ? '' : 's'} between files for your review. All statements reflect the exact text in the uploaded files.`

  return {
    caseOverview: {
      title: caseRecord.title,
      reference: caseRecord.caseNumber,
      caseType: caseRecord.caseType,
      status: caseRecord.status,
      court: caseRecord.court,
      jurisdiction: caseRecord.jurisdiction,
      userNotes: caseRecord.description,
    },
    language: 'English',
    executiveSynopsis,
    keyEntities,
    facts,
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
    method: 'Extracted directly from uploaded case records with automated cross-document comparison. All text and flagged differences should be reviewed against original files.',
  }
}