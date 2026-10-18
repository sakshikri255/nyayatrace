import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: NextRequest, _ctx: unknown) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured. Set GEMINI_API_KEY to enable AI enhancement.' }, { status: 400 })
    }

    const body = await request.json()
    const { template } = body as { template: string }
    if (!template?.trim()) {
      return NextResponse.json({ error: 'No template text provided.' }, { status: 400 })
    }

    const model = process.env.GEMINI_MODEL?.trim() || 'gemini-1.5-flash'
    const prompt = `You are a legal drafting assistant for Indian courts. The user has a draft bail application. Improve its language, structure, and legal precision. Use formal Indian legal court language. Do NOT add any facts not already present. Do NOT include any legal opinion, advice, or eligibility assessment. Return only the improved application text, no preamble.\n\nDRAFT:\n${template}`

    // Try v1beta first, then v1
    for (const apiVersion of ['v1beta', 'v1']) {
      const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(model)}:generateContent`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      })

      if (!res.ok) {
        if (res.status === 404) continue
        const err = await res.json().catch(() => ({}))
        return NextResponse.json(
          { error: `Gemini error: ${(err as { error?: { message?: string } })?.error?.message ?? res.statusText}` },
          { status: 502 }
        )
      }

      const data = await res.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      const text = data.candidates
        ?.flatMap((c) => c.content?.parts ?? [])
        .map((p) => p.text ?? '')
        .find((t) => t.trim().length > 0)

      if (!text) {
        return NextResponse.json({ error: 'Gemini returned no content.' }, { status: 502 })
      }

      return NextResponse.json({ enhanced: text })
    }

    return NextResponse.json({ error: 'Gemini model not available. Check your API key.' }, { status: 502 })
  } catch (error) {
    console.error('[POST /api/cases/[id]/draft]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
