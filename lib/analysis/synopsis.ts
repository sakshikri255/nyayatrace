import type { CaseDetail } from '@/lib/queries/cases'
import type { DocumentWithPages } from '@/lib/queries/documents'
import type { AIAnalysis } from '@/lib/analysis/openai'

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

const DATE_PATTERN = /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,)?\s+\d{4})\b/gi
const DATE_LABEL_PATTERN = /\b(date of (?:incident|occurrence|event)|(?:incident|occurrence|event) date)\b/gi
const PERSON_NAME_PATTERN = /\bname of (accused|applicant|witness|complainant)\b|\b(accused|applicant|witness|complainant)(?:'s)? name\b/gi
const INCIDENT_LOCATION_PATTERN = /\b(place of occurrence|location of incident|incident location)\b/gi

function apparentDocumentType(documentName: string, text: string) {
  const content = `${documentName} ${text}`.toLowerCase()
  if (/\b(first information report|\bfir\b|police complaint)\b/.test(content)) return 'FIR / police complaint (apparent)'
  if (/\b(witness statement|statement of witness|deposition)\b/.test(content)) return 'Witness statement (apparent)'
  if (/\b(bail application|bail order|surety|parole)\b/.test(content)) return 'Bail / parole record (apparent)'
  if (/\b(judgment|judgement|court order|order of the court)\b/.test(content)) return 'Court order / judgment (apparent)'
  if (/\b(investigation report|investigation|charge sheet|chargesheet)\b/.test(content)) return 'Investigation record (apparent)'
  return 'Document type could not be determined'
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

      DATE_PATTERN.lastIndex = 0
      let dateMatch: RegExpExecArray | null
      while ((dateMatch = DATE_PATTERN.exec(text)) !== null) {
        const date = dateMatch[0]
        const index = dateMatch.index
        chronology.push({
          ...source,
          date,
          dateNote: 'Date as written; format and locale not normalized.',
          passage: excerpt(text, Math.max(0, index - 90), 240),
        })
      }

      DATE_LABEL_PATTERN.lastIndex = 0
      let labelMatch: RegExpExecArray | null
      while ((labelMatch = DATE_LABEL_PATTERN.exec(text)) !== null) {
        const index = labelMatch.index
        const nearby = text.slice(index, index + 140)
        const date = nearby.match(DATE_PATTERN)?.[0]
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
    ? 'Not found in the uploaded documents.'
    : `The uploaded record set contains ${documents.length} document${documents.length === 1 ? '' : 's'} and ${readablePageCount} page${readablePageCount === 1 ? '' : 's'} with readable extracted text. ${chronology.length} date mention${chronology.length === 1 ? ' was' : 's were'} located and ${potentialInconsistencies.length} explicitly labeled cross-document difference${potentialInconsistencies.length === 1 ? ' was' : 's were'} flagged for human review. Statements in the records are reported content, not independently established findings.`

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
    method: 'Local text extraction, extractive document previews, and conservative comparisons of explicitly labeled incident dates, party names, and incident locations across different documents. No AI-generated legal conclusions are produced; extracted text and automated flags require human verification.',
  }
}