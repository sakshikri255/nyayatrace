import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type RouteContext = { params: { id: string } }

// Call Gemini to translate a batch of text strings
async function translateWithGemini(texts: string[], targetLanguage: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured.')

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash'

  const prompt = `You are a professional legal translator. Translate the following JSON array of legal text strings into ${targetLanguage}. 
Rules:
- Preserve all legal terminology accuracy
- Keep proper nouns (names, places, case numbers, section references like "IPC 302") unchanged
- Return ONLY a valid JSON array of translated strings, same length and order as input
- Do not add any explanation or preamble

Input JSON array:
${JSON.stringify(texts)}`

  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
  }

  const apiVersions = ['v1beta', 'v1'] as const
  for (const apiVersion of apiVersions) {
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(model)}:generateContent`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(requestBody),
    })
    if (!response.ok) {
      if (response.status === 404) continue
      const errText = await response.text().catch(() => '')
      throw new Error(`Gemini error ${response.status}: ${errText.slice(0, 200)}`)
    }
    const payload = await response.json()
    const outputText = payload.candidates
      ?.flatMap((c: { content?: { parts?: Array<{ text?: string }> } }) => c.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? '')
      .find((t: string) => t.trim().length > 0)
    if (!outputText) throw new Error('Gemini returned no translation output.')
    const parsed = JSON.parse(outputText)
    if (!Array.isArray(parsed)) throw new Error('Gemini did not return a JSON array.')
    return parsed as string[]
  }
  throw new Error('No compatible Gemini model found for translation.')
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const caseId = Number.parseInt(params.id, 10)
  if (!Number.isSafeInteger(caseId) || caseId <= 0) {
    return NextResponse.json({ error: 'Invalid case id.' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const language: string = typeof body?.language === 'string' && body.language.trim() ? body.language.trim() : 'English'

  if (language === 'English') {
    return NextResponse.json({ error: 'Language is already English. No translation needed.' }, { status: 400 })
  }

  // The fields to translate — passed in from the client
  const fields: Record<string, string> = body?.fields ?? {}
  if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'No text fields provided for translation.' }, { status: 400 })
  }

  const hasGemini = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
  if (!hasGemini) {
    return NextResponse.json({
      error: 'No AI provider configured. Set GEMINI_API_KEY to enable translation.',
    }, { status: 503 })
  }

  const keys = Object.keys(fields)
  const values = keys.map((k) => fields[k])

  // Filter out empty strings to avoid wasting tokens
  const nonEmptyIndices = values.map((v, i) => v?.trim() ? i : -1).filter((i) => i >= 0)
  const textsToTranslate = nonEmptyIndices.map((i) => values[i])

  if (textsToTranslate.length === 0) {
    return NextResponse.json({ translated: fields })
  }

  const translated = await translateWithGemini(textsToTranslate, language)

  // Reconstruct result mapping original keys → translated values
  const result: Record<string, string> = {}
  for (let i = 0; i < keys.length; i++) {
    const nonEmptyPos = nonEmptyIndices.indexOf(i)
    result[keys[i]] = nonEmptyPos >= 0 && translated[nonEmptyPos] ? translated[nonEmptyPos] : values[i]
  }

  return NextResponse.json({ translated: result })
}
