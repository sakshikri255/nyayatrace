'use client'

import { useMemo, useState } from 'react'
import type { EvidenceReference } from '@/lib/analysis/synopsis'
import { ZigZagLegalCard, TimelineNodeDot, CATEGORY_MAP } from '@/components/ZigZagLegalCard'
import { buildStoryFromPassage, categorizeLegalText, cleanOcrText, extractInstantLegalBrief, isCorruptedText, type LegalCategory } from '@/lib/legalSanitizer'

interface ExtractedQuotesSectionProps {
  rawQuotes: EvidenceReference[]
  onOpen: (quote: EvidenceReference) => void
}

interface CategoryTab {
  id: LegalCategory | 'ALL'
  label: string
  activeStyle: React.CSSProperties
  idleStyle: React.CSSProperties
}

const CATEGORY_TABS: CategoryTab[] = [
  {
    id: 'ALL',
    label: 'All',
    activeStyle: { backgroundColor: 'var(--text-primary)', color: 'var(--bg-card)', borderColor: 'var(--text-primary)' },
    idleStyle: { backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' },
  },
  {
    id: 'JURISDICTION',
    label: 'Jurisdiction',
    activeStyle: { backgroundColor: 'var(--badge-jurisdiction-text)', color: 'white', borderColor: 'var(--badge-jurisdiction-text)' },
    idleStyle: { backgroundColor: 'var(--badge-jurisdiction-bg)', color: 'var(--badge-jurisdiction-text)', borderColor: 'var(--badge-jurisdiction-border)' },
  },
  {
    id: 'COMPENSATION',
    label: 'Compensation',
    activeStyle: { backgroundColor: 'var(--badge-compensation-text)', color: 'white', borderColor: 'var(--badge-compensation-text)' },
    idleStyle: { backgroundColor: 'var(--badge-compensation-bg)', color: 'var(--badge-compensation-text)', borderColor: 'var(--badge-compensation-border)' },
  },
  {
    id: 'PROCEDURE',
    label: 'Procedural',
    activeStyle: { backgroundColor: 'var(--badge-procedural-text)', color: 'white', borderColor: 'var(--badge-procedural-text)' },
    idleStyle: { backgroundColor: 'var(--badge-procedural-bg)', color: 'var(--badge-procedural-text)', borderColor: 'var(--badge-procedural-border)' },
  },
  {
    id: 'LIMITATION',
    label: 'Limitation',
    activeStyle: { backgroundColor: 'var(--badge-limitation-text)', color: 'white', borderColor: 'var(--badge-limitation-text)' },
    idleStyle: { backgroundColor: 'var(--badge-limitation-bg)', color: 'var(--badge-limitation-text)', borderColor: 'var(--badge-limitation-border)' },
  },
  {
    id: 'MERITS',
    label: 'Merits',
    activeStyle: { backgroundColor: 'var(--badge-merits-text)', color: 'white', borderColor: 'var(--badge-merits-text)' },
    idleStyle: { backgroundColor: 'var(--badge-merits-bg)', color: 'var(--badge-merits-text)', borderColor: 'var(--badge-merits-border)' },
  },
]

export function ExtractedQuotesSection({ rawQuotes, onOpen }: ExtractedQuotesSectionProps) {
  const [activeTab, setActiveTab] = useState<LegalCategory | 'ALL'>('ALL')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const cleanedQuotes = useMemo(() => {
    return rawQuotes.map((quote, index) => {
      const cleaned = cleanOcrText(quote.passage)
      // 1. Prefer existing valid story from AI or robust synopsis run
      const existingStory = quote.caseStory?.trim()
      const isExistingStoryValid =
        existingStory &&
        !isCorruptedText(existingStory) &&
        existingStory !== cleaned &&
        !existingStory.startsWith('i Ail')

      let story = ''
      if (isExistingStoryValid) {
        story = existingStory
      } else {
        const passageStory = buildStoryFromPassage(quote.passage)
        story = passageStory || 'Text extraction requires review'
      }

      // brief: first clean sentence from the passage for the card header
      const brief = extractInstantLegalBrief(cleaned)

      // Ensure Technical Dossier contains Original Passage and Extraction Note if needed
      const dossier = Array.isArray(quote.technicalDossier) ? [...quote.technicalDossier] : []
      if (!dossier.some((d) => d.label === 'Original Passage') && cleaned.length > 0) {
        dossier.push({
          label: 'Original Passage',
          value: cleaned.slice(0, 800) + (cleaned.length > 800 ? '…' : ''),
        })
      }
      if (isCorruptedText(cleaned) && !dossier.some((d) => d.label === 'Extraction Note')) {
        dossier.unshift({
          label: 'Extraction Note',
          value: 'Text extraction requires review due to scan degradation or OCR noise.',
        })
      }

      return {
        ...quote,
        id: `${quote.documentId}-${quote.pageNumber}-${index}`,
        text: cleaned,
        brief,
        caseStory: story,
        technicalDossier: dossier,
        ...categorizeLegalText(cleaned),
      }
    })
    .filter((q) => q.text.trim().length > 0)
    // Deduplicate at render time: drop cards whose story starts the same as
    // a previously seen card (catches repeated page headers / boilerplate)
    .filter((q, _i, arr) => {
      const prefix = q.caseStory.trim().slice(0, 60).toLowerCase()
      if (prefix.includes('text extraction requires review') || prefix.includes('unable to generate')) return true
      return arr.findIndex((other) => other.caseStory.trim().slice(0, 60).toLowerCase() === prefix) === arr.indexOf(q)
    })
  }, [rawQuotes])

  const filteredQuotes = useMemo(() => {
    return activeTab === 'ALL'
      ? cleanedQuotes
      : cleanedQuotes.filter((q) => q.category === activeTab)
  }, [activeTab, cleanedQuotes])

  return (
    <div className="space-y-5">
      {/* ── Category filter pills ── */}
      <div className="flex flex-wrap items-center gap-2 pb-1" role="group" aria-label="Filter by legal category">
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const count = tab.id === 'ALL'
            ? cleanedQuotes.length
            : cleanedQuotes.filter((q) => q.category === tab.id).length
          if (tab.id !== 'ALL' && count === 0) return null
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={isActive}
              style={isActive ? tab.activeStyle : tab.idleStyle}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <span>{tab.label}</span>
              <span className="opacity-75">({count})</span>
            </button>
          )
        })}
      </div>

      {/* ── Empty state ── */}
      {filteredQuotes.length === 0 ? (
        <div
          style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          className="rounded-xl border p-8 text-center text-xs italic"
        >
          {cleanedQuotes.length
            ? 'No extracted facts found for this category filter.'
            : 'No key facts extracted from the uploaded documents.'}
        </div>
      ) : (
        /* ── Zig-zag staggered timeline ── */
        <div className="relative">
          {/* Central vertical line */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden md:block"
            style={{ backgroundColor: 'var(--border-subtle)' }}
          />

          {/*
            Desktop staggered grid:
            - Two columns with a narrow center column for the node dots.
            - Each right-side card is offset downward by ~40% of a card's height
              via a positive top margin, creating the stagger effect without overlap.
            - Mobile: single full-width column, no stagger.
          */}
          <div className="hidden md:block">
            {filteredQuotes.map((quote, idx) => {
              const isRight = idx % 2 !== 0
              const itemNumber = String(idx + 1).padStart(2, '0')
              const cfg = CATEGORY_MAP[quote.category] ?? CATEGORY_MAP.GENERAL
              const isGlowing = hoveredIdx === idx

              return (
                <div
                  key={quote.id}
                  className="relative flex items-start"
                  // Stagger: right-side rows shift down by 56px relative to their row
                  style={{ marginTop: idx === 0 ? 0 : '-40px' }}
                >
                  {/* Left slot */}
                  <div className="flex-1 min-w-0 pr-4">
                    {!isRight ? (
                      <ZigZagLegalCard
                       itemNumber={itemNumber}
                       caseStory={quote.caseStory}
                       brief={quote.brief}
                       rawText={quote.text}
                       technicalDossier={quote.technicalDossier}
                       page={quote.pageNumber}
                       fileName={quote.documentName}
                       category={quote.category}
                       side="left"
                       glowing={isGlowing}
                       onOpen={() => onOpen(quote)}
                       onMouseEnter={() => setHoveredIdx(idx)}
                       onMouseLeave={() => setHoveredIdx(null)}
                     />
                    ) : (
                      // Spacer so right-side cards align to column 2
                      <div />
                    )}
                  </div>

                  {/* Center node */}
                  <div className="shrink-0 pt-4 z-20">
                    <TimelineNodeDot
                      itemNumber={itemNumber}
                      glowColor={cfg.glowColor}
                      glowing={isGlowing}
                    />
                  </div>

                  {/* Right slot */}
                  <div
                    className="flex-1 min-w-0 pl-4"
                    style={{ paddingTop: isRight ? '48px' : '0' }}
                  >
                    {isRight ? (
                      <ZigZagLegalCard
                        itemNumber={itemNumber}
                        caseStory={quote.caseStory}
                        brief={quote.brief}
                        rawText={quote.text}
                        technicalDossier={quote.technicalDossier}
                        page={quote.pageNumber}
                        fileName={quote.documentName}
                        category={quote.category}
                        side="right"
                        glowing={isGlowing}
                        onOpen={() => onOpen(quote)}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      />
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile: single-column, no stagger */}
          <div className="md:hidden space-y-4">
            {filteredQuotes.map((quote, idx) => {
              const itemNumber = String(idx + 1).padStart(2, '0')
              return (
                <ZigZagLegalCard
                    key={quote.id}
                    itemNumber={itemNumber}
                    caseStory={quote.caseStory}
                    brief={quote.brief}
                    rawText={quote.text}
                    technicalDossier={quote.technicalDossier}
                    page={quote.pageNumber}
                    fileName={quote.documentName}
                    category={quote.category}
                    side="left"
                    onOpen={() => onOpen(quote)}
                  />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
