import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createCanvas } from '@napi-rs/canvas'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import Tesseract from 'tesseract.js'

GlobalWorkerOptions.workerSrc = pathToFileURL(
  path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs')
).href

/** Maximum number of PDF pages processed simultaneously within one document. */
const MAX_PARALLEL_PAGES = 10

export interface PageResult {
  pageNumber: number
  text: string
  quality: 'good' | 'poor' | 'unreadable'
  detectedLanguage?: string
}

export function detectScriptFromText(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return 'hin' // Devanagari (Hindi/Marathi)
  if (/[\u0980-\u09FF]/.test(text)) return 'ben' // Bengali
  if (/[\u0B80-\u0BFF]/.test(text)) return 'tam' // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) return 'tel' // Telugu
  if (/[\u0A80-\u0AFF]/.test(text)) return 'guj' // Gujarati
  return 'eng'
}

/**
 * Runs an array of async task factories in parallel, with at most `limit`
 * running concurrently. Results are returned in input order.
 */
async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let nextIndex = 0

  async function runSlot(): Promise<void> {
    while (nextIndex < tasks.length) {
      const index = nextIndex++
      results[index] = await tasks[index]()
    }
  }

  const slots = Math.min(limit, tasks.length)
  await Promise.all(Array.from({ length: slots }, runSlot))
  return results
}

async function createSafeTesseractWorker(lang: string): Promise<Tesseract.Worker | null> {
  const workerPath = path.join(
    process.cwd(),
    'node_modules',
    'tesseract.js',
    'src',
    'worker-script',
    'node',
    'index.js'
  )

  const langPath = path.join(process.cwd(), 'tessdata')

  const initWorker = async (targetLang: string) => {
    console.log(`[OCR] Initialising Tesseract worker for language: "${targetLang}"`)
    const workerPromise = Tesseract.createWorker(targetLang, 1, { workerPath, langPath, gzip: false })
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Tesseract worker timeout for ${targetLang}`)), 20000)
    )
    return await Promise.race([workerPromise, timeoutPromise])
  }

  try {
    const worker = await initWorker(lang)
    console.log(`[OCR] Worker ready for language: "${lang}"`)
    return worker
  } catch (error) {
    console.warn(`[OCR] Failed to initialize worker for "${lang}", falling back to "eng":`, error)
    if (lang !== 'eng') {
      try {
        const fallbackWorker = await initWorker('eng')
        console.log('[OCR] Fallback worker (eng) ready')
        return fallbackWorker
      } catch (fallbackError) {
        console.error('[OCR] Failed to initialize fallback worker:', fallbackError)
        return null
      }
    }
    return null
  }
}

/**
 * Processes a single PDF page: extracts embedded text, or falls back to Tesseract OCR
 * for scanned pages. Each call creates and destroys its own Tesseract worker so it is
 * safe to run concurrently with other `processPage` calls.
 */
async function processPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  pageNumber: number,
  totalPages: number,
  ocrLang: string,
): Promise<PageResult> {
  const pageStart = Date.now()

  const content = await page.getTextContent()
  let text: string = content.items
    .map((item: { str?: string }) => item.str ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  let detected = detectScriptFromText(text)
  let quality: PageResult['quality'] = text ? 'good' : 'unreadable'

  if (text) {
    console.log(
      `[OCR] Page ${pageNumber}/${totalPages}: embedded text extracted ` +
      `(${text.length} chars, script: ${detected}) in ${Date.now() - pageStart}ms`,
    )
    page.cleanup()
    return { pageNumber, text, quality, detectedLanguage: detected }
  }

  // Scanned page — run Tesseract with its own dedicated worker
  console.log(
    `[OCR] Page ${pageNumber}/${totalPages}: no embedded text — ` +
    `starting Tesseract OCR (lang: ${ocrLang})`,
  )
  let worker: Tesseract.Worker | null = null
  try {
    worker = await createSafeTesseractWorker(ocrLang)

    if (worker) {
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
      const context = canvas.getContext('2d')

      await page.render({
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise

      const imageBuffer = canvas.toBuffer('image/png')
      const ocrPromise = worker.recognize(imageBuffer)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Page OCR timeout')), 30000),
      )

      const result = await Promise.race([ocrPromise, timeoutPromise])
      text = result.data.text.trim()
      detected = detectScriptFromText(text)
      quality = text ? (result.data.confidence < 45 ? 'poor' : 'good') : 'unreadable'
      console.log(
        `[OCR] Page ${pageNumber}/${totalPages}: OCR done in ${Date.now() - pageStart}ms — ` +
        `confidence: ${result.data.confidence.toFixed(1)}%, chars: ${text.length}, ` +
        `script: ${detected}, quality: ${quality}`,
      )
    } else {
      console.warn(
        `[OCR] Page ${pageNumber}/${totalPages}: OCR worker unavailable — marking unreadable`,
      )
    }
  } catch (ocrError) {
    console.error(`[OCR] Error recognizing page ${pageNumber}:`, ocrError)
    quality = 'unreadable'
  } finally {
    if (worker) {
      try {
        await worker.terminate()
        console.log(`[OCR] Page ${pageNumber}/${totalPages}: worker terminated`)
      } catch {
        // ignore termination errors
      }
    }
    page.cleanup()
  }

  return { pageNumber, text, quality, detectedLanguage: detected }
}

export async function processDocument(filePath: string, language: string = 'eng'): Promise<PageResult[]> {
  const extension = path.extname(filePath).toLowerCase()
  const ocrLang = language && language !== 'auto' ? language : 'eng'
  const docStart = Date.now()

  console.log(`[OCR] ── processDocument started ───────────────────────────`)
  console.log(`[OCR] File: ${filePath}`)
  console.log(`[OCR] Type: ${extension}, OCR language: ${ocrLang}`)

  if (extension === '.pdf') {
    const buffer = await fs.readFile(filePath)
    console.log(`[OCR] PDF buffer read: ${(buffer.length / 1024).toFixed(1)} KB`)

    const loadingTask = getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      isEvalSupported: false,
    })
    const document = await loadingTask.promise
    console.log(
      `[OCR] PDF loaded → ${document.numPages} page(s), ` +
      `running up to ${Math.min(MAX_PARALLEL_PAGES, document.numPages)} in parallel`,
    )

    let pages: PageResult[] = []
    try {
      // Build one task factory per page; pdfjs-dist getPage() is safe to call concurrently
      const tasks = Array.from({ length: document.numPages }, (_, i) => async () => {
        const pageNum = i + 1
        const page = await document.getPage(pageNum)
        return processPage(page, pageNum, document.numPages, ocrLang)
      })

      pages = await runWithConcurrency(tasks, MAX_PARALLEL_PAGES)
      // Results already arrive in index order from runWithConcurrency, but sort to be safe
      pages.sort((a, b) => a.pageNumber - b.pageNumber)
    } finally {
      try {
        await document.destroy()
      } catch {
        // ignore destroy errors
      }
    }

    const readable = pages.filter((p) => p.text.trim().length > 0).length
    console.log(
      `[OCR] ── PDF processing complete in ${Date.now() - docStart}ms → ` +
      `${pages.length} page(s) processed in parallel (cap=${MAX_PARALLEL_PAGES}), ` +
      `${readable} readable, ${pages.length - readable} unreadable ──`,
    )
    return pages
  }

  if (['.jpg', '.jpeg', '.png'].includes(extension)) {
    console.log(`[OCR] Image file — running Tesseract OCR (lang: ${ocrLang})`)
    let worker: Tesseract.Worker | null = null
    try {
      worker = await createSafeTesseractWorker(ocrLang)
      if (!worker) {
        console.warn('[OCR] Worker unavailable — returning unreadable result')
        return [{ pageNumber: 1, text: '', quality: 'unreadable', detectedLanguage: 'eng' }]
      }
      const ocrPromise = worker.recognize(filePath)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Image OCR timeout')), 45000),
      )
      const result = await Promise.race([ocrPromise, timeoutPromise])
      const text = result.data.text.trim()
      const detected = detectScriptFromText(text)
      const quality = text ? (result.data.confidence < 45 ? 'poor' : 'good') : 'unreadable'
      console.log(
        `[OCR] ── Image OCR complete in ${Date.now() - docStart}ms → ` +
        `confidence: ${result.data.confidence.toFixed(1)}%, chars: ${text.length}, ` +
        `script: ${detected}, quality: ${quality} ──`,
      )
      return [{ pageNumber: 1, text, quality, detectedLanguage: detected }]
    } finally {
      if (worker) {
        try {
          await worker.terminate()
          console.log('[OCR] Tesseract worker terminated')
        } catch {
          // ignore
        }
      }
    }
  }

  throw new Error('Unsupported file type. Upload a PDF, JPEG, or PNG document.')
}
