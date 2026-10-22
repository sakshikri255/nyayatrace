/**
 * Local Ollama inference provider for NyayaTrace.
 *
 * Configuration (all server-side, no API key needed):
 *   OLLAMA_BASE_URL  – default: http://localhost:11434
 *   OLLAMA_MODEL     – default: llama3
 *
 * Ollama exposes an OpenAI-compatible /api/chat endpoint.
 * The response shape is { message: { content: "..." } } when stream:false.
 *
 * If Ollama is unreachable or the model is not pulled, this throws a clear
 * actionable error rather than returning empty or fake analysis.
 */

import type { DocumentWithPages } from '@/lib/queries/documents'
import { parseGroundedAIAnalysis } from './openai'
import type { AIAnalysis } from './openai'

/** The detailed analysis prompt — mirrors the Gemini prompt exactly. */
function buildOllamaSystemPrompt(language: string): string {
  return `You are an elite legal intelligence system analyzing uploaded court and legal documents (arbitration petitions, civil appeals, criminal briefs, writ petitions, commercial disputes).
Analyze ONLY the supplied extracted legal-document pages. Do not infer guilt, outcomes, or facts not present in the record. Treat all allegations and statements as reported content, not established findings.

Return a standardized JSON object with this exact structure:
{
  "metadataHeader": {
    "courtName": "Exact court or tribunal name or null",
    "caseNumber": "Official case reference number and year or null",
    "parties": "Petitioner / Appellant vs. Respondent / Opposite Party or null",
    "primaryActs": "Relevant Acts and Sections invoked or null",
    "keyDates": {
      "filingDate": "Filing date or null",
      "orderDate": "Impugned order / award date or null",
      "noticeDate": "Notice date or null",
      "limitationDeadline": "Limitation statutory deadline or null"
    }
  },
  "executiveSummary": "A plain-English human-readable summary in ${language} using this exact markdown template:\\n\\n### 1. Case Overview\\n- **Court / Forum:** [Court Name]\\n- **Parties Involved:** [Petitioner] vs. [Respondent]\\n- **Core Dispute:** [1-2 sentences]\\n\\n### 2. Key Facts & Timeline\\n- [Specific land details, plot numbers, area, NH number if present]\\n- [Decision by lower authority/arbitrator with amounts and memo numbers]\\n- [Appeal/petition/challenge with filing date]\\n\\n### 3. Main Legal Arguments\\n- **Ground 1:** [Primary legal challenge with section numbers]\\n- **Ground 2:** [Procedural or financial issue with references]\\n\\n### 4. Relief Requested\\n- [What petitioner asks the court to do]",
  "executiveSources": [
    { "documentId": 1, "pageNumber": 1, "quote": "<exact verbatim quote>" }
  ],
  "factMatrix": [
    {
      "category": "Jurisdiction" | "Compensation / Damages" | "Procedural Compliance" | "Limitation" | "Merits",
      "parameter": "Legal Question or Parameter",
      "value": "Extracted finding with specific values",
      "source": { "documentId": 1, "pageNumber": 1, "quote": "<verbatim excerpt>" }
    }
  ],
  "verifiedCitations": [
    {
      "category": "Jurisdiction" | "Compensation" | "Procedural" | "Limitation" | "Merits",
      "passage": "A rich 4-5 sentence factual narrative for this page. Include ALL specific details: full party names, locations, plot/khata numbers, area, statutory references, memo/letter numbers, amounts, and the specific action taken. Write in clear active voice. Do NOT output generic summaries.",
      "documentId": 1,
      "pageNumber": 1
    }
  ],
  "documentSummaries": [
    {
      "documentId": 1,
      "apparentType": "Document type (e.g. Arbitration Petition, FIR, Court Order)",
      "summary": "3-4 sentence plain-English summary with party names, property details, statutory sections, and key decisions.",
      "sources": [{ "documentId": 1, "pageNumber": 1, "quote": "<exact quote>" }]
    }
  ],
  "potentialInconsistencies": []
}

Every factual statement must be supported by exact verbatim quotes from the supplied text. Write natural-language output in ${language}. Do not output raw OCR noise or garbled characters. Every narrative field must contain specific names, numbers, dates, and legal references from the actual pages. Return only the JSON object, no markdown fences.`
}

export async function generateOllamaAnalysis(
  documents: DocumentWithPages[],
  language = 'English'
): Promise<AIAnalysis> {
  const baseUrl = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/$/, '')
  const model = process.env.OLLAMA_MODEL?.trim() || 'llama3'

  // Build page inputs (same ceiling as other providers)
  const pageInputs: Array<{
    documentId: number
    documentName: string
    pageNumber: number
    text: string
  }> = []
  let remaining = 100_000

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

  if (pageInputs.length === 0) {
    throw new Error('No readable extracted text available to send to Ollama.')
  }

  // Hit the Ollama /api/chat endpoint (stream:false → synchronous response)
  let response: Response
  try {
    response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        messages: [
          { role: 'system', content: buildOllamaSystemPrompt(language) },
          { role: 'user', content: JSON.stringify(pageInputs) },
        ],
      }),
    })
  } catch (networkError) {
    throw new Error(
      `Ollama is not reachable at ${baseUrl}. ` +
      `Make sure Ollama is running ("ollama serve") and the model "${model}" is pulled ` +
      `("ollama pull ${model}"). Original error: ${String(networkError)}`
    )
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    let detail = ''
    try { detail = (JSON.parse(body) as { error?: string }).error ?? '' } catch { /* ignore */ }
    throw new Error(
      `Ollama API error (HTTP ${response.status}${detail ? `: ${detail}` : ''}). ` +
      `Model: "${model}". Check that the model is pulled: ollama pull ${model}`
    )
  }

  // Ollama /api/chat non-streaming response: { message: { role, content } }
  const payload = await response.json() as {
    message?: { content?: string }
    done?: boolean
    error?: string
  }

  if (payload.error) {
    throw new Error(`Ollama error: ${payload.error}`)
  }

  const outputText = payload.message?.content?.trim()
  if (!outputText) {
    throw new Error('Ollama returned an empty response. The model may not support JSON output format.')
  }

  return parseGroundedAIAnalysis(outputText, documents, 'OpenAI', `ollama/${model}`)
}
