'use client'

import { useState, useMemo, type ReactNode } from 'react'
import { FileText, Copy, Check, Eye } from 'lucide-react'
import { categorizeLegalText, cleanOcrRegex } from '@/lib/legalSanitizer'

interface ExecutiveLegalCardProps {
  rawText: string
  page: number
  fileName?: string
  onOpen?: () => void
}

const CATEGORY_MAP = {
  JURISDICTION: {
    label: 'Jurisdiction',
    badgeStyle: {
      backgroundColor: 'var(--badge-jurisdiction-bg)',
      color: 'var(--badge-jurisdiction-text)',
      borderColor: 'var(--badge-jurisdiction-border)',
    },
  },
  COMPENSATION: {
    label: 'Compensation',
    badgeStyle: {
      backgroundColor: 'var(--badge-compensation-bg)',
      color: 'var(--badge-compensation-text)',
      borderColor: 'var(--badge-compensation-border)',
    },
  },
  PROCEDURE: {
    label: 'Procedural',
    badgeStyle: {
      backgroundColor: 'var(--badge-procedural-bg)',
      color: 'var(--badge-procedural-text)',
      borderColor: 'var(--badge-procedural-border)',
    },
  },
  LIMITATION: {
    label: 'Limitation',
    badgeStyle: {
      backgroundColor: 'var(--badge-limitation-bg)',
      color: 'var(--badge-limitation-text)',
      borderColor: 'var(--badge-limitation-border)',
    },
  },
  MERITS: {
    label: 'Merits',
    badgeStyle: {
      backgroundColor: 'var(--badge-merits-bg)',
      color: 'var(--badge-merits-text)',
      borderColor: 'var(--badge-merits-border)',
    },
  },
  GENERAL: {
    label: 'General Record',
    badgeStyle: {
      backgroundColor: 'var(--badge-general-bg)',
      color: 'var(--badge-general-text)',
      borderColor: 'var(--badge-general-border)',
    },
  },
}

const KEY_DATA_PATTERN =
  /\*\*.*?\*\*|\b(?:Section|Sec\.?)\s*\d+[A-Za-z]*(?:\(\d+[A-Za-z]?\))*(?:\s+of\s+the\s+[A-Za-z\s&,]+(?:Act|Code)(?:,\s*\d{4})?)?|\bPlot\s*(?:No\.?)?\s*[\w/-]+|\b(?:Rs\.?|INR)\s*[\d,]+(?:\.\d+)?|\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/gi

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
      <mark
        key={`${match.index}-${value}`}
        style={{
          backgroundColor: 'var(--highlight-statutory-bg)',
          color: 'var(--highlight-statutory-text)',
          borderColor: 'var(--highlight-statutory-border)',
        }}
        className="rounded border px-1.5 py-0.5 text-xs font-bold leading-none inline-block align-baseline"
      >
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
  fileName = 'Document.pdf',
  onOpen,
}: ExecutiveLegalCardProps) {
  const [copied, setCopied] = useState(false)

  const { cleanedQuote, presentation } = useMemo(() => {
    const cleaned = cleanOcrRegex(rawText)
    const { category } = categorizeLegalText(cleaned)
    return {
      cleanedQuote: cleaned,
      presentation: CATEGORY_MAP[category] || CATEGORY_MAP.GENERAL,
    }
  }, [rawText])

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(cleanedQuote)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleViewPage = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.dispatchEvent(new CustomEvent('openPdfPage', { detail: { page } }))
    onOpen?.()
  }

  return (
    <article
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-subtle)',
        boxShadow: 'var(--card-shadow)',
      }}
      className="flex min-w-0 flex-col justify-between rounded-xl border p-4 sm:p-5 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
    >
      {/* ── 1. Card Header: Category Badge + Source Link ── */}
      <div
        style={{ borderColor: 'var(--border-subtle)' }}
        className="flex flex-wrap items-center justify-between gap-2 border-b pb-3"
      >
        <span
          style={presentation.badgeStyle}
          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-tight"
        >
          {presentation.label}
        </span>

        <button
          type="button"
          onClick={handleViewPage}
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-secondary)',
          }}
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs transition-colors hover:text-[var(--text-primary)]"
          title={`Jump to ${fileName} (p. ${page})`}
        >
          <FileText className="h-3.5 w-3.5 text-teal shrink-0" />
          <span className="truncate max-w-[170px]">{fileName}</span>
          <span className="font-semibold text-teal">· p. {page}</span>
        </button>
      </div>

      {/* ── 2. Card Body: Clean Synthesized Text Snippet ── */}
      <div className="my-3.5 flex-1">
        <p
          style={{
            color: 'var(--text-primary)',
            lineHeight: 1.6,
            fontSize: '0.9375rem',
          }}
          className="font-sans font-normal not-italic break-words"
        >
          {renderFormattedText(cleanedQuote)}
        </p>
      </div>

      {/* ── 3. Card Footer: Action Buttons (View Page, Copy Quote) ── */}
      <div
        style={{ borderColor: 'var(--border-subtle)' }}
        className="flex items-center justify-end gap-2 border-t pt-3"
      >
        <button
          type="button"
          onClick={handleCopy}
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-secondary)',
          }}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:text-[var(--text-primary)]"
          title="Copy exact quotation to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Quote</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleViewPage}
          className="inline-flex items-center gap-1.5 rounded-full bg-teal px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-teal-dark"
          title="View source document page"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>View Page</span>
        </button>
      </div>
    </article>
  )
}
