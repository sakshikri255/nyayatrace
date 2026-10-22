import type { DocumentWithPages } from '@/lib/queries/documents'
import { parseGroundedAIAnalysis } from './openai'
import type { AIAnalysis } from './openai'

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
    finishReason?: string
  }>
  promptFeedback?: { blockReason?: string }
  error?: { code?: number; message?: string; status?: string }
}

function buildAnalysisInstructions(language: string): string {
  return `Analyze only the supplied extracted legal-document pages. Do not infer guilt, legal eligibility, procedural status, legal sections, court outcomes, or facts not present. Treat allegations and statements as reported content, not established findings. Return JSON with executiveSummary, executiveSources, documentSummaries, and potentialInconsistencies. Every factual statement in the executive summary and each document summary must be supported by an exact verbatim quote in its sources array. A potentialInconsistencies item must contain field, values, a neutral explanation, and at least two exact source quotes from different documentIds; include one only when the discrepancy is supported by those passages. Each source object must contain documentId, pageNumber, and quote copied exactly from supplied text. Each documentSummaries item must contain documentId, apparentType, summary, and sources. Use concise neutral language. If no discrepancies are supported, return an empty potentialInconsistencies array. Do not invent facts or citations. Write all natural-language output fields (executiveSummary, summary, apparentType, explanation) in ${language}. Keep documentId, pageNumber, field, values, and quote values unchanged — those must remain in their original form.`
}

/** Models to try in order if the configured model fails with 404 or 503 */
const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest']

/** API versions to try in order */
const API_VERSIONS = ['v1beta', 'v1'] as const

async function callGeminiAPI(
  apiKey: string,
  model: string,
  requestBody: object,
): Promise<{ response: Response; apiVersion: string; modelUsed: string }> {
  // Try the configured model with both API versions first
  for (const apiVersion of API_VERSIONS) {
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(model)}:generateContent`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    })

    if (response.ok) {
      return { response, apiVersion, modelUsed: model }
    }

    // Retry on 404 (model not found) or 503 (model overloaded) — hard-fail anything else
    if (response.status !== 404 && response.status !== 503) {
      const errorBody = await response.text().catch(() => '')
      let errorDetail = ''
      try {
        const parsed = JSON.parse(errorBody)
        errorDetail = parsed?.error?.message || ''
      } catch { /* ignore parse errors */ }
      throw new Error(
        `Gemini API error (HTTP ${response.status}${errorDetail ? `: ${errorDetail}` : ''}). ` +
        `Model: ${model}, API: ${apiVersion}.`
      )
    }
  }

  // If configured model returned 404, try fallback models
  for (const fallbackModel of FALLBACK_MODELS) {
    if (fallbackModel === model) continue // Already tried
    for (const apiVersion of API_VERSIONS) {
      const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(fallbackModel)}:generateContent`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        console.log(`[NyayaTrace] Model "${model}" not found. Using fallback "${fallbackModel}" (${apiVersion}).`)
        return { response, apiVersion, modelUsed: fallbackModel }
      }

      // Retry on 404 (not found) or 503 (overloaded) — hard-fail anything else
      if (response.status !== 404 && response.status !== 503) {
        const errorBody = await response.text().catch(() => '')
        let errorDetail = ''
        try {
          const parsed = JSON.parse(errorBody)
          errorDetail = parsed?.error?.message || ''
        } catch { /* ignore parse errors */ }
        throw new Error(
          `Gemini API error (HTTP ${response.status}${errorDetail ? `: ${errorDetail}` : ''}). ` +
          `Model: ${fallbackModel}, API: ${apiVersion}.`
        )
      }
    }
  }

  throw new Error(
    `No compatible Gemini model found. Tried "${model}" and fallbacks [${FALLBACK_MODELS.join(', ')}]. ` +
    'Check your API key and ensure it has access to at least one Generative Language model.'
  )
}

export async function generateGeminiAnalysis(documents: DocumentWithPages[], language = 'English'): Promise<AIAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('Gemini is not configured. Set GEMINI_API_KEY on the server and restart NyayaTrace.')
  }

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash'
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

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: buildAnalysisInstructions(language) },
          { text: JSON.stringify(pages) },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  }

  const { response, modelUsed } = await callGeminiAPI(apiKey, model, requestBody)

  const payload = await response.json() as GeminiResponse

  if (payload.error) {
    throw new Error(`Gemini error: ${payload.error.message || payload.error.status || 'Unknown error'}`)
  }

  const outputText = payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .find((text) => text.trim().length > 0)

  if (!outputText) {
    const reason = payload.promptFeedback?.blockReason
    throw new Error(reason ? `Gemini did not process this content (${reason}).` : 'Gemini returned no structured analysis text.')
  }

  return parseGroundedAIAnalysis(outputText, documents, 'Gemini', modelUsed)
}
