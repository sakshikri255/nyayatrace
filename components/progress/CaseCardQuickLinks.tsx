'use client'

import Link from 'next/link'
import { ScaleIcon, SearchIcon, FileTextIcon } from 'lucide-react'

interface CaseCardQuickLinksProps {
  caseId: number
}

export function CaseCardQuickLinks({ caseId }: CaseCardQuickLinksProps) {
  return (
    <div
      className="flex items-center gap-1.5"
      onClick={(e) => e.preventDefault()}
    >
      <Link
        href={`/bail-briefs/${caseId}`}
        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-[11px] font-medium text-slate-400 hover:border-teal/40 hover:text-teal transition-colors"
        title="Bail & Parole"
      >
        <ScaleIcon className="w-3 h-3" />
      </Link>
      <Link
        href={`/verification/${caseId}`}
        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-[11px] font-medium text-slate-400 hover:border-teal/40 hover:text-teal transition-colors"
        title="Verification"
      >
        <SearchIcon className="w-3 h-3" />
      </Link>
      <Link
        href={`/reports/${caseId}`}
        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-[11px] font-medium text-slate-400 hover:border-teal/40 hover:text-teal transition-colors"
        title="Report"
      >
        <FileTextIcon className="w-3 h-3" />
      </Link>
    </div>
  )
}
