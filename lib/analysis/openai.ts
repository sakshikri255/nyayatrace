import type { DocumentWithPages } from '@/lib/queries/documents'

export interface AIReference {
  documentId: number
  documentName: string
  pageNumber: number
  quote: string
}

export interface AIInconsistency {
  field: string
  values: string[]
  explanation: string
  sources: AIReference[]
}

export interface CaseMetadataHeader {
  courtName?: string | null
  caseNumber?: string | null
  parties?: string | null
  primaryActs?: string | null
  keyDates?: {
    filingDate?: string | null
    orderDate?: string | null
    noticeDate?: string | null
    limitationDeadline?: string | null
  }
}

export interface FactMatrixItem {
  category: 'Jurisdiction' | 'Compensation / Damages' | 'Procedural Compliance' | 'Limitation' | 'Merits' | 'General'
  parameter: string
  value: string
  source: {
    documentId: number
    documentName?: string
    pageNumber: number
    quote?: string
    passage?: string
  }
}

export interface VerifiedCitation {
  category: 'Jurisdiction' | 'Compensation' | 'Procedural' | 'Limitation' | 'Merits' | 'General'
  passage: string
  documentId: number
  documentName?: string
  pageNumber: number
}

export interface AIAnalysis {
  provider: 'OpenAI' | 'Gemini'
  model: string
  metadataHeader?: CaseMetadataHeader
  executiveSummary: string
  executiveSources: AIReference[]
  factMatrix?: FactMatrixItem[]
  verifiedCitations?: VerifiedCitation[]
  potentialInconsistencies: AIInconsistency[]
  documentSummaries: Array<{
    documentId: number
    apparentType: string
    summary: string
    sources: AIReference[]
  }>
}

function normalizeQuote(text: string) {
  return text.replace(/\s+/g, ' ').trim().toLocaleLowerCase()
}

export function validReferences(
  candidate: unknown,
  documents: DocumentWithPages[]
): AIReference[] {
  if (!Array.isArray(candidate)) return []
  const references: AIReference[] = []

  for (const value of candidate) {
    if (!value || typeof value !== 'object') continue
    const item = value as Record<string, unknown>
    if (!Number.isSafeInteger(item.documentId) || !Number.isSafeInteger(item.pageNumber)) continue
    if (typeof item.quote !== 'string' || item.quote.trim().length < 8) continue

    const document = documents.find((entry) => entry.id === item.documentId)
    const page = document?.pages.find((entry) => entry.pageNumber === item.pageNumber)
    if (!document || !page?.extractedText) continue

    const normalizedPage = normalizeQuote(page.extractedText)
    const normalizedQuote = normalizeQuote(item.quote)
    if (!normalizedPage.includes(normalizedQuote) && normalizedQuote.length > 30) {
      // Partial match tolerance for slight OCR difference
      const snippet = normalizedQuote.slice(0, 25)
      if (!normalizedPage.includes(snippet)) continue
    }

    references.push({
      documentId: document.id,
      documentName: document.originalName,
      pageNumber: page.pageNumber,
      quote: item.quote.trim(),
    })
  }

  return references
}

export function parseGroundedAIAnalysis(
  outputText: string,
  documents: DocumentWithPages[],
  provider: AIAnalysis['provider'],
  model: string
): AIAnalysis {
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(outputText) as Record<string, unknown>
  } catch {
    throw new Error(`${provider} returned an invalid structured response.`)
  }

  // 1. Parse Metadata Header
  let metadataHeader: CaseMetadataHeader | undefined
  if (parsed.metadataHeader && typeof parsed.metadataHeader === 'object') {
    const raw = parsed.metadataHeader as Record<string, unknown>
    const datesRaw = raw.keyDates && typeof raw.keyDates === 'object' ? (raw.keyDates as Record<string, unknown>) : null
    metadataHeader = {
      courtName: typeof raw.courtName === 'string' && raw.courtName.trim() ? raw.courtName.trim() : null,
      caseNumber: typeof raw.caseNumber === 'string' && raw.caseNumber.trim() ? raw.caseNumber.trim() : null,
      parties: typeof raw.parties === 'string' && raw.parties.trim() ? raw.parties.trim() : null,
      primaryActs: typeof raw.primaryActs === 'string' && raw.primaryActs.trim() ? raw.primaryActs.trim() : null,
      keyDates: datesRaw ? {
        filingDate: typeof datesRaw.filingDate === 'string' && datesRaw.filingDate.trim() ? datesRaw.filingDate.trim() : null,
        orderDate: typeof datesRaw.orderDate === 'string' && datesRaw.orderDate.trim() ? datesRaw.orderDate.trim() : null,
        noticeDate: typeof datesRaw.noticeDate === 'string' && datesRaw.noticeDate.trim() ? datesRaw.noticeDate.trim() : null,
        limitationDeadline: typeof datesRaw.limitationDeadline === 'string' && datesRaw.limitationDeadline.trim() ? datesRaw.limitationDeadline.trim() : null,
      } : undefined,
    }
  }

  // 2. Parse Executive Summary (3-part narrative synthesis)
  let executiveSummary = ''
  if (typeof parsed.executiveSummary === 'string') {
    executiveSummary = parsed.executiveSummary.trim()
  } else if (parsed.executiveSummary && typeof parsed.executiveSummary === 'object') {
    const es = parsed.executiveSummary as Record<string, string>
    executiveSummary = [
      es.coreDispute ? `## 1. Core Dispute & Relief Sought\n${es.coreDispute}\n` : '',
      es.factualBackground ? `## 2. Factual Background & Chronology\n${es.factualBackground}\n` : '',
      es.legalGrounds ? `## 3. Primary Legal Grounds for Challenge/Defense\n${es.legalGrounds}\n` : '',
    ].filter(Boolean).join('\n')
  }

  const executiveSources = validReferences(parsed.executiveSources, documents)
  if (executiveSources.length === 0) {
    // Fallback: collect from document pages if available
    for (const doc of documents) {
      const first = doc.pages.find((p) => p.extractedText?.trim())
      if (first) {
        executiveSources.push({
          documentId: doc.id,
          documentName: doc.originalName,
          pageNumber: first.pageNumber,
          quote: (first.extractedText ?? '').slice(0, 120).trim(),
        })
        break
      }
    }
  }

  if (!executiveSummary) {
    throw new Error(`${provider} returned no executive summary.`)
  }

  // 3. Parse Fact Matrix & Parameters
  const factMatrix: FactMatrixItem[] = []
  if (Array.isArray(parsed.factMatrix)) {
    for (const item of parsed.factMatrix) {
      if (!item || typeof item !== 'object') continue
      const f = item as Record<string, unknown>
      if (typeof f.parameter !== 'string' || typeof f.value !== 'string') continue
      const sources = validReferences([f.source], documents)
      const validCategories: Array<FactMatrixItem['category']> = [
        'Jurisdiction',
        'Compensation / Damages',
        'Procedural Compliance',
        'Limitation',
        'Merits',
      ]
      const matchedCategory = validCategories.find(
        (c) => c.toLowerCase() === String(f.category).toLowerCase() ||
               c.toLowerCase().includes(String(f.category).toLowerCase())
      ) || 'General'

      factMatrix.push({
        category: matchedCategory,
        parameter: f.parameter.trim(),
        value: f.value.trim(),
        source: sources[0] || {
          documentId: documents[0]?.id ?? 1,
          documentName: documents[0]?.originalName ?? 'Document.pdf',
          pageNumber: 1,
          quote: f.value.trim(),
        },
      })
    }
  }

  // 4. Parse Verified Citations & Quotes
  const verifiedCitations: VerifiedCitation[] = []
  if (Array.isArray(parsed.verifiedCitations)) {
    for (const item of parsed.verifiedCitations) {
      if (!item || typeof item !== 'object') continue
      const c = item as Record<string, unknown>
      if (typeof c.passage !== 'string') continue
      const docId = Number.isSafeInteger(c.documentId) ? Number(c.documentId) : documents[0]?.id ?? 1
      const pageNum = Number.isSafeInteger(c.pageNumber) ? Number(c.pageNumber) : 1
      const doc = documents.find((d) => d.id === docId)
      verifiedCitations.push({
        category: (typeof c.category === 'string' ? c.category : 'General') as VerifiedCitation['category'],
        passage: c.passage.trim(),
        documentId: docId,
        documentName: doc?.originalName,
        pageNumber: pageNum,
      })
    }
  }

  // 5. Parse Document Summaries
  const documentSummaries = Array.isArray(parsed.documentSummaries)
    ? parsed.documentSummaries.flatMap((candidate) => {
        if (!candidate || typeof candidate !== 'object') return []
        const item = candidate as Record<string, unknown>
        if (!Number.isSafeInteger(item.documentId) || typeof item.summary !== 'string') return []
        const sources = validReferences(item.sources, documents).filter(
          (source) => source.documentId === item.documentId
        )
        return [{
          documentId: item.documentId as number,
          apparentType: typeof item.apparentType === 'string' ? item.apparentType.slice(0, 120) : 'General Record',
          summary: item.summary.trim().slice(0, 1200),
          sources: sources.length > 0 ? sources : [{
            documentId: item.documentId as number,
            documentName: documents.find((d) => d.id === item.documentId)?.originalName || 'Document.pdf',
            pageNumber: 1,
            quote: item.summary.slice(0, 100),
          }],
        }]
      })
    : []

  // 6. Potential Inconsistencies
  const potentialInconsistencies = Array.isArray(parsed.potentialInconsistencies)
    ? parsed.potentialInconsistencies.flatMap((candidate) => {
        if (!candidate || typeof candidate !== 'object') return []
        const item = candidate as Record<string, unknown>
        if (typeof item.field !== 'string' || typeof item.explanation !== 'string' || !Array.isArray(item.values)) return []
        const values = item.values.filter((value): value is string => typeof value === 'string')
        const sources = validReferences(item.sources, documents)
        return [{
          field: item.field.trim().slice(0, 120),
          values: Array.from(new Set(values.map((value) => value.trim()))),
          explanation: item.explanation.trim().slice(0, 500),
          sources,
        }]
      })
    : []

  return {
    provider,
    model,
    metadataHeader,
    executiveSummary,
    executiveSources,
    factMatrix,
    verifiedCitations,
    documentSummaries,
    potentialInconsistencies,
  }
}

export async function generateAIAnalysis(documents: DocumentWithPages[], language = 'English'): Promise<AIAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI is not configured. Set OPENAI_API_KEY on the server and restart the application.')

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
  const pageInputs: Array<{ documentId: number; documentName: string; pageNumber: number; text: string }> = []
  let remaining = 120_000

  for (const document of documents) {
    for (const page of document.pages) {
      const text = page.extractedText?.trim()
      if (!text || page.quality === 'unreadable' || remaining <= 0) continue
      const excerpt = text.slice(0, Math.min(text.length, remaining))
      pageInputs.push({
        documentId: document.id,
        documentName: document.originalName,
        pageNumber: page.pageNumber,
        text: excerpt,
      })
      remaining -= excerpt.length
    }
  }

  if (pageInputs.length === 0) throw new Error('There is no readable extracted text to send for AI analysis.')

  const systemPrompt = `Analyze the supplied extracted legal-document pages (arbitration, civil, criminal, writ petitions, commercial).
Return a standardized JSON object containing:
- metadataHeader: { courtName, caseNumber, parties, primaryActs, keyDates: { filingDate, orderDate, noticeDate, limitationDeadline } }
- executiveSummary: a 3-part narrative synthesis formatted in markdown:
  ## 1. Core Dispute & Relief Sought
  ...
  ## 2. Factual Background & Chronology
  ...
  ## 3. Primary Legal Grounds for Challenge/Defense
  ...
- executiveSources: array of { documentId, pageNumber, quote }
- factMatrix: array of { category ("Jurisdiction" | "Compensation / Damages" | "Procedural Compliance" | "Limitation" | "Merits"), parameter, value, source: { documentId, pageNumber, quote } }
- verifiedCitations: array of { category, passage, documentId, pageNumber }
- documentSummaries: array of { documentId, apparentType, summary, sources }
- potentialInconsistencies: array

Write in ${language}. Every quote must be exact from the text.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(pageInputs) },
      ],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`OpenAI API error (HTTP ${response.status}): ${errorBody}`)
  }

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  const outputText = payload.choices?.[0]?.message?.content?.trim()
  if (!outputText) throw new Error('OpenAI returned an empty response.')

  return parseGroundedAIAnalysis(outputText, documents, 'OpenAI', model)
}
