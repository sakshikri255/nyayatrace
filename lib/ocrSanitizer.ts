export interface SanitizedExtractedValue {
  value: string
  isNormalized: boolean
}

export function sanitizeExtractedValue(
  rawText: string | null | undefined,
  fieldType: string
): SanitizedExtractedValue {
  if (!rawText?.trim()) {
    return { value: 'Not Specified', isNormalized: false }
  }

  let cleaned = rawText.replace(/\s+/g, ' ').trim()
  let isNormalized = false

  if (fieldType === 'penal_sections' || fieldType === 'Applicable Penal Sections') {
    if (/34\s*of\s*the\s+Arbitration/i.test(cleaned) && !/Conciliation/i.test(cleaned)) {
      cleaned = 'Section 34 of the Arbitration and Conciliation Act, 1996'
      isNormalized = true
    } else if (/\b302\s*IPC\b/i.test(cleaned)) {
      cleaned = 'Section 302 of the Indian Penal Code, 1860'
      isNormalized = true
    }
  }

  cleaned = cleaned.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9.]+$/g, '')

  return { value: cleaned || 'Not Specified', isNormalized }
}
