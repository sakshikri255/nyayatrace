'use client'

import React from 'react'
import { FolderOpenIcon } from 'lucide-react'
import { CaseCard } from './CaseCard'
import type { CaseWithCounts } from '@/lib/queries/cases'

interface CasesGridProps {
  cases: CaseWithCounts[]
  onDeleteCase?: (id: number) => void
}

export function CasesGrid({
  cases,
  onDeleteCase,
}: CasesGridProps) {
  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderOpenIcon className="w-10 h-10 text-[var(--section-subheading)] mb-3 opacity-40" />
        <p className="text-sm font-semibold text-[var(--section-heading)]">No cases match these filters</p>
        <p className="text-xs text-[var(--section-subheading)] mt-1">
          Try clearing your search query or selecting a different status/type filter.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.08]">
      {cases.map((c, i) => (
        <CaseCard
          key={c.id}
          caseData={c}
          index={i}
          onDeleteCase={onDeleteCase}
        />
      ))}
    </div>
  )
}
