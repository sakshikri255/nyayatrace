'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  FileText,
  AlertTriangle,
  Gavel,
  ArrowRight,
  User,
  Scale,
} from 'lucide-react'
import { CaseStatusBadge, CaseTypeBadge } from './CaseStatusBadge'
import type { CaseWithCounts } from '@/lib/queries/cases'

interface CaseCardProps {
  caseData: CaseWithCounts
  index: number
  onDeleteCase?: (id: number) => void
}

export function CaseCard({
  caseData,
  index,
}: CaseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04, ease: 'easeOut' }}
    >
      <Link
        href={`/cases/${caseData.id}`}
        className="group flex items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-white/[0.08] bg-transparent hover:bg-teal/[0.03] transition-colors"
      >
        {/* Left: case number + title */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-xs font-bold text-teal tracking-tight shrink-0">
              {caseData.caseNumber}
            </span>
            <CaseTypeBadge caseType={caseData.caseType} />
          </div>
          <h2 className="font-semibold text-[var(--section-heading)] group-hover:text-teal transition-colors text-sm line-clamp-1 leading-snug">
            {caseData.title}
          </h2>
        </div>

        {/* Center: court + advocate */}
        <div className="hidden md:flex flex-col gap-0.5 min-w-0 w-52 shrink-0">
          {caseData.court && (
            <p className="text-xs text-[var(--section-subheading)] flex items-center gap-1 truncate">
              <Gavel className="w-3 h-3 shrink-0" />
              <span className="truncate">{caseData.court}</span>
            </p>
          )}
          {caseData.advocate && (
            <p className="text-xs text-[var(--section-subheading)] flex items-center gap-1 truncate">
              <User className="w-3 h-3 shrink-0" />
              <span className="truncate">Adv. {caseData.advocate}</span>
            </p>
          )}
          {caseData.judge && (
            <p className="text-xs text-[var(--section-subheading)] flex items-center gap-1 truncate">
              <Scale className="w-3 h-3 shrink-0" />
              <span className="truncate">{caseData.judge.split(',')[0]}</span>
            </p>
          )}
        </div>

        {/* Right: status badge + counts + open link */}
        <div className="flex items-center gap-3 shrink-0">
          <CaseStatusBadge status={caseData.status} />

          <span className="hidden sm:flex items-center gap-1 text-xs text-[var(--section-subheading)]" title="Documents">
            <FileText className="w-3.5 h-3.5" />
            <span>{caseData.documentCount}</span>
          </span>

          {caseData.findingCount > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-amber-500 font-medium" title="Findings">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{caseData.findingCount}</span>
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal group-hover:text-teal-hover transition-colors">
            Open
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
