'use client'

import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { FileText } from 'lucide-react'
import { categorizeLegalText, cleanOcrRegex, extractInstantLegalBrief } from '@/lib/legalSanitizer'

interface ExecutiveLegalCardProps {
  rawText: string
  page: number
  fileName?: string
  onOpen?: () => void
}

const CATEGORY_PRESENTATION = {
  JURISDICTION: {
    label: '🚨 Jurisdiction & Authority',
    badge: 'bg-red-50 text-red-700 border-red-200',
    card: 'border-l-red-600',
  },
  COMPENSATION: {
    label: '💰 Compensation & Valuation',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    card: 'border-l-amber-500',
  },
  PROCEDURE: {
    label: '📜 Procedural Non-Compliance',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    card: 'border-l-indigo-600',
  },
  LIMITATION: {
    label: '📅 Limitation & Service',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    card: 'border-l-emerald-600',
  },
  GENERAL: {
    label: '📋 General Record',
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
    card: 'border-l-slate-500',
  },
}

const KEY_DATA_PATTERN =
  /\*\*.*?\*\*|\b(?:Section|Sec\.?)\s*\d+[A-Za-z]*(?:\(\d+[A-Za-z]?\))*(?:\s+of\s+the\s+Arbitration and Conciliation Act(?:,\s*\d{4})?|\s+of\s+the\s+(?:Arbitration Act|NH Act|IPC|BNS|BNSS|CrPC))?|\bPlot\s*(?:No\.?)?\s*[\w/-]+|\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/gi

function renderFormattedText(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  let lastIndex = 0
  KEY_DATA_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = KEY_DATA_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const value = match[0]
    parts.push(
      <mark key={`${match.index}-${value}`} className="rounded border border-amber-300/60 bg-amber-200/70 px-1.5 py-0.5 text-xs font-bold text-amber-950">
        {value.startsWith('**') && value.endsWith('**') ? value.slice(2, -2) : value}
      </mark>
    )
    lastIndex = match.index + value.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

export default function ExecutiveLegalCard({
  rawText,
  page,
  fileName = 'case 1.pdf',
  onOpen,
}: ExecutiveLegalCardProps) {
  const { cleanedQuote, executiveBrief, category } = useMemo(() => {
    const cleanedQuote = cleanOcrRegex(rawText)
    return {
      cleanedQuote,
      executiveBrief: extractInstantLegalBrief(cleanedQuote),
      category: categorizeLegalText(cleanedQuote).category,
    }
  }, [rawText])
  const presentation = CATEGORY_PRESENTATION[category]

  return (
    <article className={`min-w-0 cursor-pointer rounded-xl border border-l-4 border-slate-200/80 bg-slate-50/80 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-md sm:p-5 ${presentation.card}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${presentation.badge}`}>
          {presentation.label}
        </span>
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('openPdfPage', { detail: { page } }))
            onOpen?.()
          }}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <FileText className="h-3.5 w-3.5" />
          {fileName} · p. {page}
        </button>
      </div>

      <div className="mb-3 rounded-xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xs backdrop-blur-sm">
        <p className="text-sm font-bold leading-snug text-slate-900">
          {executiveBrief}
        </p>
      </div>

      <p className="my-1 rounded-lg border border-slate-200/60 border-l-2 border-l-indigo-400/80 bg-white p-3 pl-3.5 font-sans text-xs font-normal leading-relaxed text-slate-800 not-italic sm:text-sm">
        {renderFormattedText(cleanedQuote)}
      </p>
    </article>
  )
}
