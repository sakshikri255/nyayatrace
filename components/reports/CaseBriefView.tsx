'use client'

import { useState } from 'react'
import { Copy, Check, Printer, AlertTriangle, FileText, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { exportCourtDocx } from '@/lib/export/wordExport'

// ── Types (mirrors the API response shape) ────────────────────────────────────

type FindingSummary = {
  findingType: string
  description: string
  severity: 'high' | 'medium' | 'low'
  reviewStatus: 'needs_review' | 'verified' | 'not_a_discrepancy'
  extractedValue: string | null
  comparisonValue: string | null
}

type HearingSummary = {
  hearingDate: string
  eventType: string
  description: string | null
  outcome: string | null
  judge: string | null
}

type OrderSummary = {
  orderDate: string
  orderType: string
  summary: string | null
  issuedBy: string | null
}

type ConditionSummary = {
  conditionText: string
  conditionType: string
  status: string
}

type DocumentItem = {
  name: string
  type: string
  pages: number
  status: string
}

export type CaseBriefData = {
  generatedAt: string
  case: {
    caseNumber: string
    title: string
    status: string
    caseType: string
    court: string | null
    judge: string | null
    description: string | null
  }
  documents: { count: number; list: DocumentItem[] }
  findings: {
    total: number
    verified: number
    needsReview: number
    notADiscrepancy: number
    list: FindingSummary[]
  }
  hearings: {
    total: number
    firstDate: string | null
    lastDate: string | null
    list: HearingSummary[]
  }
  orders: { total: number; list: OrderSummary[] }
  conditions: { total: number; list: ConditionSummary[] }
}

// ── Config maps ───────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string }> = {
  active:  { label: 'Active',  className: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700'     },
  closed:  { label: 'Closed',  className: 'bg-slate-100 text-slate-600'     },
  stayed:  { label: 'Stayed',  className: 'bg-purple-100 text-purple-700'   },
}

const caseTypeConfig: Record<string, { label: string; className: string }> = {
  bail:     { label: 'Bail',     className: 'bg-teal-50 text-teal-700 border border-teal-200'       },
  parole:   { label: 'Parole',   className: 'bg-violet-50 text-violet-700 border border-violet-200' },
  criminal: { label: 'Criminal', className: 'bg-rose-50 text-rose-700 border border-rose-200'       },
  civil:    { label: 'Civil',    className: 'bg-blue-50 text-blue-700 border border-blue-200'       },
}

const reviewConfig: Record<string, { label: string; className: string }> = {
  needs_review:      { label: 'Under Review',      className: 'bg-amber-100 text-amber-700'     },
  verified:          { label: 'Verified',           className: 'bg-emerald-100 text-emerald-700' },
  not_a_discrepancy: { label: 'Not a Discrepancy', className: 'bg-slate-100 text-slate-600'     },
}

const severityConfig: Record<string, { label: string; className: string }> = {
  high:   { label: 'High',   className: 'text-rose-700 font-semibold'   },
  medium: { label: 'Medium', className: 'text-amber-600 font-medium'    },
  low:    { label: 'Low',    className: 'text-slate-500'                 },
}

const docStatusConfig: Record<string, { label: string; className: string }> = {
  complete:   { label: 'Complete',   className: 'bg-emerald-100 text-emerald-700' },
  processing: { label: 'Processing', className: 'bg-blue-100 text-blue-700'       },
  pending:    { label: 'Pending',    className: 'bg-amber-100 text-amber-700'     },
  failed:     { label: 'Failed',     className: 'bg-red-100 text-red-700'         },
}

const findingTypeLabels: Record<string, string> = {
  date_discrepancy:  'Date Discrepancy',
  name_variation:    'Name Variation',
  location_mismatch: 'Location Mismatch',
  missing_info:      'Missing Info',
  note:              'Note',
}

const eventTypeLabels: Record<string, string> = {
  bail_hearing:   'Bail Hearing',
  charge_framing: 'Charge Framing',
  arguments:      'Arguments',
  judgment:       'Judgment',
  order:          'Order',
  adjournment:    'Adjournment',
}

const orderTypeLabels: Record<string, string> = {
  bail_order:      'Bail Order',
  stay_order:      'Stay Order',
  framing_charges: 'Framing of Charges',
  sentence:        'Sentence',
  other:           'Other',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function label(map: Record<string, string>, key: string): string {
  return map[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ number, title, count }: { number: number; title: string; count?: number }) {
  return (
    <div className="flex items-baseline gap-2 mb-3">
      <span className="text-xs font-mono font-bold text-[var(--section-subheading)] select-none">{String(number).padStart(2, '0')}</span>
      <h2 className="text-sm font-semibold text-[var(--section-heading)] uppercase tracking-wide">{title}</h2>
      {count !== undefined && (
        <span className="text-xs text-[var(--section-subheading)]">({count})</span>
      )}
    </div>
  )
}

// ── Plain-text assembly for clipboard ────────────────────────────────────────

function assemblePlainText(data: CaseBriefData): string {
  const lines: string[] = []
  const hr = '═'.repeat(50)
  const sep = '─'.repeat(50)

  lines.push('CASE BRIEF', hr, '')
  lines.push('CASE IDENTITY', sep)
  lines.push(`Case Number : ${data.case.caseNumber}`)
  lines.push(`Title       : ${data.case.title}`)
  lines.push(`Type        : ${(caseTypeConfig[data.case.caseType] ?? caseTypeConfig.criminal).label}`)
  lines.push(`Status      : ${(statusConfig[data.case.status] ?? statusConfig.active).label}`)
  if (data.case.court) lines.push(`Court       : ${data.case.court}`)
  if (data.case.judge) lines.push(`Judge       : ${data.case.judge}`)
  lines.push(`Generated   : ${fmtDate(data.generatedAt)}`, '')

  lines.push('EXECUTIVE SUMMARY', sep)
  lines.push(data.case.description ?? 'No description provided.')
  lines.push(`Documents: ${data.documents.count} | Findings: ${data.findings.total} (${data.findings.verified} verified) | Hearings: ${data.hearings.total}`)
  lines.push('')

  lines.push(`KEY FINDINGS (${data.findings.total})`, sep)
  if (data.findings.list.length === 0) {
    lines.push('No document findings recorded.')
  } else {
    for (const f of data.findings.list) {
      lines.push(`• [${f.severity.toUpperCase()}] ${label(findingTypeLabels, f.findingType)}: ${f.description}`)
      const rcfg = reviewConfig[f.reviewStatus]
      lines.push(`  Status: ${rcfg?.label ?? f.reviewStatus}`)
    }
  }
  lines.push('')

  lines.push(`HEARING SUMMARY (${data.hearings.total})`, sep)
  if (data.hearings.list.length === 0) {
    lines.push('No hearings recorded.')
  } else {
    for (const h of data.hearings.list.slice(0, 10)) {
      lines.push(`${fmtDate(h.hearingDate)}  |  ${label(eventTypeLabels, h.eventType)}`)
      if (h.outcome) lines.push(`  Outcome: ${h.outcome}`)
    }
    if (data.hearings.list.length > 10) {
      lines.push(`... and ${data.hearings.list.length - 10} more hearings`)
    }
  }
  lines.push('')

  lines.push(`JUDICIAL ORDERS (${data.orders.total})`, sep)
  if (data.orders.list.length === 0) {
    lines.push('No judicial orders recorded.')
  } else {
    for (const o of data.orders.list) {
      lines.push(`${fmtDate(o.orderDate)}  |  ${label(orderTypeLabels, o.orderType)}`)
      if (o.summary) lines.push(`  ${o.summary}`)
      if (o.issuedBy) lines.push(`  Issued by: ${o.issuedBy}`)
    }
  }
  lines.push('')

  if (data.conditions.total > 0) {
    lines.push(`CONDITIONS (${data.conditions.total})`, sep)
    for (const c of data.conditions.list) {
      lines.push(`• [${c.conditionType}] ${c.conditionText} (${c.status})`)
    }
    lines.push('')
  }

  lines.push(`SOURCE DOCUMENTS (${data.documents.count})`, sep)
  for (const d of data.documents.list) {
    lines.push(`• ${d.name} (${d.type.toUpperCase()}, ${d.pages} pages, ${d.status})`)
  }
  lines.push('')

  lines.push(hr)
  lines.push(`Brief generated on ${fmtDate(data.generatedAt)} from records stored in this case workspace.`)
  lines.push('Verify all information against original documents. This brief is not legal advice.')

  return lines.join('\n')
}

// ── Main component ────────────────────────────────────────────────────────────

interface CaseBriefViewProps {
  data: CaseBriefData
}

export function CaseBriefView({ data }: CaseBriefViewProps) {
  const [copied, setCopied] = useState(false)

  const statusCfg = statusConfig[data.case.status] ?? statusConfig.active
  const caseTypeCfg = caseTypeConfig[data.case.caseType] ?? caseTypeConfig.criminal

  const displayedHearings = data.hearings.list.slice(0, 10)
  const extraHearings = data.hearings.total - displayedHearings.length

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(assemblePlainText(data))
      setCopied(true)
      toast.success('Brief copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="min-h-full bg-[var(--page-bg)]">
      {/* Header bar — hidden when printing */}
      <div className="no-print sticky top-0 z-10 bg-[var(--section-card-bg)] border-b border-[var(--section-card-border)] px-6 py-3 flex items-center justify-between">
        <h1 className="text-sm font-semibold text-[var(--section-heading)]">Case Brief</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors',
              copied
                ? 'border-emerald-400/40 text-emerald-600 bg-emerald-500/10'
                : 'border-[var(--section-card-border)] text-[var(--section-subheading)] hover:border-teal/40 hover:text-teal'
            )}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--section-card-border)] text-[var(--section-subheading)] text-xs font-medium hover:border-teal/40 hover:text-teal transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={() => exportCourtDocx(data)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal text-white hover:bg-teal-light text-xs font-semibold transition-colors"
            title="Download formatted court petition document"
          >
            <FileDown className="w-3.5 h-3.5" />
            Court Word Brief (.doc)
          </button>
        </div>
      </div>

      {/* Source and legal limitation */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
          This brief is assembled from records stored in this case workspace. Verify every detail against its source document; it does not constitute legal advice.
        </p>
      </div>

      {/* Brief content */}
      <div className="print-content px-6 py-6 max-w-4xl mx-auto space-y-6">

        {/* ── Section 1: Case Identity ── */}
        <section className="bg-[var(--section-card-bg)] rounded-lg border border-[var(--section-card-border)] p-5">
          <SectionHeader number={1} title="Case Identity" />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="font-mono text-sm font-bold text-[var(--section-heading)]">{data.case.caseNumber}</span>
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', caseTypeCfg.className)}>
              {caseTypeCfg.label}
            </span>
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', statusCfg.className)}>
              {statusCfg.label}
            </span>
          </div>
          <h2 className="text-lg font-bold text-[var(--section-heading)] mb-3">{data.case.title}</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--section-subheading)]">
            {data.case.court && (
              <span><span className="font-medium text-[var(--section-heading)]">Court:</span> {data.case.court}</span>
            )}
            {data.case.judge && (
              <span><span className="font-medium text-[var(--section-heading)]">Judge:</span> {data.case.judge}</span>
            )}
            <span><span className="font-medium text-[var(--section-heading)]">Generated:</span> {fmtDate(data.generatedAt)}</span>
          </div>
        </section>

        {/* ── Section 2: Executive Summary ── */}
        <section className="bg-[var(--section-card-bg)] rounded-lg border border-[var(--section-card-border)] p-5">
          <SectionHeader number={2} title="Executive Summary" />
          <p className="text-sm text-[var(--table-row-text)] leading-relaxed mb-6">
            {data.case.description ?? 'No description provided.'}
          </p>
          {/* Floating metrics — no bordered boxes */}
          <div className="flex items-center gap-10 pt-4 border-t border-[var(--section-card-border)]">
            <div>
              <p className="text-3xl font-bold text-[var(--section-heading)]">{data.documents.count}</p>
              <p className="text-xs text-[var(--section-subheading)] mt-0.5 uppercase tracking-wide">Documents</p>
            </div>
            <div className="w-px h-10 bg-[var(--section-card-border)]" />
            <div>
              <p className="text-3xl font-bold text-[var(--section-heading)]">{data.findings.total}</p>
              <p className="text-xs text-[var(--section-subheading)] mt-0.5 uppercase tracking-wide">Findings</p>
              {data.findings.verified > 0 && (
                <p className="text-[11px] text-emerald-500 mt-0.5">{data.findings.verified} verified</p>
              )}
            </div>
            <div className="w-px h-10 bg-[var(--section-card-border)]" />
            <div>
              <p className="text-3xl font-bold text-[var(--section-heading)]">{data.hearings.total}</p>
              <p className="text-xs text-[var(--section-subheading)] mt-0.5 uppercase tracking-wide">Hearings</p>
              {data.hearings.firstDate && data.hearings.lastDate && (
                <p className="text-[11px] text-[var(--section-subheading)] mt-0.5">
                  {fmtDate(data.hearings.firstDate)} – {fmtDate(data.hearings.lastDate)}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Section 3: Key Findings ── */}
        <section className="bg-[var(--section-card-bg)] rounded-lg border border-[var(--section-card-border)] p-5">
          <SectionHeader number={3} title="Key Findings" count={data.findings.total} />
          {data.findings.list.length === 0 ? (
            <p className="text-sm text-[var(--section-subheading)] italic">No document findings recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--section-card-border)] text-left">
                    <th className="py-2 pr-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-36">Type</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide">Description</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-24">Severity</th>
                    <th className="py-2 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-36">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.findings.list.map((f, i) => {
                    const revCfg = reviewConfig[f.reviewStatus] ?? reviewConfig.needs_review
                    const sevCfg = severityConfig[f.severity] ?? severityConfig.low
                    return (
                      <tr key={i} className="border-b border-[var(--section-card-border)] align-top">
                        <td className="py-2.5 pr-4">
                          <span className="text-xs font-medium text-[var(--table-row-text)]">
                            {label(findingTypeLabels, f.findingType)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 max-w-xs">
                          <p className="text-sm text-[var(--table-row-text)]">{f.description}</p>
                          {f.extractedValue && (
                            <p className="text-xs text-[var(--section-subheading)] mt-0.5">
                              Extracted: <span className="font-mono">&ldquo;{f.extractedValue}&rdquo;</span>
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={cn('text-xs', sevCfg.className)}>{sevCfg.label}</span>
                        </td>
                        <td className="py-2.5">
                          <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', revCfg.className)}>
                            {revCfg.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Section 4: Hearing Summary ── */}
        <section className="bg-[var(--section-card-bg)] rounded-lg border border-[var(--section-card-border)] p-5">
          <SectionHeader number={4} title="Hearing Summary" count={data.hearings.total} />
          {data.hearings.list.length === 0 ? (
            <p className="text-sm text-[var(--section-subheading)] italic">No hearings recorded for this case.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--section-card-border)] text-left">
                      <th className="py-2 pr-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-32">Date</th>
                      <th className="py-2 pr-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-36">Event</th>
                      <th className="py-2 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide">Outcome / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedHearings.map((h, i) => (
                      <tr key={i} className="border-b border-[var(--section-card-border)] align-top">
                        <td className="py-2.5 pr-4">
                          <span className="text-sm font-medium text-[var(--table-row-text)]">{fmtDate(h.hearingDate)}</span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-xs font-medium text-[var(--section-subheading)]">
                            {label(eventTypeLabels, h.eventType)}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <p className="text-sm text-[var(--table-row-text)]">{h.outcome ?? h.description ?? '—'}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {extraHearings > 0 && (
                <p className="text-xs text-[var(--section-subheading)] mt-2 italic">
                  … and {extraHearings} more hearing{extraHearings > 1 ? 's' : ''}
                </p>
              )}
            </>
          )}
        </section>

        {/* ── Section 5: Judicial Orders & Conditions ── */}
        <section className="bg-[var(--section-card-bg)] rounded-lg border border-[var(--section-card-border)] p-5">
          <SectionHeader number={5} title="Judicial Orders & Conditions" />

          {/* Orders table */}
          {data.orders.list.length === 0 ? (
            <p className="text-sm text-[var(--section-subheading)] italic mb-4">No judicial orders recorded.</p>
          ) : (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--section-card-border)] text-left">
                    <th className="py-2 pr-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-32">Date</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-36">Type</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide">Summary</th>
                    <th className="py-2 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-36">Issued By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.list.map((o, i) => (
                    <tr key={i} className="border-b border-[var(--section-card-border)] align-top">
                      <td className="py-2.5 pr-4">
                        <span className="text-sm font-medium text-[var(--table-row-text)]">{fmtDate(o.orderDate)}</span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs font-medium text-[var(--section-subheading)]">
                          {label(orderTypeLabels, o.orderType)}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <p className="text-sm text-[var(--table-row-text)]">{o.summary ?? '—'}</p>
                      </td>
                      <td className="py-2.5">
                        <span className="text-sm text-[var(--section-subheading)]">{o.issuedBy ?? '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Conditions table */}
          {data.conditions.total > 0 && (
            <>
              <p className="text-xs font-semibold text-[var(--section-subheading)] uppercase tracking-wide mb-2">
                Bail / Parole Conditions ({data.conditions.total})
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--section-card-border)] text-left">
                      <th className="py-2 pr-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide">Condition</th>
                      <th className="py-2 pr-4 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-36">Type</th>
                      <th className="py-2 text-xs font-semibold text-[var(--table-header-text)] uppercase tracking-wide w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.conditions.list.map((c, i) => (
                      <tr key={i} className="border-b border-[var(--section-card-border)] align-top">
                        <td className="py-2.5 pr-4">
                          <p className="text-sm text-[var(--table-row-text)]">{c.conditionText}</p>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-xs text-[var(--section-subheading)]">
                            {c.conditionType.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className="text-xs font-medium text-[var(--section-subheading)] capitalize">{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* ── Section 6: Source Documents ── */}
        <section className="bg-[var(--section-card-bg)] rounded-lg border border-[var(--section-card-border)] p-5">
          <SectionHeader number={6} title="Source Documents" count={data.documents.count} />
          {data.documents.list.length === 0 ? (
            <p className="text-sm text-[var(--section-subheading)] italic">No documents on record.</p>
          ) : (
            <ul className="space-y-0 divide-y divide-[var(--section-card-border)]">
              {data.documents.list.map((d, i) => {
                const stCfg = docStatusConfig[d.status] ?? docStatusConfig.pending
                return (
                  <li key={i} className="flex items-center gap-3 py-2.5">
                    <FileText className="w-4 h-4 text-[var(--section-subheading)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--section-heading)] truncate">{d.name}</p>
                      <p className="text-xs text-[var(--section-subheading)]">
                        {d.type.toUpperCase()} · {d.pages} page{d.pages !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium shrink-0', stCfg.className)}>
                      {stCfg.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="text-xs text-[var(--section-subheading)] italic mt-3">
            Extracted content may contain OCR or parsing errors. Verify it against the linked source document.
          </p>
        </section>

        {/* Footer note */}
        <p className="text-xs text-[var(--section-subheading)] text-center pb-4">
          Brief generated on {fmtDate(data.generatedAt)} from records stored in this case workspace. Not legal advice.
        </p>
      </div>
    </div>
  )
}
