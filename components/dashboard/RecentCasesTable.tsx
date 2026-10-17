'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { RecentCase } from '@/lib/queries/cases'
import { CaseStatusBadge } from '@/components/cases/CaseStatusBadge'

interface RecentCasesTableProps {
  cases: RecentCase[]
}

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

export function RecentCasesTable({ cases }: RecentCasesTableProps) {
  if (cases.length === 0) {
    return (
      <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6 text-center text-sm text-gray-400">
        No cases found.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">Recent Cases</h3>
        <p className="text-xs text-gray-400 mt-0.5">Last 5 updated cases</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left text-xs font-medium text-gray-500 px-5 py-2.5">Case ID</th>
            <th className="text-left text-xs font-medium text-gray-500 px-5 py-2.5">Title</th>
            <th className="text-left text-xs font-medium text-gray-500 px-5 py-2.5">Status</th>
            <th className="text-left text-xs font-medium text-gray-500 px-5 py-2.5">Docs</th>
            <th className="text-left text-xs font-medium text-gray-500 px-5 py-2.5">Last Activity</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c, i) => (
            <motion.tr
              key={c.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25, ease: 'easeOut' }}
              className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <td className="px-5 py-3">
                <span className="font-mono text-xs text-teal">{c.caseNumber}</span>
              </td>
              <td className="px-5 py-3 max-w-[260px]">
                <Link
                  href={`/cases/${c.id}`}
                  className="text-gray-800 font-medium hover:text-teal transition-colors line-clamp-1"
                >
                  {c.title}
                </Link>
              </td>
              <td className="px-5 py-3">
                <CaseStatusBadge status={c.status} />
              </td>
              <td className="px-5 py-3 text-gray-500">{c.documentCount}</td>
              <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                {relativeDate(c.lastActivity)}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
