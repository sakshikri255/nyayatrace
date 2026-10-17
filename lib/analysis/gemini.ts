import type { DocumentWithPages } from '@/lib/queries/documents'
import { parseGroundedAIAnalysis } from './openai'
import type { AIAnalysis } from './openai'

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
    finishReason?: string
  }>
  promptFeedback?: { blockReason?: string }
}

const ANALYSIS_INSTRUCTIONS = `Analyze only the supplied extracted legal-document pages. Do not infer guilt, legal eligibility, procedural status, legal sections, court outcomes, or facts not present. Treat allegations and statements as reported content, not established findings. Return JSON with executiveSummary, executiveSources, documentSummaries, and potentialInconsistencies. Every factual statement in the executive summary and each document summary must be supported by an exact verbatim quote in its sources array. A potentialInconsistencies item must contain field, values, a neutral explanation, and at least two exact source quotes from different documentIds; include one only when the discrepancy is supported by those passages. Each source object must contain documentId, pageNumber, and quote copied exactly from supplied text. Each documentSummaries item must contain documentId, apparentType, summary, and sources. Use concise neutral language. If no discrepancies are supported, return an empty potentialInconsistencies array. Do not invent facts or citations.`

export async function generateGeminiAnalysis(documents: DocumentWithPages[]): Promise<AIAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('Gemini is not configured. Set GEMINI_API_KEY on the server and restart NyayaTrace.')
  }

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'
  const pages: Array<{ documentId: number; documentName: string; pageNumber: number; text: string }> = []
  let remainingCharacters = 120_000

  for (const document of documents) {
    for (const page of document.pages) {
      const text = page.extractedText?.trim()
      if (!text || page.quality === 'unreadable' || remainingCharacters <= 0) continue
      const pageText = text.slice(0, remainingCharacters)
      pages.push({
        documentId: document.id,
        documentName: document.originalName,
        pageNumber: page.pageNumber,
        text: pageText,
      })
      remainingCharacters -= pageText.length
    }
  }

  if (pages.length === 0) throw new Error('There is no readable extracted text to send for Gemini analysis.')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: ANALYSIS_INSTRUCTIONS }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(pages) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini analysis failed (HTTP ${response.status}). Check the server provider configuration and try again.`)
  }

  const payload = await response.json() as GeminiResponse
  const outputText = payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .find((text) => text.trim().length > 0)

  if (!outputText) {
    const reason = payload.promptFeedback?.blockReason
    throw new Error(reason ? `Gemini did not process this content (${reason}).` : 'Gemini returned no structured analysis text.')
  }

  return parseGroundedAIAnalysis(outputText, documents, 'Gemini', model)
}
