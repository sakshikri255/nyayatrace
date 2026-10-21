import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bailDrafts } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getBailBriefData } from '@/lib/queries/cases'
import { calculateStatutoryBail } from '@/lib/analysis/statutoryBail'

export const runtime = 'nodejs'

export interface BailDraftContent {
  title: string
  courtHeader: string
  caseBackground: string
  statutoryGrounds: string
  discrepancyArguments: string
  chronology: string
  prayer: string
  signatoryBlock: string
}

function buildTemplateFromBriefData(caseId: number): BailDraftContent {
  const data = getBailBriefData(caseId)
  if (!data) throw new Error('Case not found')

  const c = data.case
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const courtName = c.court ?? '[Court Name]'
  const caseNumber = c.caseNumber
  const caseTitle = c.title
  const vMatch = caseTitle.match(/(?:vs?\.?\s+|v\/s\.?\s+)(.+)/i)
  const accusedName = vMatch ? vMatch[1].trim() : caseTitle
  const remandDate = c.remandDate ?? '[Date of First Remand]'
  const statutoryDays = c.statutoryPeriodDays ?? 60
  const section = (c as { applicableLaw?: string | null }).applicableLaw === 'crpc'
    ? 'Section 167(2) of the Code of Criminal Procedure, 1973'
    : 'Section 187 of the Bharatiya Nagarik Suraksha Sanhita, 2023'

  const bail = calculateStatutoryBail({
    remandDate: c.remandDate,
    statutoryPeriodDays: c.statutoryPeriodDays,
    chargesheetFiled: c.chargesheetFiled,
    chargesheetDate: c.chargesheetDate,
    applicableLaw: c.applicableLaw as 'crpc' | 'bnss' | 'auto' | null,
  })

  const hearingLines = data.hearings.length > 0
    ? data.hearings
        .slice(0, 5)
        .map((h) => `- ${h.hearingDate}: ${h.eventType.replace(/_/g, ' ')} — ${h.outcome ?? 'Pending'}`)
        .join('\n')
    : '- No hearings recorded yet.'

  const conditionLines = data.conditions.length > 0
    ? data.conditions.map((c, i) => `${i + 1}. ${c.conditionText}`).join('\n')
    : 'None imposed yet.'

  return {
    title: `BAIL APPLICATION NO. _____ / ${new Date().getFullYear()}`,
    courtHeader: `IN THE ${courtName.toUpperCase()}\n\nIN THE MATTER OF:\n${caseTitle}\nCase No.: ${caseNumber}`,
    caseBackground: `The Applicant/Accused, ${accusedName}, is in judicial custody in the above-captioned matter since ${remandDate}. The Applicant was first remanded to judicial custody on the said date in connection with the present case.`,
    statutoryGrounds: `As per ${section}, an accused person is entitled to be released on bail if the investigating agency fails to file a chargesheet within ${statutoryDays} days of first remand.\n\nCurrent Bail Status: ${bail.statusLabel}\n${bail.legalGround}`,
    discrepancyArguments: `${
      data.findings.filter((f) => f.reviewStatus === 'verified').length > 0
        ? `${data.findings.filter((f) => f.reviewStatus === 'verified').length} verified document discrepancies have been identified in the case records, including:\n` +
          data.findings
            .filter((f) => f.reviewStatus === 'verified')
            .slice(0, 3)
            .map((f) => `- ${f.description}`)
            .join('\n')
        : 'No verified discrepancies on record. The Applicant denies the allegations and reserves the right to challenge the evidence at trial.'
    }`,
    chronology: `KEY HEARING CHRONOLOGY:\n${hearingLines}`,
    prayer: `It is, therefore, most respectfully prayed that this Hon'ble Court may be pleased to:\n\n(a) Release the Applicant on bail under ${section} on such terms and conditions as this Hon'ble Court deems fit;\n(b) Pass such other and further orders as this Hon'ble Court may deem just and proper.\n\nAND FOR THIS ACT OF KINDNESS, THE APPLICANT SHALL FOREVER PRAY.\n\nExisting Bail Conditions on Record:\n${conditionLines}`,
    signatoryBlock: `Date: ${today}\nPlace: [Place]\n\n                                        Respectfully submitted,\n                                        [Advocate Name]\n                                        Enrollment No.: [Enrl. No.]\n                                        Counsel for the Applicant\n\n────────────────────────────────────────────────────────────────────────\nNOTICE: Machine-generated draft. Verify all facts before filing.`,
  }
}

async function generateWithAI(caseId: number): Promise<{ content: BailDraftContent; engine: string }> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.OPENAI_API_KEY ?? ''
  if (!apiKey) {
    return { content: buildTemplateFromBriefData(caseId), engine: 'template' }
  }

  try {
    const data = getBailBriefData(caseId)
    if (!data) throw new Error('Case not found')

    const template = buildTemplateFromBriefData(caseId)
    const context = JSON.stringify(template, null, 2)

    const prompt = `You are a legal drafting assistant. Given the following pre-filled bail application sections in JSON, rewrite them to be more formal, complete, and court-ready. Return ONLY valid JSON with the same keys: title, courtHeader, caseBackground, statutoryGrounds, discrepancyArguments, chronology, prayer, signatoryBlock. Do not add new keys. Keep all factual details exactly as provided — only improve language and structure.\n\nInput:\n${context}`

    if (process.env.GEMINI_API_KEY) {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      )
      if (response.ok) {
        const json = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        const parsed = JSON.parse(text.trim()) as BailDraftContent
        return { content: parsed, engine: 'gemini' }
      }
    }

    return { content: template, engine: 'template' }
  } catch {
    return { content: buildTemplateFromBriefData(caseId), engine: 'template' }
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = parseInt(params.id, 10)
    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'Invalid case id' }, { status: 400 })
    }

    const { content, engine } = await generateWithAI(caseId)

    // Get next version number
    const existing = db
      .select({ version: bailDrafts.version })
      .from(bailDrafts)
      .where(eq(bailDrafts.caseId, caseId))
      .orderBy(desc(bailDrafts.version))
      .limit(1)
      .all()
    const nextVersion = (existing[0]?.version ?? 0) + 1

    db.insert(bailDrafts).values({
      caseId,
      version: nextVersion,
      content: JSON.stringify(content),
      engine,
    }).run()

    return NextResponse.json({ content, engine, version: nextVersion })
  } catch (error) {
    console.error('[POST /api/cases/[id]/bail-draft/generate]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
