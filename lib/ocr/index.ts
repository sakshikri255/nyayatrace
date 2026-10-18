import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createCanvas } from '@napi-rs/canvas'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import Tesseract from 'tesseract.js'

GlobalWorkerOptions.workerSrc = pathToFileURL(
  path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs')
).href

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

  const initWorker = async (targetLang: string) => {
    const workerPromise = Tesseract.createWorker(targetLang, 1, { workerPath })
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Tesseract worker timeout for ${targetLang}`)), 20000)
    )
    return await Promise.race([workerPromise, timeoutPromise])
  }

  try {
    return await initWorker(lang)
  } catch (error) {
    console.warn(`[OCR] Failed to initialize worker for "${lang}", falling back to "eng":`, error)
    if (lang !== 'eng') {
      try {
        return await initWorker('eng')
      } catch (fallbackError) {
        console.error('[OCR] Failed to initialize fallback worker:', fallbackError)
        return null
      }
    }
    return null
  }
}

export async function processDocument(filePath: string, language: string = 'eng'): Promise<PageResult[]> {
  const extension = path.extname(filePath).toLowerCase()
  const ocrLang = language && language !== 'auto' ? language : 'eng'

  if (extension === '.pdf') {
    const buffer = await fs.readFile(filePath)
    const pages: PageResult[] = []
    const loadingTask = getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      isEvalSupported: false,
    })
    const document = await loadingTask.promise
    let ocrWorker: Tesseract.Worker | null = null

    try {
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber)
        const content = await page.getTextContent()
        let text = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()

        let detected = detectScriptFromText(text)
        let quality: PageResult['quality'] = text ? 'good' : 'unreadable'

        // Scanned page without digital text - run OCR
        if (!text) {
          try {
            if (!ocrWorker) {
              ocrWorker = await createSafeTesseractWorker(ocrLang)
            }

            if (ocrWorker) {
              const viewport = page.getViewport({ scale: 1.5 })
              const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
              const context = canvas.getContext('2d')

              await page.render({
                canvasContext: context as unknown as CanvasRenderingContext2D,
                viewport,
              }).promise

              const imageBuffer = canvas.toBuffer('image/png')
              const ocrPromise = ocrWorker.recognize(imageBuffer)
              const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Page OCR timeout')), 30000)
              )

              const result = await Promise.race([ocrPromise, timeoutPromise])
              text = result.data.text.trim()
              detected = detectScriptFromText(text)
              quality = text ? (result.data.confidence < 45 ? 'poor' : 'good') : 'unreadable'
            }
          } catch (ocrError) {
            console.error(`[OCR] Error recognizing page ${pageNumber}:`, ocrError)
            quality = 'unreadable'
          }
        }

        pages.push({ pageNumber, text, quality, detectedLanguage: detected })
        page.cleanup()
      }
    } finally {
      if (ocrWorker) {
        try {
          await ocrWorker.terminate()
        } catch {
          // ignore termination errors
        }
      }
      try {
        await document.destroy()
      } catch {
        // ignore destroy errors
      }
    }
    return pages
  }

  if (['.jpg', '.jpeg', '.png'].includes(extension)) {
    let worker: Tesseract.Worker | null = null
    try {
      worker = await createSafeTesseractWorker(ocrLang)
      if (!worker) {
        return [{ pageNumber: 1, text: '', quality: 'unreadable', detectedLanguage: 'eng' }]
      }
      const ocrPromise = worker.recognize(filePath)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Image OCR timeout')), 45000)
      )
      const result = await Promise.race([ocrPromise, timeoutPromise])
      const text = result.data.text.trim()
      const detected = detectScriptFromText(text)
      const quality = text ? (result.data.confidence < 45 ? 'poor' : 'good') : 'unreadable'
      return [{ pageNumber: 1, text, quality, detectedLanguage: detected }]
    } finally {
      if (worker) {
        try {
          await worker.terminate()
        } catch {
          // ignore
        }
      }
    }
  }

  throw new Error('Unsupported file type. Upload a PDF, JPEG, or PNG document.')
}
