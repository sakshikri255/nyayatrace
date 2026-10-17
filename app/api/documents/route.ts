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
  try {
    const formData = await request.formData()
    const fileValue = formData.get('file')
    const file = fileValue instanceof File ? fileValue : null
    const caseIdStr = formData.get('caseId') as string | null

    if (!file || !caseIdStr) {
      return NextResponse.json(
        { error: 'file and caseId are required' },
        { status: 400 }
      )
    }

    const caseId = parseInt(caseIdStr, 10)
    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'Invalid caseId' }, { status: 400 })
    }

    if (!getCaseById(caseId)) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    if (file.size === 0 || file.size > 20 * 1024 * 1024) {
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
      return NextResponse.json(
        { error: 'Unsupported file type. Upload a PDF, JPEG, or PNG document.' },
        { status: 415 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const signatureValid =
      (fileType === 'pdf' && buffer.subarray(0, 5).toString() === '%PDF-') ||
      (ext === '.png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
      (['.jpg', '.jpeg'].includes(ext) && buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255])))

    if (!signatureValid) {
      return NextResponse.json(
        { error: 'The file content does not match its filename or is corrupt.' },
        { status: 400 }
      )
    }

    const fileHash = createHash('sha256').update(buffer).digest('hex')
    const duplicate = db
      .select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.caseId, caseId), eq(documents.fileHash, fileHash)))
      .get()

    if (duplicate) {
      return NextResponse.json(
        { error: 'This file has already been uploaded to this case.' },
        { status: 409 }
      )
    }

    const caseUploadsDir = path.join(process.cwd(), 'uploads', String(caseId))
    if (!fs.existsSync(caseUploadsDir)) {
      fs.mkdirSync(caseUploadsDir, { recursive: true })
    }

    const safeFilename = `${randomUUID()}${ext}`
    const filePath = path.join(caseUploadsDir, safeFilename)
    fs.writeFileSync(filePath, buffer)

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
      })
        .returning()
        .get()
    } catch (error) {
      fs.rmSync(filePath, { force: true })
      throw error
    }

    try {
      const pageResults = await processDocument(filePath)
      const hasReadableText = pageResults.some((page) => page.text.trim().length > 0)
      const processingError = hasReadableText
        ? null
        : fileType === 'pdf'
          ? 'No embedded text was found. Scanned PDF pages need OCR before their text can be analysed.'
          : 'OCR did not find readable text in this image.'

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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Document processing failed.'
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

    return NextResponse.json(savedDoc, { status: 201 })
  } catch (error) {
    console.error('[POST /api/documents]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
