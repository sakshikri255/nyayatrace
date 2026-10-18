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

        if (!text) {
          if (!ocrWorker) {
            try {
              ocrWorker = await Tesseract.createWorker(ocrLang)
            } catch {
              ocrWorker = await Tesseract.createWorker('eng')
            }
          }
          const viewport = page.getViewport({ scale: 2 })
          const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
          const context = canvas.getContext('2d')
          await page.render({
            canvasContext: context as unknown as CanvasRenderingContext2D,
            viewport,
          }).promise
          const result = await ocrWorker.recognize(canvas.toBuffer('image/png'))
          text = result.data.text.trim()
          detected = detectScriptFromText(text)
          quality = text ? (result.data.confidence < 45 ? 'poor' : 'good') : 'unreadable'
        }

        pages.push({ pageNumber, text, quality, detectedLanguage: detected })
        page.cleanup()
      }
    } finally {
      if (ocrWorker) await ocrWorker.terminate()
      await document.destroy()
    }
    return pages
  }

  if (['.jpg', '.jpeg', '.png'].includes(extension)) {
    let worker: Tesseract.Worker
    try {
      worker = await Tesseract.createWorker(ocrLang)
    } catch {
      worker = await Tesseract.createWorker('eng')
    }
    try {
      const result = await worker.recognize(filePath)
      const text = result.data.text.trim()
      const detected = detectScriptFromText(text)
      const quality = text ? (result.data.confidence < 45 ? 'poor' : 'good') : 'unreadable'
      return [{ pageNumber: 1, text, quality, detectedLanguage: detected }]
    } finally {
      await worker.terminate()
    }
  }

  throw new Error('Unsupported file type. Upload a PDF, JPEG, or PNG document.')
}
