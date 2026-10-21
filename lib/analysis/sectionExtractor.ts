/**
 * Regex-based extractor for Indian law section references in document text.
 * Detects patterns like "Section 302 IPC", "u/s 420", "Sec 187 BNSS", etc.
 */

export interface DetectedSection {
  section: string   // e.g. "302"
  law: string       // e.g. "IPC"
  rawMatch: string  // exact matched string
  pageId: number
  documentId: number
}

const LAW_ABBREVS = 'IPC|BNS|BNSS|CrPC|CRPC|IEA|PMLA|NDPS|POCSO|PCMA|IT|Arms|Arms Act|MV Act|Prevention of Corruption Act|Immoral Traffic'

// Pattern groups:
// 1. "Section 302 IPC", "Sec. 420 IPC", "S. 302", "S.302"
// 2. "u/s 302 IPC", "u/s. 302", "under Section 302"
// 3. "302/34 IPC", "302, 420 IPC" (compound sections)
// 4. "Section 187 BNSS", "Sec 167(2) CrPC"

const SECTION_PATTERN = new RegExp(
  [
    // u/s pattern
    `(?:u\\/s\\.?\\s*|under\\s+[Ss]ec(?:tion|\\.)?\\s*|under\\s+[Ss]ection\\s+)`,
    `(\\d+(?:[A-Za-z])?(?:\\/\\d+(?:[A-Za-z])?)*)`,
    `(?:\\s*(?:\\(\\d+\\))?)?`,
    `(?:\\s+of\\s+the\\s+)?`,
    `(?:\\s*(${LAW_ABBREVS}))?`,
    '|',
    // Section/Sec/S. pattern
    `(?:S\\.?|Sec\\.?|Section)\\s+`,
    `(\\d+(?:[A-Za-z])?(?:\\/\\d+(?:[A-Za-z])?)*)`,
    `(?:\\s*(?:\\(\\d+[a-zA-Z]?\\))?)?`,
    `(?:\\s*(${LAW_ABBREVS}))?`,
  ].join(''),
  'g'
)

const LAW_KEYWORDS = ['IPC', 'BNS', 'BNSS', 'CrPC', 'CRPC', 'IEA', 'PMLA', 'NDPS', 'POCSO']

export function extractSections(
  text: string,
  pageId: number,
  documentId: number
): DetectedSection[] {
  if (!text) return []

  const results: DetectedSection[] = []
  const seen = new Set<string>()

  // Reset the regex lastIndex
  SECTION_PATTERN.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = SECTION_PATTERN.exec(text)) !== null) {
    // Group 1 = section from u/s pattern, Group 2 = law from u/s, Group 3 = section from Sec pattern, Group 4 = law from Sec
    const section = (match[1] || match[3] || '').trim()
    const lawRaw = (match[2] || match[4] || '').trim().toUpperCase()

    if (!section || parseInt(section, 10) < 1) continue
    if (parseInt(section, 10) > 1000) continue // filter out false positives like years

    // Try to find law from surrounding context if not captured in pattern
    let law = LAW_KEYWORDS.includes(lawRaw) ? lawRaw : ''
    if (!law) {
      // Look ahead 30 chars for a law abbreviation
      const ahead = text.slice(match.index + match[0].length, match.index + match[0].length + 30)
      const lawMatch = ahead.match(new RegExp(`\\b(${LAW_ABBREVS})\\b`))
      if (lawMatch) law = lawMatch[1].toUpperCase()
    }

    const key = `${section}-${law}`
    if (seen.has(key)) continue
    seen.add(key)

    results.push({
      section,
      law,
      rawMatch: match[0].trim(),
      pageId,
      documentId,
    })
  }

  return results
}
