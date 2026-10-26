import type { DocumentWithPages } from '@/lib/queries/documents'
import { parseGroundedAIAnalysis } from './openai'
import type { AIAnalysis } from './openai'

export async function generateGroqAnalysis(documents: DocumentWithPages[], language = 'English'): Promise<AIAnalysis> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('Groq is not configured. Set GROQ_API_KEY on the server and restart NyayaSetu.')

  const model = process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile'
  const pageInputs: Array<{ documentId: number; documentName: string; pageNumber: number; text: string }> = []
  let remaining = 100_000 // Groq has per-request token limits; keep a safe ceiling

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

  if (pageInputs.length === 0) throw new Error('There is no readable extracted text to send for Groq analysis.')

  const systemPrompt = `You are an elite legal intelligence system analyzing uploaded court and legal documents (arbitration petitions, civil appeals, criminal briefs, writ petitions, commercial disputes).
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
  "executiveSummary": "A plain-English human-readable summary in ${language} using this exact markdown template:\\n\\n### 1. Case Overview\\n- **Court / Forum:** [Extracted Court Name]\\n- **Parties Involved:** [Petitioner full name] vs. [Respondent full name with designation]\\n- **Core Dispute:** [1-2 sentences explaining what the case is about in simple, plain language]\\n\\n### 2. Key Facts & Timeline\\n- [What originally happened — include specific land details, plot numbers, mauza, area in acres/decimals, NH number if present]\\n- [What decision was taken by the lower authority/arbitrator — include the committee name, award amount, memo numbers if present]\\n- [What action was taken next — appeal/petition/challenge — include filing date and court]\\n\\n### 3. Main Legal Arguments\\n- **Ground 1:** [Clear explanation of the primary legal challenge — include specific section numbers and act names]\\n- **Ground 2:** [Clear explanation of procedural, jurisdictional, or financial issue — include specific memo/letter/gazette references]\\n\\n### 4. Relief Requested\\n- [What the petitioner or appellant is specifically asking the court to do — include specific relief type]",
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

Every factual statement in executiveSummary, verifiedCitations, and factMatrix must be supported by exact verbatim quotes matching the supplied text. Write all natural-language output fields in ${language}. Keep documentId, pageNumber, and quotes exact. Do not output raw OCR noise, broken symbols, or garbled characters — if a passage is unreadable skip it. Never output single generic sentences — every narrative field must contain specific names, numbers, dates, and legal references from the actual document pages. Return only the JSON object, no markdown fences.`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
    throw new Error(`Groq API error (HTTP ${response.status}): ${errorBody}`)
  }

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  const outputText = payload.choices?.[0]?.message?.content?.trim()
  if (!outputText) throw new Error('Groq returned an empty response.')

  return parseGroundedAIAnalysis(outputText, documents, 'OpenAI', model)
}
