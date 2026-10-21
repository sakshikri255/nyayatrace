'use client'

import { useState, useMemo } from 'react'
import { Search, ArrowRight } from 'lucide-react'
import { LEGAL_SECTIONS_DB, type LegalSectionMapping } from '@/lib/legal/sections'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

type CategoryFilter = 'all' | 'offense' | 'procedure' | 'evidence'
type BailFilter = 'all' | 'bailable' | 'non-bailable'

function PillButton({
  active,
  onClick,
  children,
  activeClass,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  activeClass?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-semibold transition-colors border cursor-pointer',
        active
          ? activeClass ?? 'bg-teal text-white border-teal'
          : 'bg-transparent text-[var(--section-subheading)] border-[var(--section-card-border)] hover:border-teal/40 hover:text-teal'
      )}
    >
      {children}
    </button>
  )
}

function SectionCard({ item, highlighted }: { item: LegalSectionMapping; highlighted: boolean }) {
  const isNonBailable = item.bailable === 'Non-Bailable'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={cn(
        'rounded-xl border p-4 transition-all text-sm bg-[var(--section-card-bg)] border-[var(--section-card-border)]',
        highlighted ? 'ring-2 ring-teal shadow-md' : ''
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-[var(--section-heading)] bg-[var(--muted)] border border-[var(--section-card-border)] rounded px-1.5 py-0.5">
            IPC {item.ipcSection}
          </span>
          <ArrowRight className="h-3 w-3 text-[var(--section-subheading)] shrink-0" />
          <span className="font-mono text-xs font-bold text-[var(--section-heading)] bg-[var(--muted)] border border-[var(--section-card-border)] rounded px-1.5 py-0.5">
            BNS {item.bnsSection}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 shrink-0">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold border',
              isNonBailable
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            )}
          >
            {item.bailable}
          </span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-[var(--muted)] text-[var(--section-subheading)] border-[var(--section-card-border)]">
            {item.cognizable}
          </span>
          {item.compoundable && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-violet-500/10 text-violet-500 border-violet-500/20">
              Compoundable
            </span>
          )}
        </div>
      </div>

      {/* Offense name */}
      <p className="font-semibold text-[var(--section-heading)] mb-1.5 leading-snug">{item.offense}</p>

      {/* Punishment */}
      <p className="text-xs text-[var(--section-subheading)] mb-2">
        <span className="font-medium text-[var(--section-heading)]">Punishment: </span>{item.punishment}
      </p>

      {/* Key elements */}
      <p className="text-xs text-[var(--section-subheading)] leading-relaxed bg-[var(--muted)] rounded-md p-2 border border-[var(--section-card-border)]">
        {item.keyElements}
      </p>

      {/* Trial court */}
      <p className="text-[11px] text-[var(--section-subheading)] mt-2">
        <span className="font-medium">Triable by: </span>{item.triableBy}
      </p>
    </motion.div>
  )
}

export function ConcordanceMatrix({ initialQuery }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery ?? '')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [bailFilter, setBailFilter] = useState<BailFilter>('all')
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let results = LEGAL_SECTIONS_DB

    if (query.trim()) {
      const q = query.toLowerCase().trim()
      results = results.filter(
        (item) =>
          item.ipcSection.toLowerCase().includes(q) ||
          item.bnsSection.toLowerCase().includes(q) ||
          item.offense.toLowerCase().includes(q) ||
          item.keyElements.toLowerCase().includes(q) ||
          item.punishment.toLowerCase().includes(q)
      )
    }

    if (categoryFilter !== 'all') {
      results = results.filter((item) => item.category === categoryFilter)
    }

    if (bailFilter === 'bailable') {
      results = results.filter((item) => item.bailable === 'Bailable')
    } else if (bailFilter === 'non-bailable') {
      results = results.filter((item) => item.bailable === 'Non-Bailable')
    }

    return results
  }, [query, categoryFilter, bailFilter])

  // Quick jump: type a section number → find & highlight
  function handleSearch(value: string) {
    setQuery(value)
    const exact = LEGAL_SECTIONS_DB.find(
      (item) =>
        item.ipcSection.toLowerCase() === value.toLowerCase() ||
        item.bnsSection.toLowerCase() === value.toLowerCase()
    )
    setHighlightedSection(exact ? exact.ipcSection : null)
  }

  const offenseCount = LEGAL_SECTIONS_DB.filter((i) => i.category === 'offense').length
  const procedureCount = LEGAL_SECTIONS_DB.filter((i) => i.category === 'procedure').length

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--section-subheading)] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by section (302, 103), offense (murder, theft), or keywords..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[var(--section-card-bg)] border border-[var(--section-card-border)] text-sm text-[var(--section-heading)] placeholder:text-[var(--section-subheading)] focus:outline-none focus:border-teal/60 focus:ring-1 focus:ring-teal/30 transition-colors"
        />
      </div>

      {/* Filter pill rows */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <PillButton active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>
            All ({LEGAL_SECTIONS_DB.length})
          </PillButton>
          <PillButton active={categoryFilter === 'offense'} onClick={() => setCategoryFilter('offense')}>
            Offenses ({offenseCount})
          </PillButton>
          <PillButton active={categoryFilter === 'procedure'} onClick={() => setCategoryFilter('procedure')}>
            Procedure ({procedureCount})
          </PillButton>
        </div>

        <div className="w-px h-5 bg-[var(--section-card-border)]" />

        {/* Bail pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <PillButton active={bailFilter === 'all'} onClick={() => setBailFilter('all')}>
            All Bail
          </PillButton>
          <PillButton
            active={bailFilter === 'bailable'}
            onClick={() => setBailFilter('bailable')}
            activeClass="bg-emerald-600 text-white border-emerald-600"
          >
            Bailable
          </PillButton>
          <PillButton
            active={bailFilter === 'non-bailable'}
            onClick={() => setBailFilter('non-bailable')}
            activeClass="bg-rose-600 text-white border-rose-600"
          >
            Non-Bailable
          </PillButton>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-xs text-[var(--section-subheading)] px-1">
        <span>
          Showing <strong className="text-[var(--section-heading)]">{filtered.length}</strong> of{' '}
          <strong className="text-[var(--section-heading)]">{LEGAL_SECTIONS_DB.length}</strong> entries
        </span>
        {query && (
          <button
            onClick={() => { setQuery(''); setHighlightedSection(null) }}
            className="text-teal hover:underline font-medium"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--section-subheading)] text-sm">
          No sections found matching &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <SectionCard
                key={item.ipcSection}
                item={item}
                highlighted={highlightedSection === item.ipcSection}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
