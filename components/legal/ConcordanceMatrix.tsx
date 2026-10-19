'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, ArrowRight } from 'lucide-react'
import { LEGAL_SECTIONS_DB, type LegalSectionMapping } from '@/lib/legal/sections'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

type CategoryFilter = 'all' | 'offense' | 'procedure' | 'evidence'
type BailFilter = 'all' | 'bailable' | 'non-bailable'

function SectionCard({ item, highlighted }: { item: LegalSectionMapping; highlighted: boolean }) {
  const isNonBailable = item.bailable === 'Non-Bailable'
  const isProcedure = item.category === 'procedure'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={cn(
        'rounded-xl border p-4 transition-all text-sm',
        highlighted ? 'ring-2 ring-teal-500 shadow-md' : '',
        isNonBailable
          ? 'border-rose-200 bg-rose-50/60'
          : 'border-emerald-200 bg-emerald-50/60',
        isProcedure && 'border-blue-200 bg-blue-50/60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5">
            IPC {item.ipcSection}
          </span>
          <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5">
            BNS {item.bnsSection}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 shrink-0">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold border',
              isNonBailable
                ? 'bg-rose-100 text-rose-700 border-rose-300'
                : 'bg-emerald-100 text-emerald-700 border-emerald-300'
            )}
          >
            {item.bailable}
          </span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-slate-100 text-slate-600 border-slate-300">
            {item.cognizable}
          </span>
          {item.compoundable && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-violet-100 text-violet-700 border-violet-300">
              Compoundable
            </span>
          )}
        </div>
      </div>

      {/* Offense name */}
      <p className="font-semibold text-slate-900 mb-1.5 leading-snug">{item.offense}</p>

      {/* Punishment */}
      <p className="text-xs text-slate-500 mb-2">
        <span className="font-medium text-slate-600">Punishment: </span>{item.punishment}
      </p>

      {/* Key elements */}
      <p className="text-xs text-slate-600 leading-relaxed bg-white/70 rounded-md p-2 border border-slate-100">
        {item.keyElements}
      </p>

      {/* Trial court */}
      <p className="text-[11px] text-slate-400 mt-2">
        <span className="font-medium">Triable by: </span>{item.triableBy}
      </p>
    </motion.div>
  )
}

export function ConcordanceMatrix() {
  const [query, setQuery] = useState('')
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
      {/* Search + filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by section (302, 103), offense (murder, theft), or keywords..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Filter className="h-4 w-4 text-slate-400" />
          {/* Category chips */}
          {(['all', 'offense', 'procedure'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors border',
                categoryFilter === cat
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              {cat === 'all' ? `All (${LEGAL_SECTIONS_DB.length})` : cat === 'offense' ? `Offenses (${offenseCount})` : `Procedure (${procedureCount})`}
            </button>
          ))}
          <div className="w-px h-4 bg-slate-200" />
          {/* Bailable chips */}
          {(['all', 'bailable', 'non-bailable'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBailFilter(b)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors border',
                bailFilter === b
                  ? b === 'non-bailable'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : b === 'bailable'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              {b === 'all' ? 'All Bail' : b === 'bailable' ? 'Bailable' : 'Non-Bailable'}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-700">{filtered.length}</strong> of{' '}
          <strong className="text-slate-700">{LEGAL_SECTIONS_DB.length}</strong> entries
        </span>
        {query && (
          <button
            onClick={() => { setQuery(''); setHighlightedSection(null) }}
            className="text-teal-600 hover:underline font-medium"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
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
