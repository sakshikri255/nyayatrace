'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  ArrowRight,
  Copy,
  Check,
  LayoutGrid,
  Table as TableIcon,
  X,
  ShieldAlert,
  ShieldCheck,
  Gavel,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { LEGAL_SECTIONS_DB, type LegalSectionMapping } from '@/lib/legal/sections'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

type CategoryFilter = 'all' | 'offense' | 'procedure' | 'evidence'
type BailFilter = 'all' | 'bailable' | 'non-bailable'
type ViewMode = 'cards' | 'table'

const QUICK_SECTIONS = [
  { label: '302', query: '302' },
  { label: '304', query: '304' },
  { label: '304A', query: '304A' },
  { label: '376', query: '376' },
  { label: '420', query: '420' },
  { label: '120B', query: '120B' },
  { label: '437/439', query: '439' },
  { label: '482', query: '482' },
]

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
        'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 border cursor-pointer select-none',
        active
          ? activeClass ?? 'bg-teal text-white border-teal shadow-xs ring-2 ring-teal/20'
          : 'bg-[var(--section-card-bg)] text-[var(--section-subheading)] border-[var(--section-card-border)] hover:border-teal/40 hover:text-teal hover:bg-teal/[0.03]'
      )}
    >
      {children}
    </button>
  )
}

function SectionCard({
  item,
  highlighted,
}: {
  item: LegalSectionMapping
  highlighted: boolean
}) {
  const isNonBailable = item.bailable === 'Non-Bailable'
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const textToCopy = `IPC § ${item.ipcSection} ↔ BNS § ${item.bnsSection}: ${item.offense}`
    navigator.clipboard?.writeText(textToCopy).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 text-sm bg-[var(--section-card-bg)] border-[var(--section-card-border)] hover:border-teal/40 hover:shadow-lg hover:shadow-teal/5',
        highlighted ? 'ring-2 ring-teal border-teal shadow-md shadow-teal/10' : ''
      )}
    >
      <div>
        {/* ── Top Header: Old Law ↔ New Law Conversion Banner + Badges ── */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3.5 pb-3.5 border-b border-[var(--section-card-border)]">
          {/* Side-by-Side Dual Code conversion chip */}
          <div className="inline-flex items-center gap-2 rounded-lg bg-muted/40 p-1 border border-[var(--section-card-border)]">
            <span className="font-mono text-xs font-bold text-[var(--section-heading)] bg-navy/80 text-gold-light dark:text-gold-champagne px-2 py-0.5 rounded shadow-2xs">
              IPC {item.ipcSection}
            </span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal/15 text-teal">
              <ArrowRight className="h-3 w-3 shrink-0" />
            </div>
            <span className="font-mono text-xs font-bold text-white bg-teal px-2 py-0.5 rounded shadow-2xs">
              BNS {item.bnsSection}
            </span>
          </div>

          {/* Classification & Compoundability Chips */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border shadow-2xs',
                isNonBailable
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/25 dark:bg-rose-950/40 dark:text-rose-400'
                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:bg-emerald-950/40 dark:text-emerald-400'
              )}
            >
              {isNonBailable ? (
                <ShieldAlert className="h-3 w-3" />
              ) : (
                <ShieldCheck className="h-3 w-3" />
              )}
              {item.bailable}
            </span>

            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-muted/30 text-[var(--section-subheading)] border-[var(--section-card-border)]">
              {item.cognizable}
            </span>

            {item.compoundable && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-violet-500/10 text-violet-600 border-violet-500/25 dark:bg-violet-950/40 dark:text-violet-400">
                Compoundable
              </span>
            )}

            {/* Quick copy citation button */}
            <button
              type="button"
              onClick={handleCopy}
              title="Copy citation"
              className="p-1 rounded-md text-[var(--section-subheading)] hover:text-teal hover:bg-teal/10 transition-colors ml-1 cursor-pointer"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-teal" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* ── Offense Name ── */}
        <h3 className="text-base font-bold text-[var(--section-heading)] tracking-tight mb-2.5 leading-snug group-hover:text-teal transition-colors">
          {item.offense}
        </h3>

        {/* ── Key Statutory Elements Dossier ── */}
        <div className="rounded-lg bg-muted/30 border-l-3 border-teal/70 p-3 mb-3 border-t border-r border-b border-[var(--section-card-border)]">
          <p className="text-xs text-[var(--section-subheading)] leading-relaxed font-sans">
            {item.keyElements}
          </p>
        </div>
      </div>

      {/* ── Metadata Grid: Punishment & Triable By ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-[var(--section-card-border)]">
        <div className="flex items-start gap-2 bg-muted/20 rounded-md p-2 border border-[var(--section-card-border)]">
          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-[var(--section-subheading)] leading-tight">
              <span className="font-semibold text-[var(--section-heading)]">Punishment: </span>
              {item.punishment}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-muted/20 rounded-md p-2 border border-[var(--section-card-border)]">
          <Gavel className="h-3.5 w-3.5 text-teal shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-[var(--section-subheading)] leading-tight">
              <span className="font-semibold text-[var(--section-heading)]">Triable by: </span>
              {item.triableBy}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function SectionTable({
  items,
  highlightedSection,
}: {
  items: LegalSectionMapping[]
  highlightedSection: string | null
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-[var(--section-card-border)] bg-[var(--section-card-bg)] shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--section-card-border)] bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-[var(--section-subheading)]">
              <th className="py-3 px-4">IPC</th>
              <th className="py-3 px-4">BNS</th>
              <th className="py-3 px-4 min-w-[260px]">Offense &amp; Key Elements</th>
              <th className="py-3 px-4">Classification</th>
              <th className="py-3 px-4 min-w-[200px]">Punishment</th>
              <th className="py-3 px-4 min-w-[160px]">Triable by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--section-card-border)] text-xs">
            {items.map((item) => {
              const isHighlighted = highlightedSection === item.ipcSection
              const isNonBailable = item.bailable === 'Non-Bailable'

              return (
                <tr
                  key={item.ipcSection}
                  className={cn(
                    'transition-colors hover:bg-muted/30',
                    isHighlighted ? 'bg-teal/10' : ''
                  )}
                >
                  {/* IPC */}
                  <td className="py-3 px-4 align-top whitespace-nowrap">
                    <span className="font-mono font-bold text-[var(--section-heading)] bg-navy/80 text-gold-light dark:text-gold-champagne px-2 py-0.5 rounded border border-[var(--section-card-border)]">
                      IPC {item.ipcSection}
                    </span>
                  </td>

                  {/* BNS */}
                  <td className="py-3 px-4 align-top whitespace-nowrap">
                    <span className="font-mono font-bold text-white bg-teal px-2 py-0.5 rounded">
                      BNS {item.bnsSection}
                    </span>
                  </td>

                  {/* Offense & Key Elements */}
                  <td className="py-3 px-4 align-top">
                    <p className="font-bold text-[var(--section-heading)] text-sm mb-1">
                      {item.offense}
                    </p>
                    <p className="text-[11px] text-[var(--section-subheading)] leading-relaxed">
                      {item.keyElements}
                    </p>
                  </td>

                  {/* Badges */}
                  <td className="py-3 px-4 align-top whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border w-fit',
                          isNonBailable
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/25'
                            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25'
                        )}
                      >
                        {item.bailable}
                      </span>
                      <span className="text-[10px] text-[var(--section-subheading)] font-medium">
                        {item.cognizable}
                      </span>
                      {item.compoundable && (
                        <span className="text-[10px] text-violet-500 font-medium">
                          Compoundable
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Punishment */}
                  <td className="py-3 px-4 align-top text-[var(--section-subheading)]">
                    <span className="font-semibold text-[var(--section-heading)]">Punishment: </span>
                    {item.punishment}
                  </td>

                  {/* Triable by */}
                  <td className="py-3 px-4 align-top text-[var(--section-subheading)]">
                    <span className="font-semibold text-[var(--section-heading)]">Triable by: </span>
                    {item.triableBy}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ConcordanceMatrix({ initialQuery }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery ?? '')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [bailFilter, setBailFilter] = useState<BailFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
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

  function handleSearch(value: string) {
    setQuery(value)
    const exact = LEGAL_SECTIONS_DB.find(
      (item) =>
        item.ipcSection.toLowerCase() === value.toLowerCase() ||
        item.bnsSection.toLowerCase() === value.toLowerCase()
    )
    setHighlightedSection(exact ? exact.ipcSection : null)
  }

  function handleClearSearch() {
    setQuery('')
    setHighlightedSection(null)
  }

  const offenseCount = LEGAL_SECTIONS_DB.filter((i) => i.category === 'offense').length
  const procedureCount = LEGAL_SECTIONS_DB.filter((i) => i.category === 'procedure').length

  return (
    <div className="flex flex-col gap-5">
      {/* ── Search & Filter Command Bar ── */}
      <div className="rounded-xl border border-[var(--section-card-border)] bg-[var(--section-card-bg)] p-4 sm:p-5 shadow-xs flex flex-col gap-4">
        {/* Search input with icons and quick shortcut tags */}
        <div className="flex flex-col gap-2.5">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--section-subheading)] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by section (302, 103), offense (murder, theft), or keywords..."
              className="w-full pl-10 pr-10 py-3 rounded-lg bg-[var(--card)] border border-[var(--section-card-border)] text-sm font-medium text-[var(--section-heading)] placeholder:text-[var(--section-subheading)]/70 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[var(--section-subheading)] hover:text-[var(--section-heading)] hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick jump tags */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-[var(--section-subheading)]">
            <span className="text-[11px] font-semibold text-[var(--section-subheading)] uppercase tracking-wider mr-1">
              Quick Sections:
            </span>
            {QUICK_SECTIONS.map((sec) => (
              <button
                key={sec.label}
                type="button"
                onClick={() => handleSearch(sec.query)}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-mono font-medium border transition-colors cursor-pointer',
                  query === sec.query
                    ? 'bg-teal text-white border-teal'
                    : 'bg-muted/30 border-[var(--section-card-border)] text-[var(--section-heading)] hover:border-teal/50 hover:text-teal'
                )}
              >
                § {sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters and View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--section-card-border)]">
          {/* Filter pills */}
          <div className="flex flex-wrap items-center gap-2.5">
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

            <div className="w-px h-5 bg-[var(--section-card-border)] hidden sm:block" />

            {/* Bail pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <PillButton active={bailFilter === 'all'} onClick={() => setBailFilter('all')}>
                All Bail
              </PillButton>
              <PillButton
                active={bailFilter === 'bailable'}
                onClick={() => setBailFilter('bailable')}
                activeClass="bg-emerald-600 text-white border-emerald-600 shadow-xs"
              >
                Bailable
              </PillButton>
              <PillButton
                active={bailFilter === 'non-bailable'}
                onClick={() => setBailFilter('non-bailable')}
                activeClass="bg-rose-600 text-white border-rose-600 shadow-xs"
              >
                Non-Bailable
              </PillButton>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-[var(--section-card-border)] bg-[var(--card)] p-1">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Cards view"
              className={cn(
                'p-1.5 rounded-md transition-colors cursor-pointer',
                viewMode === 'cards'
                  ? 'bg-teal text-white shadow-xs'
                  : 'text-[var(--section-subheading)] hover:text-[var(--section-heading)]'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table view"
              className={cn(
                'p-1.5 rounded-md transition-colors cursor-pointer',
                viewMode === 'table'
                  ? 'bg-teal text-white shadow-xs'
                  : 'text-[var(--section-subheading)] hover:text-[var(--section-heading)]'
              )}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Results Count ── */}
      <div className="flex items-center justify-between gap-2 text-xs text-[var(--section-subheading)] px-1">
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-teal" />
          <span>
            Showing <strong className="text-[var(--section-heading)] font-semibold">{filtered.length}</strong> of{' '}
            <strong className="text-[var(--section-heading)] font-semibold">{LEGAL_SECTIONS_DB.length}</strong> entries
          </span>
        </span>
        {query && (
          <button
            onClick={handleClearSearch}
            className="text-teal hover:underline font-semibold cursor-pointer"
          >
            Clear search
          </button>
        )}
      </div>

      {/* ── Main Display: Cards or Table ── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--section-card-border)] bg-[var(--section-card-bg)] py-16 text-center text-[var(--section-subheading)] text-sm flex flex-col items-center justify-center gap-2">
          <AlertCircle className="h-8 w-8 text-muted/60" />
          <p>No sections found matching &ldquo;{query}&rdquo;.</p>
          <button
            onClick={handleClearSearch}
            className="mt-2 text-xs font-semibold text-teal hover:underline cursor-pointer"
          >
            Clear search
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <SectionTable
          items={filtered}
          highlightedSection={highlightedSection}
        />
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
