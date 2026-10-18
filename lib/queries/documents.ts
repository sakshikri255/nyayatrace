import fs from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { cases, documents, pages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

export type DocumentRow = {
  id: number
  caseId: number
  filename: string
  originalName: string
  fileType: 'pdf' | 'image' | 'scan'
  pageCount: number | null
  processingStatus: 'pending' | 'processing' | 'complete' | 'failed'
  processingError: string | null
  processedAt: string | null
  uploadDate: string | null
  filePath: string | null
  fileSize: number
  fileHash: string | null
  language: string | null
  createdAt: string | null
}

export type DocumentWithPages = DocumentRow & {
  pages: {
    id: number
    pageNumber: number
    extractedText: string | null
    quality: 'good' | 'poor' | 'unreadable'
  }[]
}

export function getDocumentsByCaseId(caseId: number): DocumentRow[] {
  return db
    .select()
    .from(documents)
    .where(eq(documents.caseId, caseId))
    .orderBy(documents.uploadDate)
    .all() as DocumentRow[]
}

export function getDocumentWithPages(id: number): DocumentWithPages | null {
  const doc = db.select().from(documents).where(eq(documents.id, id)).get()
  if (!doc) return null

  const docPages = db
    .select()
    .from(pages)
    .where(eq(pages.documentId, id))
    .orderBy(pages.pageNumber)
    .all()

  return {
    ...(doc as DocumentRow),
    pages: docPages as DocumentWithPages['pages'],
  }
}

export function deleteDocument(id: number): boolean {
  const doc = db.select().from(documents).where(eq(documents.id, id)).get()
  if (!doc) return false

  if (doc.filePath) {
    const fullPath = path.isAbsolute(doc.filePath)
      ? doc.filePath
      : path.join(process.cwd(), doc.filePath)
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath)
      } catch (err) {
        console.error('[deleteDocument] Failed to unlink file:', fullPath, err)
      }
    }
  }

  db.delete(documents).where(eq(documents.id, id)).run()

  // Update case updatedAt
  db.update(cases)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(cases.id, doc.caseId))
    .run()

  return true
}
