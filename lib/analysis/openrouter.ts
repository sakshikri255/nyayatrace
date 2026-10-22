import type { DocumentWithPages } from '@/lib/queries/documents'
import { parseGroundedAIAnalysis } from './openai'
import type { AIAnalysis } from './openai'

export async function generateOpenRouterAnalysis(documents: DocumentWithPages[], language = 'English'): Promise<AIAnalysis> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OpenRouter is not configured. Set OPENROUTER_API_KEY on the server and restart NyayaTrace.')

  const model = process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini'
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

  if (pageInputs.length === 0) throw new Error('There is no readable extracted text to send for OpenRouter analysis.')

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

Write in ${language}. Every quote must be exact from the text. Return only the JSON object, no markdown fences.`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://nyayatrace.app',
      'X-Title': 'NyayaTrace Legal Analysis',
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
    throw new Error(`OpenRouter API error (HTTP ${response.status}): ${errorBody}`)
  }

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  const outputText = payload.choices?.[0]?.message?.content?.trim()
  if (!outputText) throw new Error('OpenRouter returned an empty response.')

  return parseGroundedAIAnalysis(outputText, documents, 'OpenAI', model)
}
