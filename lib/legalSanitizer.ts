export interface ProcessedLegalRecord {
  id: string
  text: string
  rawText: string
  page: number
  fileName: string
  category: 'JURISDICTION' | 'COMPENSATION' | 'PROCEDURE' | 'LIMITATION' | 'GENERAL'
  categoryLabel: string
  categoryBadgeColor: string
  severityBorder: string
}

/**
 * Deterministic OCR cleanup used before displaying extracted court text.
 */
export function cleanOcrRegex(rawText: string | null | undefined): string {
  if (!rawText) return ''

  return rawText
    .replace(/^(Fz Ne \d+ : = In, AE|Fz Ne = In, AE|Vic|fh\\iie|apex|he 2s|In, NEE|\s)+/gi, '')
    .replace(/\bA\s*©\s*\\?\s*8\s*siz\b/gi, ' ')
    .replace(/©|\\8siz\b/gi, ' ')
    .replace(/\bes\s+F\s+authority\b|\bi\s+qryma\?l\b|\\s\s+g\s*\(\s*1\s*\)|\bBH\s+3\s+hypothesis\b/gi, ' ')
    .replace(/\bBiel\s*\d+(?:\s+\d+)?\b|fe\s+TWhetafo|\[hem\s*\d+\]|\|\s*=+|\bz\s+Ee\b|eeeneee\s*-\s*0\.PS|\bges\s*3g\s*5\s*\+/gi, ' ')
    .replace(/\b12024\s+(?=Affidavit\b)/gi, '')
    .replace(/(Contr\s*\d+\s*[\=\+\:\-]\s*[\£\$]|fet\s*[\:\=]\s*[A-Z][\:\=]|oo\s*oF|your\=o\s*\d+\s*<|set\s*[\=\+\:\-]\s*\d+\s*[\=\+\:\-]|ges\s*\d+g\s*\d+\s*[\£\$]\s*\+|seneaeeQ\.P|ora\s*eC\s*\d+\s*[\:\.]|wnnmeme\=e|\bg\s*z\b)/gi, '')
    .replace(/Fz\s+Ne\s+(?:\d+\s*:\s*=\s*|=\s*)In,\s*AE/gi, '')
    .replace(/\b[A-Za-z]{1,2}\s*[\=\+\:\-]{1,2}\s*[\=\+\:\-]?/g, '')
    .replace(/(\s[\=\+\:\-\£]{1,3}\s)/g, ' ')
    .replace(/[|=]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function categorizeLegalText(text: string) {
  const lower = cleanOcrRegex(text).toLowerCase()

  if (/six[\s-]+men[\s-]+committee|cala|without jurisdiction|failed to consider directive|lacks authority/i.test(lower)) {
    return {
      category: 'JURISDICTION' as const,
      categoryLabel: 'Jurisdiction & Authority',
      categoryBadgeColor: 'bg-red-50 text-red-700 border-red-200',
      severityBorder: 'border-l-4 border-l-red-500',
    }
  }
  if (/compensation|sale deed|nature of land|commercial in nature|valuation|enhanced/i.test(lower)) {
    return {
      category: 'COMPENSATION' as const,
      categoryLabel: 'Compensation & Valuation',
      categoryBadgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      severityBorder: 'border-l-4 border-l-amber-500',
    }
  }
  if (/exhibited|failed to furnish|notification|procedural|c\.p\.c|gazette/i.test(lower)) {
    return {
      category: 'PROCEDURE' as const,
      categoryLabel: 'Procedural Non-Compliance',
      categoryBadgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      severityBorder: 'border-l-4 border-l-blue-500',
    }
  }
  if (/limitation|received and served|statutory limitation|service of award/i.test(lower)) {
    return {
      category: 'LIMITATION' as const,
      categoryLabel: 'Limitation & Service',
      categoryBadgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      severityBorder: 'border-l-4 border-l-emerald-500',
    }
  }

  return {
    category: 'GENERAL' as const,
    categoryLabel: 'General Record',
    categoryBadgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
    severityBorder: 'border-l-4 border-l-slate-300',
  }
}

export function extractInstantLegalBrief(text: string): string {
  const cleanedText = cleanOcrRegex(text)
  if (!cleanedText) return ''

  const lower = cleanedText.toLowerCase()
  if (/six[\s-]+men[\s-]+committee|cala/.test(lower)) {
    return 'The record raises a jurisdictional issue concerning the arbitrator’s authority and CALA requirements.'
  }
  if (/compensation|sale deed|valuation|commercial nature/.test(lower)) {
    return 'The record challenges the land valuation or compensation basis.'
  }
  if (/failed to furnish|exhibited documents|natural justice|rebuttal evidence|procedural/.test(lower)) {
    return 'The record raises a procedural fairness or disclosure issue.'
  }
  if (/limitation|received and served|service of award/.test(lower)) {
    return 'The record concerns the award’s service date or the limitation period for challenge.'
  }

  const firstSentence = cleanedText.match(/[^.!?]+[.!?](?:\s|$)/)?.[0]?.trim()
  return firstSentence || cleanedText
}

export interface ExtractedLegalDate {
  date: string
  isoDate: string
  index: number
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
}

function toIsoDate(day: number, month: number, year: number): string | null {
  const fullYear = year < 100 ? (year >= 50 ? 1900 + year : 2000 + year) : year
  const date = new Date(Date.UTC(fullYear, month, day))
  if (
    date.getUTCFullYear() !== fullYear ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) return null
  return date.toISOString().slice(0, 10)
}

function normalizeLegalDate(value: string): string | null {
  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) return toIsoDate(Number(iso[3]), Number(iso[2]) - 1, Number(iso[1]))

  const numeric = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/)
  if (numeric) {
    return toIsoDate(Number(numeric[1]), Number(numeric[2]) - 1, Number(numeric[3]))
  }

  const monthFirst = value.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/)
  const dayFirst = value.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/)
  const named = monthFirst ?? dayFirst
  if (!named) return null

  const monthName = monthFirst ? named[1].toLowerCase() : named[2].toLowerCase()
  const month = MONTHS[monthName]
  if (month === undefined) return null
  const day = Number(monthFirst ? named[2] : named[1])
  return toIsoDate(day, month, Number(named[3]))
}

const LEGAL_DATE_PATTERN =
  /\b\d{4}-\d{1,2}-\d{1,2}\b|\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/gi

export function extractLegalDates(text: string): ExtractedLegalDate[] {
  const dates = new Map<string, ExtractedLegalDate>()
  LEGAL_DATE_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = LEGAL_DATE_PATTERN.exec(text)) !== null) {
    const isoDate = normalizeLegalDate(match[0])
    if (isoDate && !dates.has(isoDate)) {
      dates.set(isoDate, { date: match[0], isoDate, index: match.index })
    }
  }

  return Array.from(dates.values()).sort((first, second) => first.isoDate.localeCompare(second.isoDate))
}

export function sortAndDedupeLegalDates<T extends { date: string }>(events: T[]): T[] {
  const unique = new Map<string, T>()
  for (const event of events) {
    const normalized = normalizeLegalDate(event.date)
    if (normalized && !unique.has(normalized)) unique.set(normalized, event)
  }
  return Array.from(unique.entries())
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([, event]) => event)
}

export type LegalCategory = ProcessedLegalRecord['category']
export const cleanOcrText = cleanOcrRegex
