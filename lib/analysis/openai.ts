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

export interface AIAnalysis {
  provider: 'OpenAI' | 'Gemini'
  model: string
  executiveSummary: string
  executiveSources: AIReference[]
  potentialInconsistencies: AIInconsistency[]
  documentSummaries: Array<{
    documentId: number
    apparentType: string
    summary: string
    sources: AIReference[]
  }>
}

interface ResponsePayload {
  output?: Array<{
    content?: Array<{ type: string; text?: string }>
  }>
}

function normalizeQuote(text: string) {
  return text.replace(/\s+/g, ' ').trim().toLocaleLowerCase()
}

function validReferences(
  candidate: unknown,
  documents: DocumentWithPages[]
): AIReference[] {
  if (!Array.isArray(candidate)) return []
  const references: AIReference[] = []

  for (const value of candidate) {
    if (!value || typeof value !== 'object') continue
    const item = value as Record<string, unknown>
    if (!Number.isSafeInteger(item.documentId) || !Number.isSafeInteger(item.pageNumber)) continue
    if (typeof item.quote !== 'string' || item.quote.trim().length < 12) continue

    const document = documents.find((entry) => entry.id === item.documentId)
    const page = document?.pages.find((entry) => entry.pageNumber === item.pageNumber)
    if (!document || !page?.extractedText) continue

    const normalizedPage = normalizeQuote(page.extractedText)
    const normalizedQuote = normalizeQuote(item.quote)
    if (!normalizedPage.includes(normalizedQuote)) continue

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

  const executiveSummary = typeof parsed.executiveSummary === 'string'
    ? parsed.executiveSummary.trim().slice(0, 3000)
    : ''
  const executiveSources = validReferences(parsed.executiveSources, documents)
  if (!executiveSummary || executiveSources.length === 0) {
    throw new Error(`${provider} returned no executive summary with verifiable source quotes.`)
  }

  const documentSummaries = Array.isArray(parsed.documentSummaries)
    ? parsed.documentSummaries.flatMap((candidate) => {
        if (!candidate || typeof candidate !== 'object') return []
        const item = candidate as Record<string, unknown>
        if (!Number.isSafeInteger(item.documentId) || typeof item.summary !== 'string') return []
        const sources = validReferences(item.sources, documents)
          .filter((source) => source.documentId === item.documentId)
        if (sources.length === 0) return []
        return [{
          documentId: item.documentId as number,
          apparentType: typeof item.apparentType === 'string' ? item.apparentType.slice(0, 120) : 'Could not be determined',
          summary: item.summary.trim().slice(0, 1200),
          sources,
        }]
      })
    : []

  const potentialInconsistencies = Array.isArray(parsed.potentialInconsistencies)
    ? parsed.potentialInconsistencies.flatMap((candidate) => {
        if (!candidate || typeof candidate !== 'object') return []
        const item = candidate as Record<string, unknown>
        if (typeof item.field !== 'string' || typeof item.explanation !== 'string' || !Array.isArray(item.values)) return []
        const values = item.values.filter((value): value is string => typeof value === 'string')
        const sources = validReferences(item.sources, documents)
        const sourceDocumentIds = Array.from(new Set(sources.map((source) => source.documentId)))
        const quotedText = sources.map((source) => normalizeQuote(source.quote)).join(' ')
        const valuesSupported = values.length > 1 && values.every((value) => quotedText.includes(normalizeQuote(value)))
        if (!valuesSupported || sourceDocumentIds.length < 2) return []
        return [{
          field: item.field.trim().slice(0, 120),
          values: Array.from(new Set(values.map((value) => value.trim()))),
          explanation: item.explanation.trim().slice(0, 500),
          sources,
        }]
      })
    : []

  return { provider, model, executiveSummary, executiveSources, documentSummaries, potentialInconsistencies }
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

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      store: false,
      text: { format: { type: 'json_object' } },
      input: [
        {
          role: 'system',
          content: [{
            type: 'input_text',
            text: `Analyze only the supplied extracted legal-document pages. Do not infer guilt, legal eligibility, procedural status, legal sections, court outcomes, or facts not present. Treat allegations and statements as reported content, not established findings. Return JSON with executiveSummary, executiveSources, documentSummaries, and potentialInconsistencies. Every factual sentence in the executive summary and each document summary must be supported by exact quotes. A potentialInconsistencies item must contain field, values, a neutral explanation, and at least two exact source quotes from different documentIds; only include it when the discrepancy is supported by those passages. Each source must contain documentId, pageNumber, and quote copied exactly from supplied text. documentSummaries items must contain documentId, apparentType, summary, and sources. If no discrepancies are supported, return an empty potentialInconsistencies array. Do not invent facts or citations. Write all natural-language output fields (executiveSummary, summary, apparentType, explanation) in ${language}. Keep documentId, pageNumber, field, values, and quote values unchanged — those must remain in their original form.`,
          }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: JSON.stringify(pageInputs) }],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI analysis failed (HTTP ${response.status}). Check the server provider configuration and try again.`)
  }

  const payload = await response.json() as ResponsePayload
  const outputText = payload.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === 'output_text')?.text
  if (!outputText) throw new Error('OpenAI returned no structured analysis text.')

  return parseGroundedAIAnalysis(outputText, documents, 'OpenAI', model)
}
