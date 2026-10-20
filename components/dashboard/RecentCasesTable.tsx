'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { RecentCase } from '@/lib/queries/cases'
import { CaseStatusBadge } from '@/components/cases/CaseStatusBadge'

interface RecentCasesTableProps {
  cases: RecentCase[]
  theme?: 'light' | 'dark'
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

export function RecentCasesTable({ cases, theme = 'light' }: RecentCasesTableProps) {
  const isDark = theme === 'dark'

  if (cases.length === 0) {
    return (
      <div
        className={
          isDark
            ? 'rounded-2xl border border-white/10 bg-midnight-950/80 p-8 text-center text-sm text-slate-400 font-light'
            : 'bg-white border border-gray-200 shadow-sm rounded-lg p-6 text-center text-sm text-gray-400'
        }
      >
        No recent cases found in your workspace.
      </div>
    )
  }

  return (
    <div
      className={
        isDark
          ? 'rounded-2xl border border-white/10 bg-midnight-950/80 shadow-lg overflow-hidden'
          : 'bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden'
      }
    >
      <div
        className={`px-5 py-4 flex items-center justify-between ${
          isDark ? 'border-b border-white/10' : 'border-b border-gray-100'
        }`}
      >
        <div>
          <h3 className={isDark ? 'font-serif text-sm font-medium text-slate-100' : 'text-sm font-semibold text-gray-800'}>
            Recent Cases
          </h3>
          <p className={isDark ? 'text-xs text-slate-400 font-light mt-0.5' : 'text-xs text-gray-400 mt-0.5'}>
            Last 5 updated cases in active workspace
          </p>
        </div>
        <Link
          href="/cases"
          className={`text-xs font-medium transition-colors ${
            isDark ? 'text-gold-light hover:text-gold hover:underline' : 'text-teal hover:underline'
          }`}
        >
          View all cases →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className={`border-b text-left text-xs font-medium ${
                isDark
                  ? 'border-white/10 bg-white/[0.02] text-slate-400'
                  : 'border-gray-100 bg-gray-50 text-gray-500'
              }`}
            >
              <th className="px-5 py-3 font-medium">Case ID</th>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Docs</th>
              <th className="px-5 py-3 font-medium">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c, i) => (
              <motion.tr
                key={c.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25, ease: 'easeOut' }}
                className={`border-b transition-colors ${
                  isDark
                    ? 'border-white/5 hover:bg-white/[0.03]'
                    : 'border-gray-50 hover:bg-gray-50'
                }`}
              >
                <td className="px-5 py-3">
                  <span className={`font-mono text-xs ${isDark ? 'text-teal-light' : 'text-teal'}`}>
                    {c.caseNumber}
                  </span>
                </td>
                <td className="px-5 py-3 max-w-[280px]">
                  <Link
                    href={`/cases/${c.id}`}
                    className={`font-medium transition-colors line-clamp-1 ${
                      isDark ? 'text-slate-200 hover:text-gold-light' : 'text-gray-800 hover:text-teal'
                    }`}
                  >
                    {c.title}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <CaseStatusBadge status={c.status} />
                </td>
                <td className={`px-5 py-3 ${isDark ? 'text-slate-400 font-mono text-xs' : 'text-gray-500'}`}>
                  {c.documentCount}
                </td>
                <td className={`px-5 py-3 text-xs whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                  {relativeDate(c.lastActivity)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default RecentCasesTable
