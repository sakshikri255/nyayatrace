import { and, desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { buildCaseSynopsis } from '@/lib/analysis/synopsis'
import { generateAIAnalysis } from '@/lib/analysis/openai'
import { generateGeminiAnalysis } from '@/lib/analysis/gemini'
import { db } from '@/lib/db'
import { analysisRuns, documents, findings, findingSources, pages } from '@/lib/db/schema'
import { getCaseById } from '@/lib/queries/cases'
import { getDocumentWithPages } from '@/lib/queries/documents'
import { getFindingWithSources } from '@/lib/queries/findings'

export const runtime = 'nodejs'

type RouteContext = { params: { id: string } }

function parseSynopsis(result: string | null) {
  if (!result) return null
  try {
    return JSON.parse(result)
  } catch {
    return null
  }
}

function caseIdFromParams(params: RouteContext['params']) {
  const caseId = Number.parseInt(params.id, 10)
  return Number.isSafeInteger(caseId) && caseId > 0 ? caseId : null
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const caseId = caseIdFromParams(params)
  if (!caseId) return NextResponse.json({ error: 'Invalid case id.' }, { status: 400 })
  const caseRecord = getCaseById(caseId)
  if (!caseRecord) return NextResponse.json({ error: 'Case not found.' }, { status: 404 })

  const runs = db
    .select()
    .from(analysisRuns)
    .where(eq(analysisRuns.caseId, caseId))
    .orderBy(desc(analysisRuns.version))
    .all()
  const latest = runs[0]
  const currentDocuments = db
    .select()
    .from(documents)
    .where(eq(documents.caseId, caseId))
    .all()
  const latestSynopsis = latest ? parseSynopsis(latest.result) : null
  const analyzedDocumentIds = (latestSynopsis?.documentSummaries ?? [])
    .map((document: { documentId: number }) => document.documentId)
    .sort((first: number, second: number) => first - second)
  const currentDocumentIds = currentDocuments.map((document) => document.id).sort((first, second) => first - second)
  const sameDocuments = analyzedDocumentIds.length === currentDocumentIds.length &&
    analyzedDocumentIds.every((documentId: number, index: number) => documentId === currentDocumentIds[index])
  const latestDocumentChange = currentDocuments.reduce((latestTime, document) => {
    const changedAt = Date.parse(document.processedAt ?? document.createdAt ?? document.uploadDate ?? '')
    return Number.isNaN(changedAt) ? latestTime : Math.max(latestTime, changedAt)
  }, 0)
  const runTime = Date.parse(latest?.createdAt ?? '')
  const savedCase = latestSynopsis?.caseOverview
  const sameCaseMetadata = savedCase &&
    savedCase.title === caseRecord.title &&
    savedCase.reference === caseRecord.caseNumber &&
    savedCase.caseType === caseRecord.caseType &&
    savedCase.status === caseRecord.status &&
    savedCase.court === caseRecord.court &&
    savedCase.jurisdiction === caseRecord.jurisdiction &&
    savedCase.userNotes === caseRecord.description
  const current = Boolean(
    latest?.status === 'complete' &&
    sameDocuments &&
    sameCaseMetadata &&
    !Number.isNaN(runTime) &&
    runTime >= latestDocumentChange
  )

  const docsWithPages = currentDocuments.map((doc) => getDocumentWithPages(doc.id)).filter((d): d is NonNullable<typeof d> => d !== null)
  let fallbackKeyEntities: ReturnType<typeof buildCaseSynopsis>['keyEntities'] | null = null

  return NextResponse.json({
    current,
    aiProviderConfigured: Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    aiProviders: {
      gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
    },
    latestRunId: latest?.id ?? null,
    runs: runs.map((run) => {
      const synopsis = parseSynopsis(run.result)
      if (synopsis && (!synopsis.keyEntities || synopsis.keyEntities.length === 0)) {
        if (!fallbackKeyEntities && caseRecord) {
          fallbackKeyEntities = buildCaseSynopsis(caseRecord, docsWithPages).keyEntities
        }
        synopsis.keyEntities = fallbackKeyEntities || []
      }
      return {
        ...run,
        synopsis,
        findings: db.select({ id: findings.id })
          .from(findings)
          .where(eq(findings.analysisRunId, run.id))
          .all()
          .map(({ id }) => getFindingWithSources(id))
          .filter((finding): finding is NonNullable<typeof finding> => finding !== null),
      }
    }),
  })
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const body = await request.json().catch(() => null)
  const useAi = body?.useAi === true
  const aiProvider = body?.aiProvider === 'openai' ? 'openai' : 'gemini'
  const providerConfigured = aiProvider === 'gemini'
    ? Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
    : Boolean(process.env.OPENAI_API_KEY)
  if (useAi && !providerConfigured) {
    return NextResponse.json({
      error: aiProvider === 'gemini'
        ? 'Gemini is not configured. Set GEMINI_API_KEY in the server environment and restart NyayaTrace.'
        : 'OpenAI is not configured. Set OPENAI_API_KEY in the server environment and restart NyayaTrace.',
    }, { status: 503 })
  }

  const caseId = caseIdFromParams(params)
  if (!caseId) return NextResponse.json({ error: 'Invalid case id.' }, { status: 400 })
  const caseRecord = getCaseById(caseId)
  if (!caseRecord) return NextResponse.json({ error: 'Case not found.' }, { status: 404 })

  const caseDocuments = db
    .select()
    .from(documents)
    .where(eq(documents.caseId, caseId))
    .all()
  if (caseDocuments.length === 0) {
    return NextResponse.json({ error: 'Upload documents before analysing this case.' }, { status: 400 })
  }

  const unfinishedDocuments = caseDocuments.filter(
    (document) => document.processingStatus === 'pending' || document.processingStatus === 'processing'
  )
  if (unfinishedDocuments.length > 0) {
    return NextResponse.json({
      error: `Wait for document processing to finish: ${unfinishedDocuments.map((document) => document.originalName).join(', ')}`,
    }, { status: 409 })
  }

  const runningRun = db.select()
    .from(analysisRuns)
    .where(and(eq(analysisRuns.caseId, caseId), eq(analysisRuns.status, 'running')))
    .get()
  if (runningRun) {
    return NextResponse.json({ error: 'Analysis is already running for this case.' }, { status: 409 })
  }

  const loadedDocuments = caseDocuments
    .map(({ id }) => getDocumentWithPages(id))
    .filter((document): document is NonNullable<typeof document> => document !== null)
  const highestVersion = db
    .select({ version: analysisRuns.version })
    .from(analysisRuns)
    .where(eq(analysisRuns.caseId, caseId))
    .orderBy(desc(analysisRuns.version))
    .get()?.version ?? 0
  const version = highestVersion + 1
  let run: typeof analysisRuns.$inferSelect
  try {
    run = db.insert(analysisRuns).values({
      caseId,
      version,
      status: 'running',
      engine: !useAi
        ? 'local-extract-v1'
        : aiProvider === 'gemini'
          ? `gemini:${process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash'}`
          : `openai:${process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'}`,
      createdAt: new Date().toISOString(),
    }).returning().get()
  } catch (cause) {
    if (cause instanceof Error && cause.message.toLowerCase().includes('unique')) {
      return NextResponse.json({ error: 'Analysis is already running for this case.' }, { status: 409 })
    }
    throw cause
  }
  const readablePages = loadedDocuments.flatMap((document) =>
    document.pages.filter((page) => page.quality !== 'unreadable' && page.extractedText?.trim())
  )

  if (readablePages.length === 0) {
    const error = 'No readable text is available. Check document processing or upload a text-based PDF or clearer scan.'
    const failedRun = db.update(analysisRuns)
      .set({ status: 'failed', error })
      .where(eq(analysisRuns.id, run.id))
      .returning()
      .get()
    return NextResponse.json({ ...failedRun, synopsis: null }, { status: 201 })
  }

  try {
    const synopsis = buildCaseSynopsis(caseRecord, loadedDocuments)
    if (useAi) {
      synopsis.aiAnalysis = aiProvider === 'gemini'
        ? await generateGeminiAnalysis(loadedDocuments)
        : await generateAIAnalysis(loadedDocuments)
      const localInconsistencies = synopsis.potentialInconsistencies
      const localKeys = new Set(localInconsistencies.map((issue) =>
        `${issue.field.toLowerCase()}|${issue.values.map((value) => value.toLowerCase()).sort().join('|')}`
      ))
      const additionalAIInconsistencies = synopsis.aiAnalysis.potentialInconsistencies
        .map((issue) => ({
          ...issue,
          origin: 'ai' as const,
          sources: issue.sources.map(({ quote, ...source }) => ({ ...source, passage: quote })),
        }))
        .filter((issue) => !localKeys.has(
          `${issue.field.toLowerCase()}|${issue.values.map((value) => value.toLowerCase()).sort().join('|')}`
        ))
      synopsis.potentialInconsistencies = [...localInconsistencies, ...additionalAIInconsistencies]
    }
    const completedRun = db.transaction((transaction) => {
      const savedRun = transaction.update(analysisRuns)
        .set({ status: 'complete', result: JSON.stringify(synopsis) })
        .where(eq(analysisRuns.id, run.id))
        .returning()
        .get()

      for (const inconsistency of synopsis.potentialInconsistencies) {
        const finding = transaction.insert(findings).values({
          caseId,
          analysisRunId: savedRun.id,
          findingType: /name|party|witness|applicant|accused/i.test(inconsistency.field)
            ? 'name_variation'
            : /location|place/i.test(inconsistency.field)
              ? 'location_mismatch'
              : 'date_discrepancy',
          description: inconsistency.explanation ?? `Different values were found for “${inconsistency.field}”. Human review is required.`,
          extractedValue: inconsistency.values[0] ?? null,
          comparisonValue: inconsistency.values.slice(1).join('; ') || null,
          severity: 'medium',
          reviewStatus: 'needs_review',
        }).returning().get()

        inconsistency.sources.forEach((source, index) => {
          const page = transaction
            .select({ id: pages.id })
            .from(pages)
            .where(and(eq(pages.documentId, source.documentId), eq(pages.pageNumber, source.pageNumber)))
            .get()
          transaction.insert(findingSources).values({
            findingId: finding.id,
            documentId: source.documentId,
            pageId: page?.id ?? null,
            pageNumber: source.pageNumber,
            passage: source.passage,
            role: index === 0 ? 'primary' : 'comparison',
          }).run()
        })
      }
      return savedRun
    })

    const runFindings = db.select({ id: findings.id })
      .from(findings)
      .where(eq(findings.analysisRunId, completedRun.id))
      .all()
      .map(({ id }) => getFindingWithSources(id))
      .filter((finding): finding is NonNullable<typeof finding> => finding !== null)
    return NextResponse.json({ ...completedRun, synopsis, findings: runFindings }, { status: 201 })
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : 'Analysis failed.'
    const failedRun = db.update(analysisRuns)
      .set({ status: 'failed', error: error.slice(0, 500) })
      .where(eq(analysisRuns.id, run.id))
      .returning()
      .get()
    return NextResponse.json({ ...failedRun, synopsis: null }, { status: 201 })
  }
}