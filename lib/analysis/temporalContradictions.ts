/**
 * Temporal Contradiction Engine
 *
 * Extracts date/time references from document page texts and
 * cross-references them to surface chronological contradictions.
 */

export type ContradictionType =
  | 'date_discrepancy'    // Same event has different timestamps
  | 'sequence_violation'  // Event B before A in one doc, after in another
  | 'travel_impossible'   // Location events within impossible timeframe

export type ContradictionSeverity = 'critical' | 'warning' | 'info'

export interface ExtractedEvent {
  dateStr: string          // Normalized ISO date string (YYYY-MM-DD) or partial
  timeStr: string | null   // Normalized time HH:MM (24h) or null
  rawText: string          // Original matched text
  context: string          // Surrounding sentence
  documentId: number
  documentName: string
  pageNumber: number
  eventDescription: string // Short description inferred from context
}

export interface TemporalContradiction {
  type: ContradictionType
  description: string
  severity: ContradictionSeverity
  sourceA: { documentId: number; documentName: string; pageNumber: number }
  sourceB: { documentId: number; documentName: string; pageNumber: number }
  eventA: ExtractedEvent
  eventB: ExtractedEvent
}

export interface TemporalAnalysisResult {
  events: ExtractedEvent[]
  contradictions: TemporalContradiction[]
  documentCount: number
  eventCount: number
  contradictionCount: number
}

// ── Date pattern library ─────────────────────────────────────────────────────

const DATE_PATTERNS: Array<{
  regex: RegExp
  parse: (m: RegExpMatchArray) => string | null
}> = [
  // ISO: 2024-10-19
  {
    regex: /\b(\d{4})-(\d{2})-(\d{2})\b/g,
    parse: (m) => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`,
  },
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  {
    regex: /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g,
    parse: (m) => {
      const d = parseInt(m[1]), mo = parseInt(m[2]), y = parseInt(m[3])
      if (mo > 12 || d > 31) return null
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    },
  },
  // DD Month YYYY or Month DD, YYYY
  {
    regex: /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/gi,
    parse: (m) => {
      const months: Record<string, string> = {
        january:'01', february:'02', march:'03', april:'04', may:'05', june:'06',
        july:'07', august:'08', september:'09', october:'10', november:'11', december:'12',
      }
      const mo = months[m[2].toLowerCase()]
      const d = String(parseInt(m[1])).padStart(2, '0')
      return `${m[3]}-${mo}-${d}`
    },
  },
  // Month DD, YYYY
  {
    regex: /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
    parse: (m) => {
      const months: Record<string, string> = {
        january:'01', february:'02', march:'03', april:'04', may:'05', june:'06',
        july:'07', august:'08', september:'09', october:'10', november:'11', december:'12',
      }
      const mo = months[m[1].toLowerCase()]
      const d = String(parseInt(m[2])).padStart(2, '0')
      return `${m[3]}-${mo}-${d}`
    },
  },
]

const TIME_PATTERNS: Array<{ regex: RegExp; parse: (m: RegExpMatchArray) => string | null }> = [
  // "at about 3:30 pm" / "at 14:30"
  {
    regex: /\bat\s+(?:about\s+)?(\d{1,2}):(\d{2})\s*(am|pm|hrs|hours?)?\b/gi,
    parse: (m) => {
      let h = parseInt(m[1]), min = parseInt(m[2])
      const ampm = (m[3] ?? '').toLowerCase()
      if (ampm === 'pm' && h < 12) h += 12
      if (ampm === 'am' && h === 12) h = 0
      if (h > 23 || min > 59) return null
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
    },
  },
  // "at 3 pm"
  {
    regex: /\bat\s+(?:about\s+)?(\d{1,2})\s+(am|pm)\b/gi,
    parse: (m) => {
      let h = parseInt(m[1])
      const ampm = m[2].toLowerCase()
      if (ampm === 'pm' && h < 12) h += 12
      if (ampm === 'am' && h === 12) h = 0
      if (h > 23) return null
      return `${String(h).padStart(2, '0')}:00`
    },
  },
]

// ── Extraction ───────────────────────────────────────────────────────────────

function extractSentence(text: string, index: number): string {
  const start = Math.max(0, text.lastIndexOf('.', index - 1) + 1)
  const end = text.indexOf('.', index)
  return text.slice(start, end === -1 ? Math.min(text.length, start + 200) : end + 1).trim()
}

function inferEventDescription(context: string, dateStr: string): string {
  const lower = context.toLowerCase()
  if (lower.includes('fir') || lower.includes('complaint')) return 'FIR/Complaint lodged'
  if (lower.includes('arrest')) return 'Arrest'
  if (lower.includes('incident') || lower.includes('occurrence') || lower.includes('offence') || lower.includes('offense')) return 'Incident/Occurrence'
  if (lower.includes('remand') || lower.includes('custody')) return 'Remand/Custody'
  if (lower.includes('bail')) return 'Bail event'
  if (lower.includes('hearing') || lower.includes('court')) return 'Court hearing'
  if (lower.includes('statement') || lower.includes('deposition')) return 'Statement recorded'
  if (lower.includes('death') || lower.includes('deceased')) return 'Death/Injury'
  return `Event on ${dateStr}`
}

export function extractEventsFromPage(
  text: string,
  documentId: number,
  documentName: string,
  pageNumber: number
): ExtractedEvent[] {
  if (!text || !text.trim()) return []
  const events: ExtractedEvent[] = []

  for (const pattern of DATE_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
    let match: RegExpMatchArray | null
    while ((match = regex.exec(text)) !== null) {
      const dateStr = pattern.parse(match)
      if (!dateStr) continue

      const context = extractSentence(text, match.index ?? 0)
      let timeStr: string | null = null
      for (const tp of TIME_PATTERNS) {
        const tr = new RegExp(tp.regex.source, tp.regex.flags)
        const tm = tr.exec(context)
        if (tm) {
          timeStr = tp.parse(tm)
          break
        }
      }

      events.push({
        dateStr,
        timeStr,
        rawText: match[0],
        context: context.slice(0, 250),
        documentId,
        documentName,
        pageNumber,
        eventDescription: inferEventDescription(context, dateStr),
      })
    }
  }

  // Deduplicate by date+time+page
  const seen = new Set<string>()
  return events.filter((e) => {
    const key = `${e.dateStr}|${e.timeStr ?? ''}|${e.pageNumber}|${e.documentId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Contradiction Detection ───────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  return Math.abs(Math.round((da - db) / (1000 * 60 * 60 * 24)))
}

/**
 * Determine severity based on date gap.
 * Same event differing by >1 day = critical, by 1 day = warning, <1 day = info
 */
function dateSeverity(daysDiff: number): ContradictionSeverity {
  if (daysDiff > 1) return 'critical'
  if (daysDiff === 1) return 'warning'
  return 'info'
}

export function detectTemporalContradictions(events: ExtractedEvent[]): TemporalContradiction[] {
  const contradictions: TemporalContradiction[] = []

  // Group events by similar description across different documents
  const byDescription = new Map<string, ExtractedEvent[]>()
  for (const event of events) {
    const key = event.eventDescription.toLowerCase()
    const group = byDescription.get(key) ?? []
    group.push(event)
    byDescription.set(key, group)
  }

  for (const [, group] of Array.from(byDescription)) {
    // Only compare events from different documents
    const docGroups = new Map<number, ExtractedEvent[]>()
    for (const event of group) {
      const g = docGroups.get(event.documentId) ?? []
      g.push(event)
      docGroups.set(event.documentId, g)
    }

    if (docGroups.size < 2) continue

    const docList = Array.from(docGroups.values())
    for (let i = 0; i < docList.length - 1; i++) {
      for (let j = i + 1; j < docList.length; j++) {
        const evA = docList[i][0]
        const evB = docList[j][0]
        if (!evA || !evB) continue

        const diff = daysBetween(evA.dateStr, evB.dateStr)
        if (diff === 0) continue // No discrepancy

        const severity = dateSeverity(diff)
        const description = `"${evA.eventDescription}" — ${evA.documentName} (pg ${evA.pageNumber}) states ${evA.rawText}, but ${evB.documentName} (pg ${evB.pageNumber}) states ${evB.rawText}. Difference: ${diff} day(s).`

        contradictions.push({
          type: 'date_discrepancy',
          description,
          severity,
          sourceA: { documentId: evA.documentId, documentName: evA.documentName, pageNumber: evA.pageNumber },
          sourceB: { documentId: evB.documentId, documentName: evB.documentName, pageNumber: evB.pageNumber },
          eventA: evA,
          eventB: evB,
        })
      }
    }
  }

  // Sort: critical first
  const severityOrder: Record<ContradictionSeverity, number> = { critical: 0, warning: 1, info: 2 }
  return contradictions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

// ── Main Entry ────────────────────────────────────────────────────────────────

export interface DocumentPageInput {
  documentId: number
  documentName: string
  pageNumber: number
  text: string
}

export function analyzeTemporalContradictions(pages: DocumentPageInput[]): TemporalAnalysisResult {
  const allEvents: ExtractedEvent[] = []

  for (const page of pages) {
    const extracted = extractEventsFromPage(page.text, page.documentId, page.documentName, page.pageNumber)
    allEvents.push(...extracted)
  }

  // Sort events chronologically
  allEvents.sort((a, b) => {
    const dateCompare = a.dateStr.localeCompare(b.dateStr)
    if (dateCompare !== 0) return dateCompare
    return (a.timeStr ?? '').localeCompare(b.timeStr ?? '')
  })

  const contradictions = detectTemporalContradictions(allEvents)
  const documentIds = new Set(allEvents.map((e) => e.documentId))

  return {
    events: allEvents,
    contradictions,
    documentCount: documentIds.size,
    eventCount: allEvents.length,
    contradictionCount: contradictions.length,
  }
}
