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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ y: -5, transition: { type: 'spring', stiffness: 350, damping: 25 } }}
      className="h-full"
    >
      <Link
        href={`/cases/${caseData.id}`}
        className="group relative flex flex-col justify-between h-full rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-teal/50 hover:shadow-lg transition-all duration-300 overflow-hidden"
      >
        {/* Top decorative glow strip on hover */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Header: Case Number & Badges */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="font-mono text-xs font-bold text-teal tracking-tight group-hover:underline">
              {caseData.caseNumber}
            </span>
            <div className="flex items-center gap-1.5">
              <CaseTypeBadge caseType={caseData.caseType} />
              <CaseStatusBadge status={caseData.status} />
            </div>
          </div>

          {/* Title */}
          <h2 className="font-bold text-slate-900 group-hover:text-teal transition-colors text-base line-clamp-2 leading-snug">
            {caseData.title}
          </h2>

          {/* Court / Forum */}
          {caseData.court && (
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 truncate">
              <Gavel className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{caseData.court}</span>
            </p>
          )}

          {/* Advocate & Bench */}
          <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs">
            {caseData.advocate && (
              <span className="inline-flex items-center gap-1 rounded-md bg-teal/10 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
                <User className="w-3 h-3 text-teal" />
                <span>Adv. {caseData.advocate}</span>
              </span>
            )}
            {caseData.judge && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 truncate" title={caseData.judge}>
                <Scale className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">Bench: {caseData.judge.split(',')[0]}</span>
              </span>
            )}
          </div>
        </div>

        {/* Clean Minimal Footer: Document & Finding metrics + Open Link */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1" title="Documents indexed">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span><strong>{caseData.documentCount}</strong> docs</span>
            </span>

            {caseData.findingCount > 0 && (
              <span className="flex items-center gap-1 text-amber-700 font-medium" title="Discrepancies flagged">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span><strong>{caseData.findingCount}</strong> findings</span>
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal group-hover:text-teal-hover transition-colors">
            <span>Open Case</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
