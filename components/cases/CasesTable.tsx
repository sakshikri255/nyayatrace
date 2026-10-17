'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FileTextIcon, AlertTriangleIcon, EyeIcon, FolderOpenIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { CaseStatusBadge, CaseTypeBadge } from './CaseStatusBadge'
import type { CaseWithCounts } from '@/lib/queries/cases'

interface CasesTableProps {
  cases: CaseWithCounts[]
}

export function CasesTable({ cases }: CasesTableProps) {
  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderOpenIcon className="w-10 h-10 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-500">No cases found</p>
        <p className="text-xs text-slate-400 mt-1">
          Try adjusting your search or filters.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left">
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">
              Case ID
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Title
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">
              Type
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">
              Status
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24 text-center">
              Docs
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28 text-center">
              Findings
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">
              Last Activity
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">
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
              className="border-b border-slate-100 hover:bg-charcoal/[0.04] transition-colors duration-150 group"
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
                  className="font-medium text-slate-800 hover:text-teal transition-colors line-clamp-2"
                >
                  {c.title}
                </Link>
                {c.court && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{c.court}</p>
                )}
              </td>

              {/* Type */}
              <td className="py-3 px-4">
                <CaseTypeBadge caseType={c.caseType} />
              </td>

              {/* Status */}
              <td className="py-3 px-4">
                <CaseStatusBadge status={c.status} />
              </td>

              {/* Docs count */}
              <td className="py-3 px-4 text-center">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <FileTextIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium">{c.documentCount}</span>
                </span>
              </td>

              {/* Findings count */}
              <td className="py-3 px-4 text-center">
                <span
                  className={`inline-flex items-center gap-1 ${
                    c.findingCount > 0 ? 'text-amber-600' : 'text-slate-400'
                  }`}
                >
                  <AlertTriangleIcon className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{c.findingCount}</span>
                </span>
              </td>

              {/* Last Activity */}
              <td className="py-3 px-4">
                <span className="text-xs text-slate-500">
                  {c.updatedAt
                    ? formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })
                    : '—'}
                </span>
              </td>

              {/* Actions */}
              <td className="py-3 px-4">
                <Link
                  href={`/cases/${c.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-teal hover:text-teal-light transition-colors px-2 py-1 rounded border border-teal/30 hover:border-teal/60 hover:bg-teal/5"
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  View
                </Link>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
