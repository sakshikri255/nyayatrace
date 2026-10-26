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
  return `You are an elite legal intelligence system analyzing uploaded court and legal documents (arbitration petitions, civil appeals, criminal briefs, writ petitions, commercial disputes).
Analyze ONLY the supplied extracted legal-document pages. Do not infer guilt, outcomes, or facts not present in the record. Treat all allegations and statements as reported content, not established findings.

Return a standardized JSON object with this exact structure:
{
  "metadataHeader": {
    "courtName": "Exact court or tribunal name (e.g. District Judge Court, Purnea; High Court of Judicature; Arbitral Tribunal) or null",
    "caseNumber": "Official case reference number and year (e.g. Arb. R.D. Case No. 04/2023) or null",
    "parties": "Petitioner / Appellant vs. Respondent / Opposite Party or null",
    "primaryActs": "Relevant substantive and procedural Acts and Sections invoked (e.g. Section 34, Arbitration & Conciliation Act 1996; Section 3G, National Highways Act) or null",
    "keyDates": {
      "filingDate": "Filing date or null",
      "orderDate": "Impugned order / award date or null",
      "noticeDate": "Notice date or null",
      "limitationDeadline": "Limitation statutory deadline or null"
    }
  },
  "executiveSummary": "A plain-English human-readable summary in ${language} using this exact markdown template:\n\n### 1. Case Overview\n- **Court / Forum:** [Extracted Court Name]\n- **Parties Involved:** [Petitioner full name] vs. [Respondent full name with designation]\n- **Core Dispute:** [1-2 sentences explaining what the case is about in simple, plain language]\n\n### 2. Key Facts & Timeline\n- [What originally happened — include specific land details, plot numbers, mauza, area in acres/decimals, NH number if present]\n- [What decision was taken by the lower authority/arbitrator — include the committee name, award amount, memo numbers if present]\n- [What action was taken next — appeal/petition/challenge — include filing date and court]\n\n### 3. Main Legal Arguments\n- **Ground 1:** [Clear explanation of the primary legal challenge — include specific section numbers and act names]\n- **Ground 2:** [Clear explanation of procedural, jurisdictional, or financial issue — include specific memo/letter/gazette references]\n\n### 4. Relief Requested\n- [What the petitioner or appellant is specifically asking the court to do — include specific relief type]",
  "executiveSources": [
    { "documentId": 1, "pageNumber": 1, "quote": "<exact verbatim quote from page text>" }
  ],
  "factMatrix": [
    {
      "category": "Jurisdiction" | "Compensation / Damages" | "Procedural Compliance" | "Limitation" | "Merits",
      "parameter": "Parameter or Legal Question (e.g. Arbitral Authority / Six-Men Committee, Commercial Land Valuation, Statutory Limitation)",
      "value": "Extracted finding or statutory provision — include all specific values, names, plot numbers, section numbers found",
      "source": { "documentId": 1, "pageNumber": 1, "quote": "<verbatim excerpt>" }
    }
  ],
  "verifiedCitations": [
    {
      "category": "Jurisdiction" | "Compensation" | "Procedural" | "Limitation" | "Merits",
      "passage": "A rich 4-5 sentence factual narrative for this page. Include ALL specific details present: full names of parties (e.g. Surendra Kumar Saroj, Punam Devi, Project Director NHAI), locations (e.g. Mauza Maranga, R.S. Plot No. 1143, Khata No. 1599, 0.28 acres, NH-107A), statutory references (e.g. Section 34 Arbitration Act, Section 3G(5)/3D NH Act), document references (e.g. Memo No. 75, Letter No. 931, Gazette dated 01.04.2016), and the specific action taken (what was claimed, what the committee/arbitrator decided, and why it is challenged). Write in clear active voice. Do NOT output generic one-line summaries.",
      "documentId": 1,
      "pageNumber": 1
    }
  ],
  "documentSummaries": [
    {
      "documentId": 1,
      "apparentType": "Apparent document type (e.g. Arbitration Petition, FIR, Bail Application, Chargesheet, Court Order)",
      "summary": "A rich 3-4 sentence plain-English narrative summary of this specific document. Include party names, land/property details, statutory sections, memo/letter references, and key decisions or rulings found in the document. Do NOT output one-line generic descriptions.",
      "sources": [{ "documentId": 1, "pageNumber": 1, "quote": "<exact quote>" }]
    }
  ],
  "potentialInconsistencies": []
}

Every factual statement in executiveSummary, verifiedCitations, and factMatrix must be supported by exact verbatim quotes matching the supplied text. Write all natural-language output fields in ${language}. Keep documentId, pageNumber, and quotes exact. Do not output raw OCR noise, broken symbols, or garbled characters — if a passage is unreadable skip it. Never output single generic sentences — every narrative field must contain specific names, numbers, dates, and legal references from the actual document pages.`
}

/** Models to try in order if the configured model fails with 404 */
const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']

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

    // If not a 404 (model not found), don't retry with other models
    if (response.status !== 404) {
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
        console.log(`[NyayaSetu] Model "${model}" not found. Using fallback "${fallbackModel}" (${apiVersion}).`)
        return { response, apiVersion, modelUsed: fallbackModel }
      }

      // Only retry on 404
      if (response.status !== 404) {
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

/** Strip the most disruptive OCR noise before sending text to the LLM.
 *  Does NOT remove | = / - because these appear in memo numbers, case refs, etc. */
function sanitizePageTextForLLM(raw: string): string {
  return raw
    // Remove unreadable/garbled currency and symbol noise (not = | / -)
    .replace(/[£€§~©®°±×÷¿¡¦¨¬¯²³¹º¼½¾]/g, ' ')
    // Remove broken OCR single-character sequences separated by spaces (e.g. "a r T H E r e v i")
    .replace(/\b([A-Za-z])\s+(?:[A-Za-z]\s+){3,}[A-Za-z]\b/g, ' ')
    // Remove lines that are pure symbol garbage (no real words)
    .replace(/^[^a-zA-Z0-9\u0900-\u097F]{5,}$/gm, '')
    // Collapse multiple spaces; preserve newlines for paragraph structure
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function generateGeminiAnalysis(documents: DocumentWithPages[], language = 'English'): Promise<AIAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('Gemini is not configured. Set GEMINI_API_KEY on the server and restart NyayaSetu.')
  }

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'
  const pages: Array<{ documentId: number; documentName: string; pageNumber: number; text: string }> = []
  let remainingCharacters = 120_000

  for (const document of documents) {
    for (const page of document.pages) {
      const rawText = page.extractedText?.trim()
      if (!rawText || page.quality === 'unreadable' || remainingCharacters <= 0) continue
      // Sanitize OCR noise before sending to LLM
      const text = sanitizePageTextForLLM(rawText)
      if (!text) continue
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
