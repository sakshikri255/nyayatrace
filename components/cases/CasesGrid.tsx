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
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-200">
        <FolderOpenIcon className="w-10 h-10 text-slate-300 mb-3" />
        <p className="text-sm font-semibold text-slate-600">No cases match these filters</p>
        <p className="text-xs text-slate-400 mt-1">
          Try clearing your search query or selecting a different status/type filter.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
