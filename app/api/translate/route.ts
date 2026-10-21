import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/translate
 * Body: { texts: string[], targetLanguage: string }
 * Returns: { translations: string[] }
 *
 * Translates an array of text passages into the requested language using
 * Gemini (preferred) or OpenAI. Falls back gracefully if no provider is configured.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const texts: unknown = body?.texts
  const targetLanguage: unknown = body?.targetLanguage

  if (!Array.isArray(texts) || texts.length === 0) {
    return NextResponse.json({ error: 'texts must be a non-empty array.' }, { status: 400 })
  }
  if (typeof targetLanguage !== 'string' || !targetLanguage.trim()) {
    return NextResponse.json({ error: 'targetLanguage is required.' }, { status: 400 })
  }

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (!geminiKey && !openaiKey) {
    return NextResponse.json(
      { error: 'No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY to enable translation.' },
      { status: 503 },
    )
  }

  const prompt = `Translate each of the following JSON string array items into ${targetLanguage}. Return ONLY a JSON array of translated strings in the same order, with no extra keys or explanation. Preserve proper nouns, case numbers, dates, and legal terminology. Do not translate document names or numeric values.\n\n${JSON.stringify(texts)}`

  try {
    if (geminiKey) {
      const translations = await translateWithGemini(geminiKey, prompt, texts as string[])
      return NextResponse.json({ translations })
    }
    if (openaiKey) {
      const translations = await translateWithOpenAI(openaiKey, prompt, texts as string[])
      return NextResponse.json({ translations })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Translation failed.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ error: 'No AI provider available.' }, { status: 503 })
}

async function translateWithGemini(apiKey: string, prompt: string, fallback: string[]): Promise<string[]> {
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash'
  const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest']
  const API_VERSIONS = ['v1beta', 'v1'] as const

  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
  }

  for (const tryModel of [model, ...FALLBACK_MODELS.filter((m) => m !== model)]) {
    for (const version of API_VERSIONS) {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${encodeURIComponent(tryModel)}:generateContent`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(requestBody),
      })
      if (!response.ok) {
        if (response.status === 404) continue
        const text = await response.text().catch(() => '')
        throw new Error(`Gemini translation error (HTTP ${response.status}): ${text.slice(0, 200)}`)
      }
      const payload = await response.json()
      const outputText = payload.candidates
        ?.flatMap((c: { content?: { parts?: Array<{ text?: string }> } }) => c.content?.parts ?? [])
        .map((p: { text?: string }) => p.text ?? '')
        .find((t: string) => t.trim().length > 0)
      if (!outputText) return fallback
      try {
        const parsed = JSON.parse(outputText)
        if (Array.isArray(parsed) && parsed.length === fallback.length) return parsed as string[]
      } catch {
        // ignore and return fallback
      }
      return fallback
    }
  }
  return fallback
}

async function translateWithOpenAI(apiKey: string, prompt: string, fallback: string[]): Promise<string[]> {
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`OpenAI translation error (HTTP ${response.status}): ${text.slice(0, 200)}`)
  }
  const payload = await response.json()
  const outputText = payload.choices?.[0]?.message?.content ?? ''
  try {
    const parsed = JSON.parse(outputText)
    // Model might return { translations: [...] } or just [...]
    const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.translations) ? parsed.translations : null)
    if (arr && arr.length === fallback.length) return arr as string[]
  } catch {
    // ignore
  }
  return fallback
}
