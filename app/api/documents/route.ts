import { NextRequest, NextResponse } from 'next/server'
import { getDocumentsByCaseId } from '@/lib/queries/documents'
import { db } from '@/lib/db'
import { cases, documents, pages } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'
import { createHash, randomUUID } from 'crypto'
import { processDocument } from '@/lib/ocr'
import { getCaseById } from '@/lib/queries/cases'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const caseIdParam = searchParams.get('caseId')

    if (!caseIdParam) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 })
    }

    const caseId = parseInt(caseIdParam, 10)
    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'Invalid caseId' }, { status: 400 })
    }

    const data = getDocumentsByCaseId(caseId)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/documents]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const uploadStart = Date.now()
  console.log('[UPLOAD] ── New upload request received ──────────────────────')
  try {
    const formData = await request.formData()
    const fileValue = formData.get('file')
    const file = fileValue instanceof File ? fileValue : null
    const caseIdStr = formData.get('caseId') as string | null
    const docLanguage = (formData.get('language') as string | null) || 'eng'

    console.log(`[UPLOAD] Form fields → file: ${file ? `"${file.name}" (${file.size} bytes, type="${file.type}")` : 'missing'}, caseId: ${caseIdStr ?? 'missing'}, language: ${docLanguage}`)

    if (!file || !caseIdStr) {
      console.warn('[UPLOAD] Rejected: missing required fields (file or caseId)')
      return NextResponse.json(
        { error: 'file and caseId are required' },
        { status: 400 }
      )
    }

    const caseId = parseInt(caseIdStr, 10)
    if (isNaN(caseId)) {
      console.warn(`[UPLOAD] Rejected: caseId "${caseIdStr}" is not a valid integer`)
      return NextResponse.json({ error: 'Invalid caseId' }, { status: 400 })
    }

    if (!getCaseById(caseId)) {
      console.warn(`[UPLOAD] Rejected: case #${caseId} not found`)
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    if (file.size === 0 || file.size > 20 * 1024 * 1024) {
      console.warn(`[UPLOAD] Rejected: file size ${file.size} bytes is outside allowed range (1 byte – 20 MB)`)
      return NextResponse.json(
        { error: 'Files must be between 1 byte and 20 MB.' },
        { status: 413 }
      )
    }

    const ext = path.extname(file.name).toLowerCase()
    const fileType: 'pdf' | 'image' | null =
      ext === '.pdf'
        ? 'pdf'
        : ['.jpg', '.jpeg', '.png'].includes(ext)
          ? 'image'
          : null

    if (!fileType) {
      console.warn(`[UPLOAD] Rejected: unsupported extension "${ext}" for file "${file.name}"`)
      return NextResponse.json(
        { error: 'Unsupported file type. Upload a PDF, JPEG, or PNG document.' },
        { status: 415 }
      )
    }

    console.log(`[UPLOAD] Validation passed → type: ${fileType}, ext: ${ext}, size: ${(file.size / 1024).toFixed(1)} KB`)

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const signatureValid =
      (fileType === 'pdf' && buffer.subarray(0, 5).toString() === '%PDF-') ||
      (ext === '.png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
      (['.jpg', '.jpeg'].includes(ext) && buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255])))

    if (!signatureValid) {
      console.warn(`[UPLOAD] Rejected: magic-byte signature mismatch for "${file.name}" (declared ext: ${ext})`)
      return NextResponse.json(
        { error: 'The file content does not match its filename or is corrupt.' },
        { status: 400 }
      )
    }

    const fileHash = createHash('sha256').update(buffer).digest('hex')
    console.log(`[UPLOAD] SHA-256: ${fileHash}`)

    const duplicate = db
      .select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.caseId, caseId), eq(documents.fileHash, fileHash)))
      .get()

    if (duplicate) {
      console.warn(`[UPLOAD] Rejected: duplicate file (already stored as document #${duplicate.id} in case #${caseId})`)
      return NextResponse.json(
        { error: 'This file has already been uploaded to this case.' },
        { status: 409 }
      )
    }

    const caseUploadsDir = path.join(process.cwd(), 'uploads', String(caseId))
    if (!fs.existsSync(caseUploadsDir)) {
      console.log(`[UPLOAD] Creating uploads directory: ${caseUploadsDir}`)
      fs.mkdirSync(caseUploadsDir, { recursive: true })
    }

    const safeFilename = `${randomUUID()}${ext}`
    const filePath = path.join(caseUploadsDir, safeFilename)
    fs.writeFileSync(filePath, buffer)
    console.log(`[UPLOAD] File written to disk → ${filePath}`)

    let newDoc: typeof documents.$inferSelect
    try {
      newDoc = db
        .insert(documents)
        .values({
        caseId,
        filename: safeFilename,
        originalName: file.name,
        fileType,
        processingStatus: 'processing',
        filePath: path.relative(process.cwd(), filePath),
        fileSize: file.size,
        fileHash,
        language: docLanguage,
      })
        .returning()
        .get()
      console.log(`[UPLOAD] DB record created → document #${newDoc.id} for case #${caseId} (status: processing)`)
    } catch (error) {
      console.error(`[UPLOAD] DB insert failed — rolling back disk file: ${filePath}`, error)
      fs.rmSync(filePath, { force: true })
      throw error
    }

    try {
      console.log(`[UPLOAD] Starting document processing → doc #${newDoc.id}, language: ${docLanguage}`)
      const ocrStart = Date.now()
      const pageResults = await processDocument(filePath, docLanguage)
      const ocrMs = Date.now() - ocrStart

      const readablePages = pageResults.filter((p) => p.text.trim().length > 0)
      const hasReadableText = readablePages.length > 0
      const processingError = hasReadableText
        ? null
        : fileType === 'pdf'
          ? 'No embedded text was found. Scanned PDF pages need OCR before their text can be analysed.'
          : 'OCR did not find readable text in this image.'

      console.log(
        `[UPLOAD] Processing complete in ${ocrMs}ms → ` +
        `${pageResults.length} page(s) total, ` +
        `${readablePages.length} readable, ` +
        `status: ${hasReadableText ? 'complete' : 'failed'}` +
        (processingError ? ` — "${processingError}"` : '')
      )

      db.transaction((transaction) => {
        for (const pageResult of pageResults) {
          transaction.insert(pages).values({
            documentId: newDoc.id,
            pageNumber: pageResult.pageNumber,
            extractedText: pageResult.text,
            quality: pageResult.quality,
          }).run()
        }
        transaction
          .update(documents)
          .set({
            processingStatus: hasReadableText ? 'complete' : 'failed',
            processingError,
            processedAt: new Date().toISOString(),
            pageCount: pageResults.length,
          })
          .where(eq(documents.id, newDoc.id))
          .run()
        transaction.update(cases).set({ updatedAt: new Date().toISOString() }).where(eq(cases.id, caseId)).run()
      })
      console.log(`[UPLOAD] DB transaction committed → ${pageResults.length} page row(s) saved for doc #${newDoc.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Document processing failed.'
      console.error(`[UPLOAD] Processing error for doc #${newDoc.id}: ${message}`, error)
      db.update(documents)
        .set({
          processingStatus: 'failed',
          processingError: message.slice(0, 500),
          processedAt: new Date().toISOString(),
        })
        .where(eq(documents.id, newDoc.id))
        .run()
    }

    const savedDoc = db.select().from(documents).where(eq(documents.id, newDoc.id)).get()
    const totalMs = Date.now() - uploadStart
    console.log(`[UPLOAD] ── Request complete in ${totalMs}ms → doc #${(savedDoc as typeof documents.$inferSelect).id}, status: ${(savedDoc as typeof documents.$inferSelect).processingStatus} ──`)

    return NextResponse.json(savedDoc, { status: 201 })
  } catch (error) {
    console.error(`[UPLOAD] Unhandled error after ${Date.now() - uploadStart}ms:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
