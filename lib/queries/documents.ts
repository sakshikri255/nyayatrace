import fs from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { cases, documents, pages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Pre-compute base directory at module level for Turbopack compatibility
const BASE_DIR = process.cwd()

// Ensure uploads directory exists
const uploadsDir = path.join(BASE_DIR, 'uploads')
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

/**
 * Resolve a document's file path to an absolute path.
 * Separated into its own function so Turbopack does not flag
 * fs.existsSync / fs.unlinkSync with TP1004.
 */
function resolveDocPath(filePath: string): string {
  if (path.isAbsolute(filePath)) return filePath
  return path.join(BASE_DIR, filePath)
}

function tryDeleteFile(filePath: string): void {
  const fullPath = resolveDocPath(filePath)
  try {
    fs.unlinkSync(fullPath)
  } catch {
    // File may already have been removed — silently ignore
  }
}

export function deleteDocument(id: number): boolean {
  const doc = db.select().from(documents).where(eq(documents.id, id)).get()
  if (!doc) return false

  if (doc.filePath) {
    tryDeleteFile(doc.filePath)
  }

  db.delete(documents).where(eq(documents.id, id)).run()

  // Update case updatedAt
  db.update(cases)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(cases.id, doc.caseId))
    .run()

  return true
}

