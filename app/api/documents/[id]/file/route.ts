import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'
import { getDocumentWithPages } from '@/lib/queries/documents'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number.parseInt(params.id, 10)
  if (!Number.isSafeInteger(id) || id < 1) {
    console.warn(`[FILE-SERVE] Rejected: invalid document id param "${params.id}"`)
    return NextResponse.json({ error: 'Invalid document id.' }, { status: 400 })
  }

  console.log(`[FILE-SERVE] GET file for document #${id}`)
  const document = getDocumentWithPages(id)
  if (!document?.filePath) {
    console.warn(`[FILE-SERVE] Document #${id} not found or has no filePath`)
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
  }

  const uploadRoot = path.resolve(process.cwd(), 'uploads')
  const filePath = path.resolve(process.cwd(), document.filePath)
  const relativePath = path.relative(uploadRoot, filePath)

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    console.error(`[FILE-SERVE] Path traversal attempt for document #${id}: resolved path "${filePath}" escapes uploads root`)
    return NextResponse.json({ error: 'Document file is unavailable.' }, { status: 404 })
  }

  if (!fs.existsSync(filePath)) {
    console.warn(`[FILE-SERVE] Document #${id} DB record exists but file missing on disk: ${filePath}`)
    return NextResponse.json({ error: 'Document file is unavailable.' }, { status: 404 })
  }

  const contentType = document.fileType === 'pdf'
    ? 'application/pdf'
    : path.extname(filePath).toLowerCase() === '.png'
      ? 'image/png'
      : 'image/jpeg'

  const bytes = fs.readFileSync(filePath)
  console.log(`[FILE-SERVE] Serving document #${id} "${document.originalName}" — ${contentType}, ${(bytes.length / 1024).toFixed(1)} KB`)

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(document.originalName)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}