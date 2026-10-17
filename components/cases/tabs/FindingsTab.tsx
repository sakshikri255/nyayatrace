'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { XIcon, ExternalLinkIcon, AlertTriangleIcon, ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import type { FindingRow } from '@/lib/queries/findings'
import { cn } from 'cn'

interface FindingsTabProps {
  caseId: number
  findings: FindingRow[]
}

const severityConfig = {
  high: { label: 'High', className: 'bg-rose-100 text-rose-700 border-rose-200' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  low: { label: 'Low', className: 'bg-slate-100 text-slate-600 border-slate-200' },
} as const

const reviewConfig = {
  needs_review: { label: 'Needs Review', className: 'bg-amber-100 text-amber-700' },
  verified: { label: 'Verified', className: 'bg-emerald-100 text-emerald-700' },
  not_a_discrepancy: { label: 'Not a Discrepancy', className: 'bg-slate-100 text-slate-600' },
} as const

const typeLabels: Record<string, string> = {
  date_discrepancy: 'Date Discrepancy',
  name_variation: 'Name Variation',
  location_mismatch: 'Location Mismatch',
  missing_info: 'Missing Info',
  note: 'Note',
}

export function FindingsTab({ caseId, findings }: FindingsTabProps) {
  const [selected, setSelected] = useState<FindingRow | null>(null)

  if (findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangleIcon className="w-8 h-8 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">No findings recorded</p>
        <p className="text-xs text-slate-400 mt-1">
          Findings are identified during document processing.
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col gap-0">
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200">
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">Severity</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">Status</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-16">View</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((f) => {
              const sevCfg = severityConfig[f.severity] ?? severityConfig.medium
              const revCfg = reviewConfig[f.reviewStatus] ?? reviewConfig.needs_review
              return (
                <tr
                  key={f.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelected(f)}
                >
                  <td className="py-3 px-4">
                    <span className="text-xs font-medium text-slate-700">
                      {typeLabels[f.findingType] ?? f.findingType}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-sm">
                    <p className="text-sm text-slate-700 line-clamp-2">{f.description}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', sevCfg.className)}>
                      {sevCfg.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', revCfg.className)}>
                      {revCfg.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      className="inline-flex items-center gap-1 text-xs text-teal hover:text-teal-light font-medium transition-colors"
                      onClick={(e) => { e.stopPropagation(); setSelected(f) }}
                    >
                      View <ChevronRightIcon className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Slide-in drawer overlay */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            {/* Drawer */}
            <motion.div
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Drawer header */}
              <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sticky top-0 bg-white z-10">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
                    {typeLabels[selected.findingType] ?? selected.findingType}
                  </p>
                  <h2 className="text-base font-bold text-slate-900 leading-snug">{selected.description}</h2>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="ml-4 mt-0.5 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4 px-5 py-4">
                {/* Badges */}
                <div className="flex gap-2 flex-wrap">
                  {(() => {
                    const sc = severityConfig[selected.severity] ?? severityConfig.medium
                    const rc = reviewConfig[selected.reviewStatus] ?? reviewConfig.needs_review
                    return (
                      <>
                        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', sc.className)}>
                          {sc.label} Severity
                        </span>
                        <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', rc.className)}>
                          {rc.label}
                        </span>
                      </>
                    )
                  })()}
                </div>

                {/* Extracted value */}
                {selected.extractedValue && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Primary Passage</p>
                    <blockquote className="border-l-2 border-teal pl-3 bg-slate-50 py-2 pr-3 rounded-r-md">
                      <p className="text-sm text-slate-700 italic">&ldquo;{selected.extractedValue}&rdquo;</p>
                    </blockquote>
                  </div>
                )}

                {/* Comparison value */}
                {selected.comparisonValue && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Comparison Passage</p>
                    <blockquote className="border-l-2 border-amber-400 pl-3 bg-amber-50/60 py-2 pr-3 rounded-r-md">
                      <p className="text-sm text-slate-700 italic">&ldquo;{selected.comparisonValue}&rdquo;</p>
                    </blockquote>
                  </div>
                )}

                {/* Review metadata */}
                {(selected.reviewedBy || selected.reviewedAt) && (
                  <div className="rounded-md bg-slate-50 border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Review Details</p>
                    {selected.reviewedBy && (
                      <p className="text-xs text-slate-600">Reviewed by: {selected.reviewedBy}</p>
                    )}
                    {selected.reviewedAt && (
                      <p className="text-xs text-slate-500 mt-0.5">At: {selected.reviewedAt}</p>
                    )}
                  </div>
                )}

                {/* Link to workspace */}
                <Link
                  href={`/verification/${caseId}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:text-teal-light transition-colors mt-2"
                >
                  Open in Verification Workspace
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
