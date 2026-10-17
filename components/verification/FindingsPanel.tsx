'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  CheckCircle2Icon,
  CircleDotIcon,
  XCircleIcon,
  AlertTriangleIcon,
  ChevronDownIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FindingWithSources } from '@/lib/queries/findings'

interface Props {
  findings: FindingWithSources[]
  selectedFindingId: number | null
  onSelectFinding: (id: number) => void
  onFindingUpdate: (updated: FindingWithSources) => void
}

// ─── Config maps ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  date_discrepancy: { label: 'Date', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  location_mismatch: { label: 'Location', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  name_variation: { label: 'Name', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  missing_info: { label: 'Missing', className: 'bg-red-100 text-red-600 border-red-200' },
  note: { label: 'Note', className: 'bg-slate-100 text-slate-600 border-slate-200' },
}

const SEVERITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-300',
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; activeClass: string }
> = {
  needs_review: {
    label: 'Needs Review',
    className: 'bg-amber-100 text-amber-700',
    activeClass: 'ring-1 ring-amber-400',
  },
  verified: {
    label: 'Verified',
    className: 'bg-emerald-100 text-emerald-700',
    activeClass: 'ring-1 ring-emerald-400',
  },
  not_a_discrepancy: {
    label: 'Not a Discrepancy',
    className: 'bg-slate-100 text-slate-600',
    activeClass: 'ring-1 ring-slate-400',
  },
}

// ─── Review action button ─────────────────────────────────────────────────────

interface ReviewButtonProps {
  label: string
  icon: React.ReactNode
  isActive: boolean
  disabled: boolean
  colorClass: string
  onClick: () => void
}

function ReviewButton({ label, icon, isActive, disabled, colorClass, onClick }: ReviewButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-semibold transition-all',
        colorClass,
        isActive && 'shadow-sm',
        !isActive && 'opacity-70 hover:opacity-100',
        disabled && 'pointer-events-none'
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  )
}

// ─── Passage block ────────────────────────────────────────────────────────────

function PassageBlock({
  label,
  passage,
  docName,
  pageNumber,
  colorClass,
}: {
  label: string
  passage: string
  docName?: string | null
  pageNumber?: number | null
  colorClass: string
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</p>
      <blockquote
        className={cn(
          'rounded-r-md border-l-2 pl-3 py-2 pr-3 text-sm',
          colorClass
        )}
      >
        <p className="text-slate-700 italic leading-relaxed">&ldquo;{passage}&rdquo;</p>
        {(docName || pageNumber) && (
          <p className="mt-1.5 text-xs text-slate-400 not-italic">
            — {docName}
            {pageNumber != null && `, Page ${pageNumber}`}
          </p>
        )}
      </blockquote>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FindingsPanel({
  findings,
  selectedFindingId,
  onSelectFinding,
  onFindingUpdate,
}: Props) {
  const [updating, setUpdating] = useState<number | null>(null)

  const handleReview = useCallback(
    async (
      finding: FindingWithSources,
      status: 'verified' | 'needs_review' | 'not_a_discrepancy'
    ) => {
      if (updating !== null) return

      // Optimistic update
      const optimistic: FindingWithSources = {
        ...finding,
        reviewStatus: status,
        reviewedAt: new Date().toISOString(),
      }
      onFindingUpdate(optimistic)
      setUpdating(finding.id)

      try {
        const res = await fetch(`/api/findings/${finding.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewStatus: status }),
        })

        if (!res.ok) throw new Error('Update failed')

        const updated = (await res.json()) as FindingWithSources
        onFindingUpdate(updated)

        const statusLabels: Record<string, string> = {
          verified: 'Verified',
          needs_review: 'Needs Review',
          not_a_discrepancy: 'Not a Discrepancy',
        }
        toast.success(`Finding marked as ${statusLabels[status] ?? status}`)
      } catch {
        // Revert optimistic update
        onFindingUpdate(finding)
        toast.error('Failed to update finding status')
      } finally {
        setUpdating(null)
      }
    },
    [onFindingUpdate, updating]
  )

  if (findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 py-10 text-center">
        <AlertTriangleIcon className="w-8 h-8 text-slate-200 mb-3" />
        <p className="text-sm font-medium text-slate-500">No findings for this case</p>
        <p className="text-xs text-slate-400 mt-1">
          Findings appear after document processing.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Findings
        </span>
        <span className="text-xs text-slate-400">{findings.length}</span>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-slate-100">
          {findings.map((finding) => {
            const isSelected = finding.id === selectedFindingId
            const typeCfg = TYPE_CONFIG[finding.findingType] ?? TYPE_CONFIG.note
            const statusCfg = STATUS_CONFIG[finding.reviewStatus] ?? STATUS_CONFIG.needs_review
            const sevDot = SEVERITY_DOT[finding.severity] ?? SEVERITY_DOT.low
            const isUpdating = updating === finding.id

            const primarySource = finding.sources.find((s) => s.role === 'primary')
            const compSource = finding.sources.find((s) => s.role === 'comparison')

            return (
              <li key={finding.id}>
                {/* Collapsed card */}
                <motion.button
                  className={cn(
                    'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50',
                    isSelected && 'border-l-2 border-teal bg-teal/5 hover:bg-teal/5'
                  )}
                  onClick={() => onSelectFinding(finding.id)}
                  layout
                >
                  {/* Severity dot */}
                  <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', sevDot)} />

                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span
                        className={cn(
                          'inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-semibold',
                          typeCfg.className
                        )}
                      >
                        {typeCfg.label}
                      </span>
                      {/* Animated status badge */}
                      <motion.span
                        key={finding.reviewStatus}
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className={cn(
                          'inline-flex px-1.5 py-0.5 rounded text-xs font-medium',
                          statusCfg.className,
                          isSelected && statusCfg.activeClass
                        )}
                      >
                        {statusCfg.label}
                      </motion.span>
                    </div>

                    <p className="text-sm text-slate-700 line-clamp-2 leading-snug">
                      {finding.description}
                    </p>
                  </div>

                  <ChevronDownIcon
                    className={cn(
                      'w-4 h-4 text-slate-400 shrink-0 mt-0.5 transition-transform',
                      isSelected && 'rotate-180'
                    )}
                  />
                </motion.button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <motion.div
                        className={cn(
                          'px-4 pb-4 pt-2 flex flex-col gap-3 border-b border-slate-100',
                          finding.reviewStatus === 'verified' && 'bg-emerald-50/40',
                          finding.reviewStatus === 'needs_review' && 'bg-amber-50/30',
                        )}
                        key={finding.reviewStatus}
                        animate={
                          finding.reviewStatus === 'verified'
                            ? { backgroundColor: ['rgba(236,253,245,0)', 'rgba(236,253,245,0.6)', 'rgba(236,253,245,0.4)'] }
                            : {}
                        }
                        transition={{ duration: 0.5 }}
                      >
                        {/* Full description */}
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            Description
                          </p>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {finding.description}
                          </p>
                        </div>

                        {/* Primary passage */}
                        {primarySource?.passage && (
                          <PassageBlock
                            label="Primary Passage"
                            passage={primarySource.passage}
                            docName={primarySource.documentName}
                            pageNumber={primarySource.pageNumber}
                            colorClass="border-teal bg-slate-50"
                          />
                        )}

                        {/* Comparison passage */}
                        {compSource?.passage && (
                          <PassageBlock
                            label="Comparison Passage"
                            passage={compSource.passage}
                            docName={compSource.documentName}
                            pageNumber={compSource.pageNumber}
                            colorClass="border-amber-400 bg-amber-50/60"
                          />
                        )}

                        {/* Extracted / comparison values */}
                        {(finding.extractedValue || finding.comparisonValue) && (
                          <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs">
                            {finding.extractedValue && (
                              <p className="text-slate-700">
                                <span className="font-semibold text-slate-500">Document says:</span>{' '}
                                {finding.extractedValue}
                              </p>
                            )}
                            {finding.comparisonValue && (
                              <p className="text-slate-700 mt-1">
                                <span className="font-semibold text-slate-500">Comparison:</span>{' '}
                                {finding.comparisonValue}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Review actions */}
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            Review Action
                          </p>
                          <div className="flex gap-2">
                            <ReviewButton
                              label="Verify"
                              icon={<CheckCircle2Icon className="w-3.5 h-3.5" />}
                              isActive={finding.reviewStatus === 'verified'}
                              disabled={isUpdating}
                              colorClass={cn(
                                'border-emerald-200',
                                finding.reviewStatus === 'verified'
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                  : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                              )}
                              onClick={() => handleReview(finding, 'verified')}
                            />
                            <ReviewButton
                              label="Needs Review"
                              icon={<CircleDotIcon className="w-3.5 h-3.5" />}
                              isActive={finding.reviewStatus === 'needs_review'}
                              disabled={isUpdating}
                              colorClass={cn(
                                'border-amber-200',
                                finding.reviewStatus === 'needs_review'
                                  ? 'bg-amber-100 text-amber-700 border-amber-300'
                                  : 'bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
                              )}
                              onClick={() => handleReview(finding, 'needs_review')}
                            />
                            <ReviewButton
                              label="Not a Discrepancy"
                              icon={<XCircleIcon className="w-3.5 h-3.5" />}
                              isActive={finding.reviewStatus === 'not_a_discrepancy'}
                              disabled={isUpdating}
                              colorClass={cn(
                                'border-slate-200',
                                finding.reviewStatus === 'not_a_discrepancy'
                                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300'
                              )}
                              onClick={() => handleReview(finding, 'not_a_discrepancy')}
                            />
                          </div>
                        </div>

                        {/* Last reviewed info */}
                        {finding.reviewedBy && (
                          <p className="text-xs text-slate-400">
                            Last reviewed by {finding.reviewedBy}
                            {finding.reviewedAt && (
                              <>
                                {' '}·{' '}
                                {new Date(finding.reviewedAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </>
                            )}
                          </p>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
