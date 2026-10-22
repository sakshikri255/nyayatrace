'use client'

import { useMemo, useState } from 'react'
import type { EvidenceReference } from '@/lib/analysis/synopsis'
import ExecutiveLegalCard from '@/components/ExecutiveLegalCard'
import { categorizeLegalText, cleanOcrText, type LegalCategory } from '@/lib/legalSanitizer'

interface ExtractedQuotesSectionProps {
  rawQuotes: EvidenceReference[]
  onOpen: (quote: EvidenceReference) => void
}

const CATEGORY_TABS: Array<{ id: LegalCategory | 'ALL'; label: string; activeClass: string; idleClass: string }> = [
  { id: 'ALL', label: 'All', activeClass: 'bg-slate-900 text-white', idleClass: 'bg-slate-100 text-slate-600 hover:bg-slate-200' },
  { id: 'JURISDICTION', label: '🚨 Jurisdiction', activeClass: 'bg-red-600 text-white', idleClass: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100' },
  { id: 'COMPENSATION', label: '💰 Compensation', activeClass: 'bg-amber-600 text-white', idleClass: 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { id: 'PROCEDURE', label: '📜 Procedural', activeClass: 'bg-blue-600 text-white', idleClass: 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' },
  { id: 'LIMITATION', label: '📅 Limitation', activeClass: 'bg-emerald-600 text-white', idleClass: 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
]

export function ExtractedQuotesSection({ rawQuotes, onOpen }: ExtractedQuotesSectionProps) {
  const [activeTab, setActiveTab] = useState<LegalCategory | 'ALL'>('ALL')

  const cleanedQuotes = useMemo(() => rawQuotes.map((quote, index) => {
    const text = cleanOcrText(quote.passage)
    return {
      ...quote,
      id: `${quote.documentId}-${quote.pageNumber}-${index}`,
      text,
      ...categorizeLegalText(text),
    }
  }), [rawQuotes])

  const filteredQuotes = useMemo(
    () => activeTab === 'ALL'
      ? cleanedQuotes
      : cleanedQuotes.filter((quote) => quote.category === activeTab),
    [activeTab, cleanedQuotes]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 pb-2" role="group" aria-label="Filter quotes by legal category">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === tab.id ? tab.activeClass : tab.idleClass
            }`}
          >
            {tab.label}{tab.id === 'ALL' ? ` (${cleanedQuotes.length})` : ''}
          </button>
        ))}
      </div>

      {filteredQuotes.length === 0 ? (
        <p className="text-xs italic text-slate-500">
          {cleanedQuotes.length ? 'No quotes in this category.' : 'No key facts available.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredQuotes.map((quote) => (
            <ExecutiveLegalCard
              key={quote.id}
              rawText={quote.passage}
              page={quote.pageNumber}
              fileName={quote.documentName}
              onOpen={() => onOpen(quote)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
