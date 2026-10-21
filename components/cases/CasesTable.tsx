'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FileTextIcon, AlertTriangleIcon, EyeIcon, FolderOpenIcon, ClockIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { CaseStatusBadge, CaseTypeBadge } from './CaseStatusBadge'
import { DeleteCaseDialog } from './DeleteCaseDialog'
import type { CaseWithCounts } from '@/lib/queries/cases'
import { calculateStatutoryBail } from '@/lib/analysis/statutoryBail'

interface CasesTableProps {
  cases: CaseWithCounts[]
  onDeleteCase?: (id: number) => void
}

export function CasesTable({ cases, onDeleteCase }: CasesTableProps) {
  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderOpenIcon className="w-10 h-10 text-[var(--section-subheading)] mb-3" />
        <p className="text-sm font-medium text-[var(--section-subheading)]">No cases found</p>
        <p className="text-xs text-[var(--section-subheading)] mt-1">
          Try adjusting your search or filters.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--section-card-border)] text-left">
            <th className="py-3 px-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-36">
              Case ID
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide">
              Title
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-24">
              Type
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-24">
              Status
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-24 text-center">
              Docs
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-28 text-center">
              Findings
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-32">
              Last Activity
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-48 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c, i) => (
            <motion.tr
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06, ease: 'easeOut' }}
              className="border-b border-[var(--section-card-border)] hover:bg-[var(--table-row-hover)] transition-colors duration-150 group"
            >
              {/* Case Number */}
              <td className="py-3 px-4">
                <span className="font-mono text-xs text-teal font-semibold tracking-tight">
                  {c.caseNumber}
                </span>
              </td>

              {/* Title */}
              <td className="py-3 px-4 max-w-xs">
                <Link
                  href={`/cases/${c.id}`}
                  className="font-medium text-[var(--table-row-text)] hover:text-teal transition-colors line-clamp-2"
                >
                  {c.title}
                </Link>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[var(--section-subheading)] flex-wrap">
                  {c.advocate && (
                    <span className="font-semibold text-[11px] text-teal-800 dark:text-teal-300 bg-teal/10 px-1.5 py-0.2 rounded">
                      Adv. {c.advocate}
                    </span>
                  )}
                  {c.court && <span className="truncate">{c.court}</span>}
                </div>
              </td>

              {/* Type */}
              <td className="py-3 px-4">
                <CaseTypeBadge caseType={c.caseType} />
              </td>

              {/* Status */}
              <td className="py-3 px-4">
                <div className="flex flex-col gap-1">
                  <CaseStatusBadge status={c.status} />
                  {(() => {
                    const bail = calculateStatutoryBail(c)
                    if (bail.status === 'accrued') {
                      return (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-500 border border-rose-500/20">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
                        </span>
                        Default Bail Accrued
                      </span>
                    )
                  }
                  if (bail.status === 'urgent') {
                    return (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500 border border-amber-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {bail.daysRemaining}d to Default Bail
                      </span>
                      )
                    }
                    return null
                  })()}
                </div>
              </td>

              {/* Docs count */}
              <td className="py-3 px-4 text-center">
                <span className="inline-flex items-center gap-1 text-[var(--table-row-text)]">
                  <FileTextIcon className="w-3.5 h-3.5 text-[var(--section-subheading)]" />
                  <span className="text-xs font-medium">{c.documentCount}</span>
                </span>
              </td>

              {/* Findings count */}
              <td className="py-3 px-4 text-center">
                <span
                  className={`inline-flex items-center gap-1 ${
                    c.findingCount > 0 ? 'text-amber-500' : 'text-[var(--section-subheading)]'
                  }`}
                >
                  <AlertTriangleIcon className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{c.findingCount}</span>
                </span>
              </td>

              {/* Last Activity */}
              <td className="py-3 px-4">
                <span className="text-xs text-[var(--section-subheading)]" suppressHydrationWarning>
                  {c.updatedAt
                    ? formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })
                    : '—'}
                </span>
              </td>

              {/* Actions */}
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Link
                    href={`/cases/${c.id}?tab=chronology`}
                    title="View Chronology & Checkpoints for this case"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--section-subheading)] hover:text-teal transition-colors px-2 py-1 rounded border border-[var(--section-card-border)] hover:border-teal/40 hover:bg-teal/5"
                  >
                    <ClockIcon className="w-3 h-3 text-teal" />
                    <span>Chronology</span>
                  </Link>

                  <Link
                    href={`/cases/${c.id}`}
                    title="Open Case Record Workspace"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-teal hover:bg-teal-light transition-colors px-2.5 py-1 rounded shadow-xs"
                  >
                    <EyeIcon className="w-3.5 h-3.5" />
                    <span>View</span>
                  </Link>

                  <DeleteCaseDialog
                    caseId={c.id}
                    caseNumber={c.caseNumber}
                    caseTitle={c.title}
                    variant="icon"
                    onDeleted={() => onDeleteCase?.(c.id)}
                  />
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
