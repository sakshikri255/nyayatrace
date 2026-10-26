import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pages, documents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatCitation {
  documentId: number
  documentName: string
  pageNumber: number
  quote: string
}

export interface ChatResponse {
  reply: string
  citations: ChatCitation[]
}

async function callGeminiChat(
  apiKey: string,
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string
): Promise<ChatResponse> {
  const contents = [
    ...history.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const json = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // Parse citations: look for JSON block in response
  let reply = text
  const citations: ChatCitation[] = []

  // Try to find a JSON citations block at the end of the response
  const citationMatch = text.match(/\[CITATIONS\]([\s\S]*?)\[\/CITATIONS\]/i)
  if (citationMatch) {
    reply = text.replace(citationMatch[0], '').trim()
    try {
      const parsed = JSON.parse(citationMatch[1]) as ChatCitation[]
      citations.push(...parsed)
    } catch { /* ignore */ }
  }

  return { reply, citations }
}

async function callOpenAIChat(
  apiKey: string,
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string
): Promise<ChatResponse> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.2, max_tokens: 1024 }),
  })

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`)

  const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  const text = json.choices?.[0]?.message?.content ?? ''

  let reply = text
  const citations: ChatCitation[] = []
  const citationMatch = text.match(/\[CITATIONS\]([\s\S]*?)\[\/CITATIONS\]/i)
  if (citationMatch) {
    reply = text.replace(citationMatch[0], '').trim()
    try {
      const parsed = JSON.parse(citationMatch[1]) as ChatCitation[]
      citations.push(...parsed)
    } catch { /* ignore */ }
  }

  return { reply, citations }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = parseInt(params.id, 10)
    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'Invalid case id' }, { status: 400 })
    }

    const geminiKey = process.env.GEMINI_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    if (!geminiKey && !openaiKey) {
      return NextResponse.json(
        { error: 'AI not configured — set GEMINI_API_KEY or OPENAI_API_KEY in environment variables' },
        { status: 503 }
      )
    }

    const body = await request.json() as { message?: string; history?: ChatMessage[] }
    const { message, history = [] } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    // Build document context — limited to this case only
    const casePages = db
      .select({
        pageId: pages.id,
        pageNumber: pages.pageNumber,
        extractedText: pages.extractedText,
        documentId: documents.id,
        documentName: documents.originalName,
      })
      .from(pages)
      .innerJoin(documents, eq(documents.id, pages.documentId))
      .where(eq(documents.caseId, caseId))
      .limit(50) // Keep context manageable
      .all()

    const documentContext = casePages
      .filter((p) => p.extractedText)
      .map((p) => `[DOC:${p.documentId}|${p.documentName}|PAGE:${p.pageNumber}]\n${p.extractedText?.slice(0, 500) ?? ''}`)
      .join('\n\n---\n\n')

    const systemPrompt = `You are a legal research assistant for NyayaSetu. You have access ONLY to the following extracted document pages from this specific legal case.

RULES:
1. Answer ONLY from the supplied document text. Never use outside knowledge about specific case facts.
2. For EVERY factual claim, cite the source with documentId, documentName, pageNumber, and an exact quote.
3. Respond in the same language as the user's question.
4. If a question cannot be answered from the documents, clearly say so.
5. After your response, include a [CITATIONS] JSON array and [/CITATIONS] block with citations.

CITATION FORMAT:
[CITATIONS][{"documentId": 1, "documentName": "FIR.pdf", "pageNumber": 1, "quote": "exact text from document"}][/CITATIONS]

DOCUMENT CONTEXT:
${documentContext}`

    let result: ChatResponse
    if (geminiKey) {
      result = await callGeminiChat(geminiKey, systemPrompt, history, message)
    } else {
      result = await callOpenAIChat(openaiKey!, systemPrompt, history, message)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[POST /api/cases/[id]/chat]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
