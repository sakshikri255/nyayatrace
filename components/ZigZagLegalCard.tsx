'use client'

import { useState } from 'react'
import { FileText, Copy, Check, Eye, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { isCorruptedText, type LegalCategory, type TechnicalDossierItem } from '@/lib/legalSanitizer'

interface ZigZagLegalCardProps {
  itemNumber: string
  /** Plain-English 4-5 sentence narrative (shown prominently) */
  caseStory?: string
  /** Rich 4-5 line narrative passage from the page (fallback body text) */
  rawText: string
  /** Brief fallback sentence if rawText is very short */
  brief: string
  /** Structured technical metadata for the collapsible dossier */
  technicalDossier?: TechnicalDossierItem[]
  page: number
  fileName?: string
  category: LegalCategory
  side: 'left' | 'right'
  /** Whether this card's node dot should glow */
  glowing?: boolean
  onOpen?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

// ── Category config: badge styles + light tint background ────────────────────
type CatConfig = {
  label: string
  badgeStyle: React.CSSProperties
  /** Card background tint (light mode) */
  tintLight: string
  /** Card border tint (light mode) */
  borderLight: string
  /** Card background tint (dark mode – via CSS var) */
  tintDark: string
  /** Node dot glow colour */
  glowColor: string
}

const CATEGORY_MAP: Record<LegalCategory, CatConfig> = {
  JURISDICTION: {
    label: 'Jurisdiction',
    badgeStyle: {
      backgroundColor: 'var(--badge-jurisdiction-bg)',
      color: 'var(--badge-jurisdiction-text)',
      borderColor: 'var(--badge-jurisdiction-border)',
    },
    tintLight: '#FEF2F2',
    borderLight: '#FECACA',
    tintDark: 'rgba(152,27,27,0.08)',
    glowColor: '#EF4444',
  },
  COMPENSATION: {
    label: 'Compensation',
    badgeStyle: {
      backgroundColor: 'var(--badge-compensation-bg)',
      color: 'var(--badge-compensation-text)',
      borderColor: 'var(--badge-compensation-border)',
    },
    tintLight: '#FEFCE8',
    borderLight: '#FDE68A',
    tintDark: 'rgba(133,77,14,0.08)',
    glowColor: '#F59E0B',
  },
  PROCEDURE: {
    label: 'Procedural',
    badgeStyle: {
      backgroundColor: 'var(--badge-procedural-bg)',
      color: 'var(--badge-procedural-text)',
      borderColor: 'var(--badge-procedural-border)',
    },
    tintLight: '#EFF6FF',
    borderLight: '#BFDBFE',
    tintDark: 'rgba(30,64,175,0.08)',
    glowColor: '#3B82F6',
  },
  LIMITATION: {
    label: 'Limitation',
    badgeStyle: {
      backgroundColor: 'var(--badge-limitation-bg)',
      color: 'var(--badge-limitation-text)',
      borderColor: 'var(--badge-limitation-border)',
    },
    tintLight: '#F0FDF4',
    borderLight: '#A7F3D0',
    tintDark: 'rgba(22,101,52,0.08)',
    glowColor: '#22C55E',
  },
  MERITS: {
    label: 'Merits',
    badgeStyle: {
      backgroundColor: 'var(--badge-merits-bg)',
      color: 'var(--badge-merits-text)',
      borderColor: 'var(--badge-merits-border)',
    },
    tintLight: '#FAF5FF',
    borderLight: '#E9D5FF',
    tintDark: 'rgba(107,33,168,0.08)',
    glowColor: '#A855F7',
  },
  GENERAL: {
    label: 'General',
    badgeStyle: {
      backgroundColor: 'var(--badge-general-bg)',
      color: 'var(--badge-general-text)',
      borderColor: 'var(--badge-general-border)',
    },
    tintLight: '#F8FAFC',
    borderLight: '#E2E8F0',
    tintDark: 'rgba(30,41,59,0.08)',
    glowColor: '#64748B',
  },
}

export function ZigZagLegalCard({
  itemNumber,
  caseStory,
  rawText,
  brief,
  technicalDossier,
  page,
  fileName = 'Document.pdf',
  category,
  side,
  glowing = false,
  onOpen,
  onMouseEnter,
  onMouseLeave,
}: ZigZagLegalCardProps) {
  const [copied, setCopied] = useState(false)
  const [dossierOpen, setDossierOpen] = useState(false)
  const cfg = CATEGORY_MAP[category] ?? CATEGORY_MAP.GENERAL

  const shortName = fileName.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '')
  const displayName = shortName.length > 24 ? shortName.slice(0, 22) + '…' : shortName

  // Prefer the synthesized story; if text extraction was corrupted or unreliable, handle honestly.
  const isRequiresReview =
    !caseStory ||
    isCorruptedText(caseStory) ||
    caseStory.trim() === 'Text extraction requires review' ||
    caseStory.trim() === 'Unable to generate a reliable summary'

  const storyText = isRequiresReview
    ? (caseStory === 'Unable to generate a reliable summary'
        ? 'Unable to generate a reliable summary'
        : 'Text extraction requires review')
    : caseStory.trim()

  const hasDossier = Array.isArray(technicalDossier) && technicalDossier.length > 0

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      const textToCopy = isRequiresReview && rawText ? rawText : storyText
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  function handleView(e: React.MouseEvent) {
    e.stopPropagation()
    window.dispatchEvent(new CustomEvent('openPdfPage', { detail: { page } }))
    onOpen?.()
  }

  function toggleDossier(e: React.MouseEvent) {
    e.stopPropagation()
    setDossierOpen((prev) => !prev)
  }

  return (
    <article
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        backgroundColor: cfg.tintLight,
        borderColor: cfg.borderLight,
        boxShadow: glowing
          ? `0 0 0 2px ${cfg.glowColor}40, 0 4px 16px ${cfg.glowColor}20`
          : 'var(--card-shadow)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      className={[
        'relative flex flex-col rounded-xl border',
        'dark:bg-[var(--bg-card)]',
        glowing ? 'scale-[1.005]' : '',
      ].join(' ')}
    >
      {/* ── Header ── */}
      <div
        style={{ borderColor: cfg.borderLight }}
        className="flex items-center justify-between gap-2 border-b px-4 py-2.5"
      >
        {/* Category badge */}
        <span
          style={cfg.badgeStyle}
          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-tight shrink-0"
        >
          {cfg.label}
        </span>

        {/* Item number + page tag */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            style={{
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-muted)',
              borderColor: 'var(--border-subtle)',
            }}
            className="rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold"
          >
            #{itemNumber}
          </span>
          <button
            type="button"
            onClick={handleView}
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
            className="inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[11px] transition-colors hover:text-[color:var(--text-primary)]"
            title={`View ${fileName} p. ${page}`}
          >
            <FileText className="h-3 w-3 text-teal shrink-0" />
            <span className="hidden sm:inline">{displayName} · </span>
            <span className="font-semibold text-teal">p.{page}</span>
          </button>
        </div>
      </div>

      {/* ── Body: plain-English story narrative or honest review banner ── */}
      <div className="px-4 py-3.5 flex-1">
        {isRequiresReview ? (
          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs italic"
          >
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
            <span>{storyText}. Source passage is preserved in the Technical Dossier below.</span>
          </div>
        ) : (
          <p
            style={{
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 400,
              lineHeight: 1.75,
            }}
            className="font-sans"
          >
            {storyText}
          </p>
        )}
      </div>

      {/* ── Collapsible Technical Dossier ── */}
      {hasDossier && (
        <div
          style={{ borderColor: cfg.borderLight }}
          className="border-t"
        >
          {/* Toggle button */}
          <button
            type="button"
            onClick={toggleDossier}
            style={{
              color: 'var(--text-secondary)',
            }}
            className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-xs font-medium transition-colors hover:text-[color:var(--text-primary)] cursor-pointer"
            aria-expanded={dossierOpen}
          >
            <span className="flex items-center gap-1.5">
              {dossierOpen
                ? <ChevronUp className="h-3.5 w-3.5 shrink-0" />
                : <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              }
              {dossierOpen ? 'Hide Technical Dossier' : 'Read Technical Dossier'}
            </span>
            <span
              style={{
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-muted)',
                borderColor: 'var(--border-subtle)',
              }}
              className="rounded-full border px-2 py-0.5 font-mono text-[10px]"
            >
              {technicalDossier!.length} field{technicalDossier!.length === 1 ? '' : 's'}
            </span>
          </button>

          {/* Expanded dossier panel */}
          {dossierOpen && (
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: cfg.borderLight,
              }}
              className="border-t px-4 py-3"
            >
              <dl className="grid grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-x-6">
                {technicalDossier!
                  .filter((item) => item.label !== 'Original Passage')
                  .map((item) => (
                    <div key={item.label} className="flex flex-col gap-0.5 min-w-0">
                      <dt
                        style={{ color: 'var(--text-muted)' }}
                        className="text-[10px] font-semibold uppercase tracking-wider truncate"
                      >
                        {item.label}
                      </dt>
                      <dd
                        style={{
                          color: item.label === 'Extraction Note' ? 'var(--badge-compensation-text)' : 'var(--text-primary)',
                        }}
                        className="text-[12px] font-medium break-words"
                      >
                        {item.value}
                      </dd>
                    </div>
                  ))}
              </dl>

              {/* Original source passage for inspection */}
              {technicalDossier!.some((item) => item.label === 'Original Passage') && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
                  <div
                    style={{ color: 'var(--text-muted)' }}
                    className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                  >
                    Original Source Passage
                  </div>
                  <div
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-subtle)',
                    }}
                    className="p-2.5 rounded border font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto"
                  >
                    {technicalDossier!.find((item) => item.label === 'Original Passage')?.value}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div
        style={{ borderColor: cfg.borderLight }}
        className="flex items-center justify-end gap-2 border-t px-4 py-2"
      >
        <button
          type="button"
          onClick={handleCopy}
          style={{
            color: 'var(--text-secondary)',
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-subtle)',
          }}
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:text-[color:var(--text-primary)]"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-600" />
              <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleView}
          className="inline-flex items-center gap-1.5 rounded-full bg-teal px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-teal-dark"
        >
          <Eye className="h-3 w-3" />
          <span>View Page</span>
        </button>
      </div>
    </article>
  )
}

// ── Standalone node dot exported so ExtractedQuotesSection can render it ──────
export function TimelineNodeDot({
  itemNumber,
  glowColor,
  glowing,
}: {
  itemNumber: string
  glowColor: string
  glowing: boolean
}) {
  return (
    <div className="hidden md:flex shrink-0 flex-col items-center gap-1">
      <div
        style={{
          backgroundColor: glowing ? glowColor : 'var(--bg-card)',
          borderColor: glowColor,
          boxShadow: glowing ? `0 0 0 4px ${glowColor}30, 0 0 12px ${glowColor}50` : 'none',
          transform: glowing ? 'scale(1.25)' : 'scale(1)',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease, background-color 0.2s ease',
        }}
        className="h-3 w-3 rounded-full border-2 z-10"
      />
      <span
        className="text-[10px] font-mono font-bold tabular-nums"
        style={{ color: glowing ? glowColor : 'var(--text-muted)' }}
      >
        {itemNumber}
      </span>
    </div>
  )
}

export { CATEGORY_MAP }
