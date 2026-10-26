export interface TechnicalDossierItem {
  label: string
  value: string
}

export interface StoryAndDossier {
  /** Concise plain-English narrative of what happened on this page */
  caseStory: string
  /** Structured list of technical legal metadata extracted from the page */
  technicalDossier: TechnicalDossierItem[]
}

export interface ProcessedLegalRecord {
  id: string
  text: string
  rawText: string
  page: number
  fileName: string
  category: 'JURISDICTION' | 'COMPENSATION' | 'PROCEDURE' | 'LIMITATION' | 'MERITS' | 'GENERAL'
  categoryLabel: string
  categoryBadgeColor?: string
  severityBorder: string
}

/**
 * Common legal abbreviations to protect from premature sentence splitting.
 */
const ABBREVIATIONS = [
  'no', 'nos', 'op', 'o.p', 'sec', 'secs', 'u/s', 'v', 'vs', 'cpc', 'c.p.c',
  'crpc', 'cr.p.c', 'sl', 'dt', 'hon\'ble', 'govt', 'adv', 'co', 'ltd', 'pvt',
  'art', 'para', 'cl', 'i.e', 'e.g', 'etc', 'annex', 'ref', 'distt', 'shri',
  's/o', 'w/o', 'd/o', 'r/o', 'p.s', 'ps', 'fir', 'f.i.r'
]

function protectPeriods(text: string): string {
  let protectedText = text
  // Protect dates like 15.02.2023, 30.03.2022
  protectedText = protectedText.replace(/\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/g, '$1\uE001$2\uE001$3')
  // Protect decimals like 0.14, 2.5
  protectedText = protectedText.replace(/\b(\d+)\.(\d+)\b/g, '$1\uE001$2')
  // Protect common abbreviations preserving original casing
  for (const abbr of ABBREVIATIONS) {
    const regex = new RegExp(`(\\b|(?<=\\W))${abbr.replace(/\./g, '\\.')}\\.`, 'gi')
    protectedText = protectedText.replace(regex, (match) => match.slice(0, -1).replace(/\./g, '\uE002') + '\uE002')
  }
  return protectedText
}

function restorePeriods(text: string): string {
  return text.replace(/\uE001/g, '.').replace(/\uE002/g, '.')
}

/**
 * Splits legal text into coherent sentences without tearing apart dates, decimals,
 * and standard legal abbreviations (e.g. "Memo No. 75", "O.P.", "Sec. 34").
 */
export function splitLegalSentences(text: string): string[] {
  if (!text) return []
  const protectedText = protectPeriods(text)
  const rawParts = protectedText.split(/(?<=[.!?])\s+|\n{2,}/)
  const sentences: string[] = []

  for (const part of rawParts) {
    const restored = restorePeriods(part).replace(/\s+/g, ' ').trim()
    if (restored.length < 20) continue
    const letters = (restored.match(/[a-zA-Z]/g) || []).length
    if (letters < 12) continue
    // Skip header and index artifacts
    if (/^(page|sl\.?\s*no|index|date|s\.?\s*no\.?)\b/i.test(restored)) continue
    sentences.push(restored)
  }

  return sentences
}

/**
 * Detects whether extracted or OCR text is garbled, degraded, or unreadable noise.
 */
export function isCorruptedText(text: string | null | undefined): boolean {
  if (!text || typeof text !== 'string') return true
  const trimmed = text.trim()
  if (trimmed.length < 25) return true

  // Standard failure messages are recognized as fallback states, not valid content
  if (
    trimmed === 'Text extraction requires review' ||
    trimmed === 'Unable to generate a reliable summary' ||
    trimmed === 'This document page contains legal records that could not be automatically classified.'
  ) {
    return true
  }

  const letters = (trimmed.match(/[a-zA-Z]/g) || []).length
  const words = trimmed.match(/[a-zA-Z]{2,}/g) || []
  if (letters < 15 || words.length < 3) return true

  // Excessive symbol noise check (stray slashes, backslashes, colons, brackets, equals)
  const symbols = (trimmed.match(/[\\\/~#$^*+=|<>\[\]{}¥©®]/g) || []).length
  if (symbols / trimmed.length > 0.12) return true

  // Single-letter token ratio check (e.g. "i Ail \ 2 E action ...")
  const tokens = trimmed.split(/\s+/).filter(Boolean)
  const singleCharTokens = tokens.filter(
    (t) => t.length === 1 && !/^[aAiI0-9]$/.test(t)
  )
  if (tokens.length > 0 && singleCharTokens.length / tokens.length > 0.25) return true

  // Short tokens ratio check (excessive 1-2 character fragments like "Caw BE RR a ce rs. = Co x 05 3")
  const shortTokens = tokens.filter((t) => t.length <= 2 && !/^(in|on|at|by|of|to|is|as|or|an|no|op|vs)$/i.test(t))
  if (tokens.length >= 8 && shortTokens.length / tokens.length > 0.45) return true

  // Check for presence of recognizable English or Indian legal vocabulary
  const recognizableWords = trimmed.match(
    /\b(court|judge|order|act|section|case|party|parties|applicant|respondent|arbitrat|tribunal|award|memo|letter|notice|hearing|petition|appeal|cpc|crpc|fir|bail|land|date|dated|authority|highway|national|collector|commissioner|annexure|affidavit|verification|compensation|amount|copy|vide|herewith|statement|records?|proceedings?|matter|application|provisions?|natural\s+justice|grounds?|notification|gazette|division)\b/gi
  ) || []
  if (words.length > 8 && recognizableWords.length === 0) return true

  return false
}

/**
 * Deterministic OCR cleanup used before displaying extracted court text.
 * Strips residual OCR line numbers, broken tokens, marginal artifacts, and noise.
 */
export function cleanOcrRegex(rawText: string | null | undefined): string {
  if (!rawText) return ''

  let text = rawText
    // Remove control characters except standard whitespace
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '')
    // Normalize unicode spaces and hyphens
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    .replace(/[\u2010-\u2015]/g, '-')
    // Strip currency/special OCR symbols that never appear in Indian legal text
    .replace(/[£€§~©®°±×÷¿¡¦¨¬¯²³¹º¼½¾¥]/g, ' ')
    // Remove broken OCR single-character spaced sequences e.g. "a r T H E r e v i v i n n n s"
    .replace(/\b([A-Za-z])\s+(?:[A-Za-z]\s+){3,}[A-Za-z]\b/g, ' ')
    // Re-join hyphenated line breaks (e.g., "compen-\nsation" -> "compensation")
    .replace(/(\b[A-Za-z]+)-\s*\r?\n\s*([A-Za-z]+\b)/g, '$1$2')
    // Known OCR artifacts and noise patterns
    .replace(/^(?:Fz\s*Ne\s*(?:\d+\s*:\s*=\s*|=\s*)In,\s*AE|Vic|fh\\iie|apex|he\s*2s|In,\s*NEE|\s)+/gi, '')
    .replace(/\bA\s*©\s*\\?\s*8\s*siz\b/gi, ' ')
    .replace(/©|\\8siz\b/gi, ' ')
    .replace(/\bes\s+F\s+authority\b|\bi\s+qryma\?l\b|\\s\s+g\s*\(\s*1\s*\)|\bBH\s+3\s+hypothesis\b/gi, ' ')
    .replace(/\bBiel\s*\d+(?:\s+\d+)?\b|fe\s+TWhetafo|\[hem\s*\d+\]|\|\s*=+突|\bz\s+Ee\b|eeeneee\s*-\s*0\.PS|\bges\s*3g\s*5\s*\+/gi, ' ')
    .replace(/\b12024\s+(?=Affidavit\b)/gi, '')
    .replace(/(?:Contr\s*\d+\s*[\=\+\:\-]\s*[\£\$]|fet\s*[\:\=]\s*[A-Z][\:\=]|oo\s*oF|your\=o\s*\d+\s*<|set\s*[\=\+\:\-]\s*\d+\s*[\=\+\:\-]|ges\s*\d+g\s*\d+\s*[\£\$]\s*\+|seneaeeQ\.P|ora\s*eC\s*\d+\s*[\:\.]|wnnmeme\=e|\bg\s*z\b)/gi, '')
    .replace(/Fz\s+Ne\s+(?:\d+\s*:\s*=\s*|=\s*)In,\s*AE/gi, '')
    // Strip Court running header stamps (e.g. "Patna High Court CR. MISC. No. 3303 of 2022 dt.12-01-2026 2 / 15")
    .replace(/(?:[A-Za-z\s]+High\s+Court[^\n]+?)?dt\.[^\n]+?\d+\s*\/\s*\d+\s*/gi, ' ')
    // Strip standalone OCR line numbers embedded on lines
    .replace(/(?:^|\r?\n)\s*\d{1,3}\s*[\.\:\-\)]\s*(?=[A-Za-z])/g, '\n')
    .replace(/(?:^|\r?\n)\s*\[\d{1,3}\]\s*(?=[A-Za-z])/g, '\n')
    // Strip only isolated 1-2 char tokens that are pure operator noise
    .replace(/(?<!\w)[A-Za-z]{1,2}\s*[\=\+]{1,2}\s*[\=\+]?(?!\w)/g, '')
    .replace(/(\s[\=\+\£]{1,3}\s)/g, ' ')
    // Clean orphan pipe and equal signs
    .replace(/(?<!\w)[|=](?!\w)/g, ' ')

  // Line-by-line marginal noise cleanup
  const lines = text.split(/\r?\n/)
  const cleanLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    if (!line) continue

    // Skip marginal junk lines (1-4 chars, mostly symbols or isolated letters)
    if (line.length <= 4 && !/^\d+[\.\)]?$/.test(line)) continue
    if (/^[\\\/~#$^*+=|<>_.,:;\s\-\d\(\)\[\]]{1,6}$/.test(line)) continue
    if (/^[a-zA-Z]{1,2}\s+[a-zA-Z0-9\W]{1,4}$/.test(line)) continue
    if (/^\\[\s\d\w\W]{1,6}$/.test(line)) continue
    if (/^[\|\:\.\,\-\_]{1,3}\s*[a-zA-Z0-9\W]{1,5}$/.test(line) && line.length < 8) continue

    // Strip known margin artifacts at start of line
    if (/^(?:i Ail|\\ 2 E|B : :|S20|Jes ge\\l &?|ge\\l &?|Bos|gz|oie 2s|¥ 6\.|\. 8|ee ems)/i.test(line)) {
      line = line.replace(/^(?:i Ail|\\ 2 E|B : :|S20|Jes ge\\l &?|ge\\l &?|Bos|gz|oie 2s|¥ 6\.|\. 8|ee ems)\s*/i, '').trim()
      if (!line) continue
    }

    // Clean inline noise on the line
    line = line
      .replace(/^[\\\/\|\:\.\,\-\_\s]+/, '')
      .replace(/[\\\/\|\:\.\,\-\_\s]+$/, '')
      .replace(/\s+/g, ' ')

    if (line.length > 0) {
      cleanLines.push(line)
    }
  }

  text = cleanLines.join('\n')

  // Eliminate residual leading noise
  text = text
    .replace(/^(?:\s*(?:In\.|0\.|1\.|2\.|3\.|4\.|5\.|6\.|7\.|8\.|9\.|No\.|Pg\.?|Page\s*\d+|Item\s*\d+|[0-9]+[\.\:\-\)]|\[[0-9]+\])\s*)+/gi, '')
    .replace(/^[\s\.\:\-\,\;\|\—\_]+/g, '')
    .trim()

  return text
}

export function categorizeLegalText(text: string) {
  const lower = cleanOcrRegex(text).toLowerCase()

  if (
    /six[\s-]+men[\s-]+committee|cala|competent authority|without jurisdiction|lacks jurisdiction|lacks authority|arbitral tribunal|coram|maintainability|jurisdiction|tribunal|ultra vires/i.test(
      lower
    )
  ) {
    return {
      category: 'JURISDICTION' as const,
      categoryLabel: 'Jurisdiction',
      badgeStyle: {
        backgroundColor: 'var(--badge-jurisdiction-bg)',
        color: 'var(--badge-jurisdiction-text)',
        borderColor: 'var(--badge-jurisdiction-border)',
      },
      severityBorder: 'border-l-4 border-l-red-500',
    }
  }

  if (
    /compensation|sale deed|nature of land|commercial in nature|commercial classification|valuation|enhanced|award amount|solatium|circle rate|damages|quantum/i.test(
      lower
    )
  ) {
    return {
      category: 'COMPENSATION' as const,
      categoryLabel: 'Compensation',
      badgeStyle: {
        backgroundColor: 'var(--badge-compensation-bg)',
        color: 'var(--badge-compensation-text)',
        borderColor: 'var(--badge-compensation-border)',
      },
      severityBorder: 'border-l-4 border-l-amber-500',
    }
  }

  if (
    /exhibited|failed to furnish|notification|procedural|c\.p\.c|cr\.p\.c|bns|bnss|gazette|natural justice|opportunity of hearing|affidavit|summons|service of notice/i.test(
      lower
    )
  ) {
    return {
      category: 'PROCEDURE' as const,
      categoryLabel: 'Procedural',
      badgeStyle: {
        backgroundColor: 'var(--badge-procedural-bg)',
        color: 'var(--badge-procedural-text)',
        borderColor: 'var(--badge-procedural-border)',
      },
      severityBorder: 'border-l-4 border-l-blue-500',
    }
  }

  if (
    /limitation|received and served|statutory limitation|service of award|section 34\(3\)|delay|condonation of delay|prescribed period/i.test(
      lower
    )
  ) {
    return {
      category: 'LIMITATION' as const,
      categoryLabel: 'Limitation',
      badgeStyle: {
        backgroundColor: 'var(--badge-limitation-bg)',
        color: 'var(--badge-limitation-text)',
        borderColor: 'var(--badge-limitation-border)',
      },
      severityBorder: 'border-l-4 border-l-emerald-500',
    }
  }

  if (
    /merit|grounds|contention|breach|agreement|clause|penal|offence|offense|allegation|evidence|cross-examination|liability/i.test(
      lower
    )
  ) {
    return {
      category: 'MERITS' as const,
      categoryLabel: 'Merits',
      badgeStyle: {
        backgroundColor: 'var(--badge-merits-bg)',
        color: 'var(--badge-merits-text)',
        borderColor: 'var(--badge-merits-border)',
      },
      severityBorder: 'border-l-4 border-l-purple-500',
    }
  }

  return {
    category: 'GENERAL' as const,
    categoryLabel: 'General',
    badgeStyle: {
      backgroundColor: 'var(--badge-general-bg)',
      color: 'var(--badge-general-text)',
      borderColor: 'var(--badge-general-border)',
    },
    severityBorder: 'border-l-4 border-l-slate-400',
  }
}

/**
 * Converts raw OCR text into a single clean, active-voice legal sentence (≤ 25 words).
 * Used as the display brief inside each zig-zag timeline card.
 */
export function extractInstantLegalBrief(text: string): string {
  const cleanedText = cleanOcrRegex(text)
  if (!cleanedText || isCorruptedText(cleanedText)) return 'Text extraction requires review'

  const lower = cleanedText.toLowerCase()

  // ── Pattern-driven active-voice summaries ──────────────────────────
  if (/six[\s-]+men[\s-]+committee|cala\b/.test(lower)) {
    return 'The petitioner challenges the arbitrator\'s authority, arguing the dispute required a Six-Men Committee under CALA.'
  }
  if (/without jurisdiction|lacks jurisdiction|ultra vires/.test(lower)) {
    return 'The petitioner contends the arbitral tribunal acted without jurisdiction and exceeded its statutory authority.'
  }
  if (/section\s*34.*arbitration|arbitration.*section\s*34/i.test(lower)) {
    return 'The petitioner seeks to set aside the arbitral award under Section 34 of the Arbitration and Conciliation Act, 1996.'
  }
  if (/section\s*3g.*national\s*highway|national\s*highway.*section\s*3g/i.test(lower)) {
    return 'The claim invokes Section 3G of the National Highways Act regarding land acquisition compensation.'
  }
  if (/commercial.*land|nature.*land.*commercial|sale\s*deed.*circle\s*rate/.test(lower)) {
    return 'The respondent disputes the commercial classification of the acquired land used to determine compensation.'
  }
  if (/compensation|valuation|solatium|circle\s*rate|damages/.test(lower)) {
    return 'The petitioner challenges the quantum of compensation and the valuation methodology applied by the arbitrator.'
  }
  if (/failed\s*to\s*furnish|natural\s*justice|opportunity.*heard|rebuttal\s*evidence/.test(lower)) {
    return 'The petitioner alleges a breach of natural justice, as the respondent was denied an opportunity to rebut evidence.'
  }
  if (/memo\s*no\.?|letter\s*no\.?|served\s+the\s+award|allott?ement\s+amount/i.test(lower)) {
    return 'The competent authority served the arbitral award for allotment of the awarded compensation amount.'
  }
  if (/affidavit\s*&\s*verification|oath\s+commissioner/i.test(lower)) {
    return 'Affidavit and verification executed before the Oath Commissioner affirming the petition statements.'
  }
  if (/exhibited|exhibit\s*[a-z]?\d|c\.p\.c\.|cr\.p\.c\.|procedural/.test(lower)) {
    return 'The record documents a procedural step taken in compliance with the applicable civil or criminal procedure code.'
  }
  if (/limitation|service\s*of\s*award|received\s*and\s*served|condonation\s*of\s*delay/.test(lower)) {
    return 'The respondent raises a limitation bar, asserting the petition was filed beyond the prescribed statutory period.'
  }
  if (/fir|first\s*information\s*report|crime\s*no\.?/.test(lower)) {
    return 'The FIR registers the initial criminal complaint and establishes the jurisdictional basis for the investigation.'
  }
  if (/remand|police\s*custody|judicial\s*custody/.test(lower)) {
    return 'The court authorized remand custody of the accused pending completion of the police investigation.'
  }
  if (/bail|anticipatory\s*bail|statutory\s*bail/.test(lower)) {
    return 'The applicant seeks bail, relying on statutory entitlement or personal liberty grounds under the applicable provision.'
  }
  if (/chargesheet|charge\s*sheet|challan/.test(lower)) {
    return 'The prosecution filed the chargesheet formally placing the accused before the court for trial.'
  }
  if (/witness|deponent/.test(lower)) {
    return 'The witness statement records key testimony submitted to support the party\'s case before the court.'
  }

  // ── Fallback: extract the first clean sentence of ≥ 25 chars, trim to ≤ 25 words ──
  const sentences = splitLegalSentences(cleanedText)
  for (const s of sentences) {
    if (s.length >= 25 && !isCorruptedText(s)) {
      const words = s.split(/\s+/)
      return words.length > 25
        ? words.slice(0, 25).join(' ').replace(/[,;:]+$/, '') + '.'
        : s
    }
  }

  return 'Text extraction requires review'
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

/**
 * Derives a plain-English `caseStory` and a structured `technicalDossier` from
 * a single OCR-cleaned page of legal text.  Used by the local (non-LLM) path so
 * Section 5 cards always show readable content rather than raw OCR gibberish.
 */
/**
 * Scores a sentence by how much unique legal information it carries.
 * Higher = more specific and worth showing.
 */
export function scoreSentence(sentence: string): number {
  let score = 0
  // Named proper nouns (capitalised words not at sentence start)
  const properNouns = sentence.match(/(?<!\.\s)\b[A-Z][a-z]{2,}/g) ?? []
  score += properNouns.length * 2
  // Numbers, amounts, dates
  if (/\d/.test(sentence)) score += 3
  // Legal keywords
  if (/section|act|court|petition|arbitrat|fir|bail|compensation|award|order|judgment|charge|accused|witness/i.test(sentence)) score += 4
  // Specific identifiers (plot, khata, memo, NH, case no.)
  if (/plot|khasra|khata|memo|letter\s*no|NH[-\s]?\d|case\s*no/i.test(sentence)) score += 5
  // Penalise very short sentences
  if (sentence.split(/\s+/).length < 5) score -= 3
  return score
}

export interface GenerateStoryOptions {
  fileName?: string
  pageNumber?: number
}

export function generateStoryAndDossier(
  rawText: string,
  options?: GenerateStoryOptions
): StoryAndDossier {
  const text = cleanOcrRegex(rawText)
  if (!text) {
    return {
      caseStory: 'Text extraction requires review',
      technicalDossier: [],
    }
  }

  const dossier: TechnicalDossierItem[] = []

  // ── Universal Legal Metadata Extraction ────────────────────────────────────
  const courtMatch =
    text.match(/\b((?:IN\s+THE\s+HIGH\s+COURT\s+OF[^\n,;]{0,50}|High\s+Court\s+of[^\n,;]{0,40}|Supreme\s+Court\s+of\s+India|District\s+&\s+Sessions\s+Judge[^\n,;]{0,40}|District\s+Judge[^\n,;]{0,40}|Sessions\s+Judge[^\n,;]{0,40}|Chief\s+Judicial\s+Magistrate[^\n,;]{0,40}|Judicial\s+Magistrate[^\n,;]{0,40}|Arbitral\s+Tribunal[^\n,;]{0,40}|NCLT[^\n,;]{0,30}|CAT[^\n,;]{0,30}))/i) ??
    text.match(/\b(Commissioner,\s*Purnea\s+Division[^\n,;]{0,40})/i) ??
    text.match(/\b(NHAI|National\s+Highways\s+Authority[^\n,;]{0,30})/i) ??
    text.match(/\b(CALA[^\n,;]{0,30})/i)
  if (courtMatch) dossier.push({ label: 'Court / Forum', value: courtMatch[1].trim() })

  const caseNoMatch =
    text.match(/\b((?:CRIMINAL|CIVIL|MISC\.?|COMMERCIAL|TITLE|EXECUTION|W\.?P\.?|SPECIAL\s+LEAVE)\s*(?:MISCELLANEOUS|APPEAL|PETITION|SUIT|APPLICATION|CASE)?\s*(?:NO\.?|NUMBER)?\s*[:\-]?\s*[0-9A-Za-z/_\-]+(?:\s*OF\s*\d{4})?)/i) ??
    text.match(/\b(Arb\.?\s*(?:R\.?D\.?\s*)?(?:Case|Petition|Appln\.?)\s*No\.?\s*[0-9A-Za-z/_-]+)/i) ??
    text.match(/\b(F\.?I\.?R\.?\s*(?:No\.?|Number)?\s*[:\-]?\s*[0-9A-Z/_\-]+(?:\s*dated\s*[^\n,;]{0,20})?)/i) ??
    text.match(/\b(P\.?S\.?\s*Case\s*No\.?\s*[-:]?\s*[0-9A-Za-z/_\-]+(?:\s*Year[-:]?\s*\d{4})?)/i)
  if (caseNoMatch) dossier.push({ label: 'Case / FIR / PS No.', value: caseNoMatch[1].trim() })

  const thanaMatch = text.match(/\b(?:Thana|P\.?S\.?|Police\s+Station)\s*[-:]?\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)/i)
  if (thanaMatch) dossier.push({ label: 'Police Station', value: thanaMatch[1].trim() })

  const actMatches = text.match(/\b((?:Section|Sec\.?|U\/s)\s*\d+[A-Za-z]*(?:\s*\([0-9A-Za-z]+\))*(?:\s+of\s+(?:the\s+)?[A-Za-z.,&'-]+(?:Act|Code|IPC|Cr\.?P\.?C|CPC|BNSS|BNS)?(?:,\s*\d{4})?)?)/gi)
  if (actMatches) {
    const uniqueActs = Array.from(new Set(actMatches.map((a) => a.trim()))).slice(0, 3)
    dossier.push({ label: 'Statutory Sections', value: uniqueActs.join(', ') })
  }

  const memoMatch =
    text.match(/\b((?:Memo|Letter|Order)\s*No\.?\s*[0-9A-Za-z/_-]+(?:\s*dated\s*[^\n,;]{0,25})?)/i)
  if (memoMatch) dossier.push({ label: 'Order / Memo Ref.', value: memoMatch[1].trim() })

  const partyMatch = text.match(
    /\b([A-Z][A-Za-z\s.,&'-]{3,40})\s+(?:Versus|Vs\.?|V\/s)\s+([A-Z][A-Za-z\s.,&'-]{3,40})\b/
  )
  if (partyMatch) dossier.push({ label: 'Parties', value: `${partyMatch[1].trim()} vs. ${partyMatch[2].trim()}` })

  const datesFound = extractLegalDates(text)
  if (datesFound.length > 0) {
    dossier.push({ label: 'Key Date(s)', value: datesFound.map((d) => d.date).slice(0, 3).join(', ') })
  }

  const plotMatch =
    text.match(/\b(?:R\.?S\.?\s*Plot\s*No\.?\s*|Khasra\s*No\.?\s*|Plot\s*No\.?\s*)([0-9A-Za-z/_-]+)/i)
  if (plotMatch) dossier.push({ label: 'Plot / Khasra No.', value: plotMatch[0].trim() })

  const khataMatch = text.match(/\bKhata\s*No\.?\s*([0-9A-Za-z/_-]+)/i)
  if (khataMatch) dossier.push({ label: 'Khata No.', value: khataMatch[0].trim() })

  const areaMatch = text.match(/\b((?:\d+(?:\.\d+)?)\s*(?:acres?|decimals?|dismals?|hectares?|sq\.?\s*(?:ft\.?|m\.?|yards?)|bigha|guntha))/i)
  if (areaMatch) dossier.push({ label: 'Land Area', value: areaMatch[1].trim() })

  if (options?.pageNumber) {
    dossier.push({
      label: 'Source Reference',
      value: `${options.fileName || 'Document.pdf'}, Page ${options.pageNumber}`,
    })
  }

  // Handle obviously corrupted text honestly
  if (isCorruptedText(text)) {
    dossier.unshift({
      label: 'Extraction Note',
      value: 'Text extraction requires review due to scan degradation or OCR noise.',
    })
    dossier.push({
      label: 'Original Passage',
      value: text.slice(0, 800) + (text.length > 800 ? '…' : ''),
    })
    return {
      caseStory: 'Text extraction requires review',
      technicalDossier: dossier,
    }
  }

  // Always keep original passage in technical dossier for inspection
  dossier.push({
    label: 'Original Passage',
    value: text.slice(0, 800) + (text.length > 800 ? '…' : ''),
  })

  // ── Multi-Domain Story Synthesis ───────────────────────────────────────────
  const lower = text.toLowerCase()
  const sentences = splitLegalSentences(text)
  let caseStory = ''

  // 1. Case Institution Page (Page 1)
  if (
    options?.pageNumber === 1 &&
    (/(?:in\s+the\s+court|in\s+the\s+high\s+court|supreme\s+court|arising\s+out\s+of)/i.test(lower) ||
      dossier.some((d) => d.label === 'Court / Forum'))
  ) {
    const court = dossier.find((d) => d.label === 'Court / Forum')?.value || 'The Court'
    const caseNo = dossier.find((d) => d.label === 'Case / FIR / PS No.')?.value
    const thana = dossier.find((d) => d.label === 'Police Station')?.value
    const sections = dossier.find((d) => d.label === 'Statutory Sections')?.value

    let story = `Proceedings before ${court}`
    if (caseNo) story += ` in ${caseNo}`
    if (thana) story += ` originating out of Police Station ${thana}`
    if (sections) story += `, involving ${sections}`
    story += '.'
    caseStory = story
  }
  // 2. FIR / Criminal Complaint / Registered Case
  else if (
    /\b(?:f\.?i\.?r\.?|police\s+case|informant|written\s+statement\s+of\s+the\s+informant)\b/i.test(lower) &&
    /\b(?:registered|alleging|allurement|sexual|theft|stolen|assault|offence)\b/i.test(lower)
  ) {
    const firSentence = sentences.find((s) =>
      /\b(?:emanates|registered\s+under|written\s+statement\s+of\s+the\s+informant|alleging\s+inter\s+alia)\b/i.test(s)
    )
    if (firSentence && firSentence.length >= 35 && !isCorruptedText(firSentence)) {
      const clean = firSentence.replace(/^(?:patna\s+high\s+court[^\n]+dt\.[^\n]+\d+\s*\/\s*\d+\s*|\d+\.\s*)/i, '').trim()
      caseStory = clean.charAt(0).toUpperCase() + clean.slice(1)
    }
  }
  // 3. Medical / Forensic / Physical Evidence
  else if (/\b(?:medical\s+examination|vaginal\s+swab|post-?mortem|spermatozoa|injury\s+report|seizure\s+memo|recovered)\b/i.test(lower)) {
    const medSentence = sentences.find((s) =>
      /\b(?:medical\s+examination|vaginal\s+swab|spermatozoa|injury|recovered|seizure)\b/i.test(s)
    )
    if (medSentence && medSentence.length >= 35 && !isCorruptedText(medSentence)) {
      const clean = medSentence.replace(/^(?:patna\s+high\s+court[^\n]+dt\.[^\n]+\d+\s*\/\s*\d+\s*|\d+\.\s*)/i, '').trim()
      caseStory = clean.charAt(0).toUpperCase() + clean.slice(1)
    }
  }
  // 4. Discharge / Quashing / Interlocutory Challenge
  else if (/\b(?:discharge|quash|quashing|section\s+227|section\s+239|section\s+482|impugned\s+order)\b/i.test(lower)) {
    const dischargeSentence = sentences.find((s) =>
      /\b(?:discharge|rejected|impugned\s+order|prayer\s+for\s+discharge)\b/i.test(s)
    )
    if (dischargeSentence && dischargeSentence.length >= 35 && !isCorruptedText(dischargeSentence)) {
      const clean = dischargeSentence.replace(/^(?:patna\s+high\s+court[^\n]+dt\.[^\n]+\d+\s*\/\s*\d+\s*|\d+\.\s*)/i, '').trim()
      caseStory = clean.charAt(0).toUpperCase() + clean.slice(1)
    }
  }
  // 5. Substantive Arguments & Counsel Submissions (Defense / Prosecution)
  else if (/\b(?:contended|submitted|learned\s+senior\s+counsel|learned\s+counsel|per\s+contra|learned\s+app|public\s+prosecutor|opposed)\b/i.test(lower)) {
    const argSentence = sentences.find((s) =>
      /\b(?:contended|submitted|per\s+contra|opposed|counsel|offence\s+under|buttress)\b/i.test(s)
    )
    if (argSentence && argSentence.length >= 35 && !isCorruptedText(argSentence)) {
      const clean = argSentence.replace(/^(?:patna\s+high\s+court[^\n]+dt\.[^\n]+\d+\s*\/\s*\d+\s*|\d+\.\s*)/i, '').trim()
      caseStory = clean.charAt(0).toUpperCase() + clean.slice(1)
    }
  }
  // 6. Procedural Service, Memo, Allotment, Award Delivery
  else if (/memo\s*no\.?|letter\s*no\.?|served\s+the\s+award|received\s+copy|allott?ement\s+amount/i.test(lower)) {
    const memoVal = dossier.find((d) => d.label === 'Order / Memo Ref.')?.value || 'competent authority memo'
    const caseVal = dossier.find((d) => d.label === 'Case / FIR / PS No.')?.value
    const dates = dossier.find((d) => d.label === 'Key Date(s)')?.value
    let story = `Procedural record documenting official communication via ${memoVal}${caseVal ? ` in ${caseVal}` : ''}${dates ? ` (dated ${dates.split(',')[0].trim()})` : ''}.`
    if (/c\.p\.c\.|documents/i.test(lower)) {
      story += ' The record notes compliance requirements regarding production of documents.'
    }
    caseStory = story
  }
  // 7. Affidavit & Verification
  else if (/affidavit\s*&\s*verification|oath\s+commissioner|solemnly\s+affirm/i.test(lower)) {
    const courtVal = dossier.find((d) => d.label === 'Court / Forum')?.value || 'the competent court'
    const dates = dossier.find((d) => d.label === 'Key Date(s)')?.value
    caseStory = `Affidavit and verification executed before the Oath Commissioner for ${courtVal}${dates ? ` on ${dates}` : ''}, affirming the truth of the statements and grounds.`
  }
  // 8. Arbitration (strict word boundary on Section 34!)
  else if (/\bsection\s+34\b/i.test(lower) && /\barbitrat/i.test(lower)) {
    const courtVal = dossier.find((d) => d.label === 'Court / Forum')?.value || 'District Judge'
    const caseVal = dossier.find((d) => d.label === 'Case / FIR / PS No.')?.value
    caseStory = `The applicant instituted proceedings before ${courtVal}${caseVal ? ` in ${caseVal}` : ''} under Section 34 of the Arbitration and Conciliation Act, challenging the arbitral award.`
  }
  // 9. Land Acquisition & Valuation
  else if (/six[\s-]men\s+committee|commercial\s+in\s+nature|nature\s+of\s+land|agricultural\s+land|national\s+highways\s+act/i.test(lower)) {
    const plot = dossier.find((d) => d.label === 'Plot / Khasra No.')?.value
    const area = dossier.find((d) => d.label === 'Land Area')?.value
    const details = [plot, area].filter(Boolean).join(', ')
    caseStory = `The proceedings concern statutory land acquisition${details ? ` for ${details}` : ''}, disputing the nature and classification of the acquired land.`
  }
  // 10. General Concept Note / Legal Platform Memo
  else if (/concept\s+note|nyayasetu|nyayatrace|workspace|evidence\s+traceability/i.test(lower)) {
    const conceptSentence = sentences.find((s) => s.length >= 30 && !isCorruptedText(s))
    caseStory = conceptSentence || 'Documentation outlining the NyayaSetu workspace, evidence traceability, and case preparation capabilities.'
  }

  // 11. Universal Narrative from Clean Document Sentences
  if (!caseStory) {
    for (const s of sentences) {
      const clean = s.replace(/^(?:patna\s+high\s+court[^\n]+dt\.[^\n]+\d+\s*\/\s*\d+\s*|\d+\.\s*|that\s+)/i, '').trim()
      if (clean.length >= 35 && !isCorruptedText(clean)) {
        const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1)
        caseStory = /[.!?]$/.test(capitalized) ? capitalized : capitalized + '.'
        break
      }
    }
  }

  // 12. Fallback from Structured Dossier
  if (!caseStory) {
    const courtVal = dossier.find((d) => d.label === 'Court / Forum')?.value
    const caseVal = dossier.find((d) => d.label === 'Case / FIR / PS No.')?.value
    const datesVal = dossier.find((d) => d.label === 'Key Date(s)')?.value
    if (courtVal || caseVal || datesVal) {
      const parts = []
      if (courtVal) parts.push(`Legal proceedings before ${courtVal}`)
      if (caseVal) parts.push(`in ${caseVal}`)
      if (datesVal) parts.push(`(referenced date: ${datesVal})`)
      caseStory = parts.join(' ') + '.'
    } else {
      caseStory = 'Text extraction requires review'
    }
  }

  return { caseStory, technicalDossier: dossier }
}

/**
 * Given a raw OCR passage string, returns a clean synthesized case story.
 * Guaranteed never to dump raw OCR gibberish into the UI.
 */
export function buildStoryFromPassage(rawPassage: string): string {
  if (!rawPassage || isCorruptedText(rawPassage)) {
    return 'Text extraction requires review'
  }
  const { caseStory } = generateStoryAndDossier(rawPassage)
  return caseStory || 'Text extraction requires review'
}

export type LegalCategory = ProcessedLegalRecord['category']
export const cleanOcrText = cleanOcrRegex
