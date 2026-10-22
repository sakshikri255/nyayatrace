import { and, desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { buildCaseChronology, buildCaseSynopsis } from '@/lib/analysis/synopsis'
import { generateAIAnalysis } from '@/lib/analysis/openai'
import { generateGeminiAnalysis } from '@/lib/analysis/gemini'
import { generateGroqAnalysis } from '@/lib/analysis/groq'
import { generateOpenRouterAnalysis } from '@/lib/analysis/openrouter'
import { generateOllamaAnalysis } from '@/lib/analysis/ollama'
import { db } from '@/lib/db'
import { analysisRuns, documents, findings, findingSources, pages } from '@/lib/db/schema'
import { getCaseById } from '@/lib/queries/cases'
import { getDocumentWithPages } from '@/lib/queries/documents'
import { getFindingWithSources } from '@/lib/queries/findings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
  const refreshedChronology = buildCaseChronology(docsWithPages)
  let fallbackKeyEntities: ReturnType<typeof buildCaseSynopsis>['keyEntities'] | null = null

  return NextResponse.json({
    current,
    aiProviderConfigured: Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OLLAMA_BASE_URL || process.env.OLLAMA_MODEL),
    aiProviders: {
      gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      groq: Boolean(process.env.GROQ_API_KEY),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
      ollama: Boolean(process.env.OLLAMA_BASE_URL || process.env.OLLAMA_MODEL),
    },
    latestRunId: latest?.id ?? null,
    runs: runs.map((run) => {
      const synopsis = parseSynopsis(run.result)
      if (synopsis) synopsis.chronology = refreshedChronology
      if (synopsis && (!synopsis.keyEntities || synopsis.keyEntities.length === 0)) {
        if (!fallbackKeyEntities) {
          fallbackKeyEntities = buildCaseSynopsis(caseRecord, docsWithPages).keyEntities ?? []
        }
        synopsis.keyEntities = fallbackKeyEntities
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
  const rawProvider: string = typeof body?.aiProvider === 'string' ? body.aiProvider : 'gemini'
  const aiProvider = (['gemini', 'openai', 'groq', 'openrouter', 'ollama'] as const).includes(rawProvider as never)
    ? (rawProvider as 'gemini' | 'openai' | 'groq' | 'openrouter' | 'ollama')
    : 'gemini'
  const language: string = typeof body?.language === 'string' && body.language.trim() ? body.language.trim() : 'English'
  const providerConfigured = aiProvider === 'gemini'
    ? Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
    : aiProvider === 'openai'
      ? Boolean(process.env.OPENAI_API_KEY)
      : aiProvider === 'groq'
        ? Boolean(process.env.GROQ_API_KEY)
        : aiProvider === 'ollama'
          ? Boolean(process.env.OLLAMA_BASE_URL || process.env.OLLAMA_MODEL)
          : Boolean(process.env.OPENROUTER_API_KEY)
  const providerName = aiProvider === 'gemini' ? 'Gemini' : aiProvider === 'openai' ? 'OpenAI' : aiProvider === 'groq' ? 'Groq' : aiProvider === 'ollama' ? 'Ollama' : 'OpenRouter'
  const providerEnvVar = aiProvider === 'gemini' ? 'GEMINI_API_KEY' : aiProvider === 'openai' ? 'OPENAI_API_KEY' : aiProvider === 'groq' ? 'GROQ_API_KEY' : aiProvider === 'ollama' ? 'OLLAMA_BASE_URL' : 'OPENROUTER_API_KEY'
  if (useAi && !providerConfigured) {
    return NextResponse.json({
      error: aiProvider === 'ollama'
        ? `Ollama is not configured. Set OLLAMA_BASE_URL=http://localhost:11434 and OLLAMA_MODEL=llama3 in your environment, run "ollama serve", and pull the model with "ollama pull llama3".`
        : `${providerName} is not configured. Set ${providerEnvVar} in the server environment and restart NyayaTrace.`,
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
          ? `gemini:${process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'}[lang:${language}]`
          : aiProvider === 'groq'
            ? `groq:${process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile'}[lang:${language}]`
            : aiProvider === 'openrouter'
              ? `openrouter:${process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini'}[lang:${language}]`
              : aiProvider === 'ollama'
                ? `ollama:${process.env.OLLAMA_MODEL?.trim() || 'llama3'}[lang:${language}]`
                : `openai:${process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'}[lang:${language}]`,
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
      synopsis.language = language
      synopsis.aiAnalysis = aiProvider === 'gemini'
        ? await generateGeminiAnalysis(loadedDocuments, language)
        : aiProvider === 'groq'
          ? await generateGroqAnalysis(loadedDocuments, language)
          : aiProvider === 'openrouter'
            ? await generateOpenRouterAnalysis(loadedDocuments, language)
            : aiProvider === 'ollama'
              ? await generateOllamaAnalysis(loadedDocuments, language)
              : await generateAIAnalysis(loadedDocuments, language)
      // When a non-English language is chosen, promote the AI's translated
      // executiveSummary into the main executiveSynopsis field so the primary
      // synopsis text is actually rendered in the chosen language.
      // Merge AI Metadata Header, Fact Matrix, and Verified Citations
      if (synopsis.aiAnalysis.metadataHeader) {
        synopsis.metadataHeader = {
          ...synopsis.metadataHeader,
          ...synopsis.aiAnalysis.metadataHeader,
          courtName: synopsis.aiAnalysis.metadataHeader.courtName || synopsis.metadataHeader?.courtName || null,
          caseNumber: synopsis.aiAnalysis.metadataHeader.caseNumber || synopsis.metadataHeader?.caseNumber || null,
          parties: synopsis.aiAnalysis.metadataHeader.parties || synopsis.metadataHeader?.parties || null,
          primaryActs: synopsis.aiAnalysis.metadataHeader.primaryActs || synopsis.metadataHeader?.primaryActs || null,
          keyDates: {
            ...synopsis.metadataHeader?.keyDates,
            ...synopsis.aiAnalysis.metadataHeader.keyDates,
          },
        }
      }
      if (synopsis.aiAnalysis.executiveSummary) {
        synopsis.executiveSynopsis = synopsis.aiAnalysis.executiveSummary
      }
      if (synopsis.aiAnalysis.factMatrix && synopsis.aiAnalysis.factMatrix.length > 0) {
        synopsis.factMatrix = [...(synopsis.factMatrix || []), ...synopsis.aiAnalysis.factMatrix]
      }
      if (synopsis.aiAnalysis.verifiedCitations && synopsis.aiAnalysis.verifiedCitations.length > 0) {
        // Back-propagate AI-generated narratives into the corresponding local facts so the
        // Facts & Timeline tab shows the rich AI passage, not the local regex story.
        for (const citation of synopsis.aiAnalysis.verifiedCitations) {
          const existing = synopsis.facts.find(
            (f) => f.documentId === citation.documentId && f.pageNumber === citation.pageNumber
          )
          if (existing) {
            // Replace the locally-generated caseStory with the AI narrative
            existing.caseStory = citation.passage
          } else {
            // Page not yet in facts (e.g. covered by AI but not local extraction) — add it
            synopsis.facts.push({
              documentId: citation.documentId,
              documentName: citation.documentName || 'Document.pdf',
              pageNumber: citation.pageNumber,
              passage: citation.passage,
              caseStory: citation.passage,
            })
          }
        }
      }
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