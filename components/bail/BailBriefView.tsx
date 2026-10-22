'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { GavelIcon, FileTextIcon, CalendarIcon, AlertTriangleIcon, ChevronDownIcon, ChevronUpIcon, PrinterIcon, BriefcaseIcon, SearchIcon } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { BailDisclaimer } from '@/components/bail/BailDisclaimer'
import { ConditionsTable } from '@/components/bail/ConditionsTable'
import { HearingsTab } from '@/components/cases/tabs/HearingsTab'
import { StatutoryBailCard } from '@/components/bail/StatutoryBailCard'
import { UTPReliefCard } from '@/components/bail/UTPReliefCard'
import { ParoleTimelineCard } from '@/components/bail/ParoleTimelineCard'
import { NextHearingWidget } from '@/components/bail/NextHearingWidget'
import { ChangelogTab } from '@/components/bail/ChangelogTab'
import { DraftApplicationTab } from '@/components/bail/DraftApplicationTab'
import { RiskFlagPanel } from '@/components/bail/RiskFlagPanel'
import { calculateStatutoryBail } from '@/lib/analysis/statutoryBail'
import { cn } from '@/lib/utils'
import type { BailBriefData } from '@/lib/queries/cases'

interface BailBriefViewProps {
  data: BailBriefData
}

export type TabId = 'overview' | 'orders' | 'conditions' | 'hearings' | 'findings' | 'draft' | 'changelog'

const tabVariants: Variants = {
  hidden: { opacity: 0, x: -4 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: 4, transition: { duration: 0.1 } },
}

// ── Order type config ─────────────────────────────────────────────────────────
const orderTypeConfig: Record<string, { label: string; className: string }> = {
  bail_order:      { label: 'Bail Order',         className: 'bg-teal-50 text-teal-700 border-teal-200'     },
  stay_order:      { label: 'Stay Order',          className: 'bg-purple-50 text-purple-700 border-purple-200' },
  framing_charges: { label: 'Framing of Charges',  className: 'bg-blue-50 text-blue-700 border-blue-200'    },
  sentence:        { label: 'Sentence',             className: 'bg-red-50 text-red-700 border-red-200'       },
  other:           { label: 'Other',                className: 'bg-slate-100 text-slate-600 border-slate-200' },
}

// ── Case type badge ───────────────────────────────────────────────────────────
const caseTypeConfig: Record<string, { label: string; className: string }> = {
  bail:     { label: 'Bail',     className: 'bg-teal-50 text-teal-700 border-teal-200'     },
  parole:   { label: 'Parole',   className: 'bg-violet-50 text-violet-700 border-violet-200' },
  criminal: { label: 'Criminal', className: 'bg-rose-50 text-rose-700 border-rose-200'     },
  civil:    { label: 'Civil',    className: 'bg-blue-50 text-blue-700 border-blue-200'     },
}

// ── Status badge ──────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string }> = {
  active:  { label: 'Active',  className: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700'     },
  closed:  { label: 'Closed',  className: 'bg-slate-100 text-slate-600'     },
  stayed:  { label: 'Stayed',  className: 'bg-purple-100 text-purple-700'   },
}

// ── Review status config ──────────────────────────────────────────────────────
const reviewConfig: Record<string, { label: string; className: string }> = {
  needs_review:       { label: 'Under Review',        className: 'bg-amber-100 text-amber-700'   },
  verified:           { label: 'Verified',             className: 'bg-emerald-100 text-emerald-700' },
  not_a_discrepancy:  { label: 'Not a Discrepancy',   className: 'bg-slate-100 text-slate-600'   },
}

const findingTypeLabels: Record<string, string> = {
  date_discrepancy: 'Date Discrepancy',
  name_variation:   'Name Variation',
  location_mismatch:'Location Mismatch',
  missing_info:     'Missing Info',
  note:             'Note',
}

// ─────────────────────────────────────────────────────────────────────────────

export function BailBriefView({ data }: BailBriefViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [keyDatesCollapsed, setKeyDatesCollapsed] = useState(false)
  const [caseSummaryCollapsed, setCaseSummaryCollapsed] = useState(false)
  const [printMode, setPrintMode] = useState(false)

  // Trigger window.print() when printMode activates, then reset
  useEffect(() => {
    if (!printMode) return
    const timer = setTimeout(() => {
      window.print()
      const handler = () => setPrintMode(false)
      window.addEventListener('afterprint', handler, { once: true })
    }, 100)
    return () => clearTimeout(timer)
  }, [printMode])

  const { case: caseRecord, orders, conditions, hearings, findings, documents } = data

  const caseTypeCfg = caseTypeConfig[caseRecord.caseType] ?? caseTypeConfig.criminal
  const statusCfg = statusConfig[caseRecord.status] ?? statusConfig.active

  // Bail calculation (for RiskFlagPanel)
  const bailCalc = calculateStatutoryBail({
    remandDate: caseRecord.remandDate,
    statutoryPeriodDays: caseRecord.statutoryPeriodDays,
    chargesheetFiled: caseRecord.chargesheetFiled,
    chargesheetDate: caseRecord.chargesheetDate,
    applicableLaw: (caseRecord as { applicableLaw?: 'crpc' | 'bnss' | 'auto' | null }).applicableLaw,
  })

  // Key dates
  const firstHearing = hearings.length > 0
    ? hearings.reduce((a, b) => (a.hearingDate < b.hearingDate ? a : b))
    : null
  const latestOrder = orders.length > 0
    ? orders.reduce((a, b) => (a.orderDate > b.orderDate ? a : b))
    : null

  return (
    <div className={cn('flex flex-col gap-4', printMode && 'bail-brief-print')}>
      {/* Non-dismissable disclaimer — always at top */}
      <BailDisclaimer />

      {/* Risk flags panel — only shown when flags exist */}
      <RiskFlagPanel
        bail={bailCalc}
        caseType={caseRecord.caseType}
        conditions={conditions}
        hearings={hearings}
        findings={findings}
        onTabChange={setActiveTab}
      />

      {/* Brief header card */}
      <div className="bg-white rounded-lg border border-slate-200 px-6 py-5">
        {/* Case number + badges row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-semibold text-slate-500 tracking-wide">
              {caseRecord.caseNumber}
            </span>
            <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', caseTypeCfg.className)}>
              {caseTypeCfg.label}
            </span>
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', statusCfg.className)}>
              {statusCfg.label}
            </span>
          </div>
          {/* Print / Export button */}
          <button
            onClick={() => setPrintMode(true)}
            className="no-print inline-flex items-center gap-1.5 rounded-md border border-[var(--section-card-border)] bg-[var(--section-card-bg)] px-3 py-1.5 text-xs font-medium text-[var(--section-subheading)] hover:border-teal/40 hover:text-teal transition-colors"
          >
            <PrinterIcon className="w-3.5 h-3.5" />
            Export Brief
          </button>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-[var(--section-heading)] mb-3">{caseRecord.title}</h1>

        {/* Court + judge metadata */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--section-subheading)] mb-3">
          {caseRecord.court && (
            <span><span className="font-medium text-[var(--section-heading)]">Court:</span> {caseRecord.court}</span>
          )}
          {caseRecord.judge && (
            <span><span className="font-medium text-[var(--section-heading)]">Judge:</span> {caseRecord.judge}</span>
          )}
          <span>
            <span className="font-medium text-[var(--section-heading)]">Documents:</span> {documents.length}
          </span>
          <span>
            <span className="font-medium text-[var(--section-heading)]">Orders:</span> {orders.length}
          </span>
        </div>

        {/* Cross-feature quick links */}
        <div className="no-print flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--section-card-border)]">
          <span className="text-[11px] font-medium text-[var(--section-subheading)] mr-1">Also view in:</span>
          <Link
            href={`/cases/${caseRecord.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--section-card-border)] bg-[var(--section-card-bg)] px-2.5 py-1 text-xs font-medium text-[var(--section-subheading)] hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <BriefcaseIcon className="w-3.5 h-3.5" />
            Case Workspace
          </Link>
          <Link
            href={`/verification/${caseRecord.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--section-card-border)] bg-[var(--section-card-bg)] px-2.5 py-1 text-xs font-medium text-[var(--section-subheading)] hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <SearchIcon className="w-3.5 h-3.5" />
            Verification
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabId)}
        className="w-full"
      >
        <TabsList variant="line" className="w-full border-b border-[var(--section-card-border)] rounded-none pb-0 mb-4 h-auto sticky top-0 z-10 bg-[var(--section-card-bg)] shadow-sm">
          <TabsTrigger value="overview">Case Overview</TabsTrigger>
          <TabsTrigger value="orders">
            Judicial Orders
            {orders.length > 0 && <span className="ml-1 text-xs text-slate-400">({orders.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="conditions">
            Conditions
            {conditions.length > 0 && <span className="ml-1 text-xs text-teal-600">({conditions.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="hearings">
            Hearing History
            {hearings.length > 0 && <span className="ml-1 text-xs text-slate-400">({hearings.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="findings">
            Findings
            {findings.length > 0 && <span className="ml-1 text-xs text-amber-500">({findings.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="draft">Draft Application</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* ── Case Overview ── */}
            <TabsContent value="overview">
              <div className="flex flex-col gap-4">
                {/* Statutory bail tracker or parole timeline */}
                {caseRecord.caseType === 'parole' ? (
                  <ParoleTimelineCard caseData={caseRecord} />
                ) : (
                  <StatutoryBailCard caseData={caseRecord} />
                )}

                {/* UTP Relief tracker — criminal / bail / parole cases */}
                <UTPReliefCard
                  caseData={caseRecord as typeof caseRecord & { maxPunishmentYears?: number | null }}
                />

                {/* Next Hearing Widget */}
                {data.nextHearing && <NextHearingWidget hearing={data.nextHearing} />}

                <div className="bg-[var(--section-card-bg)] rounded-lg border border-[var(--section-card-border)] p-5">
                  <h2 className="text-sm font-semibold text-[var(--section-subheading)] mb-3">Case Description</h2>
                  <p className="text-sm text-[var(--section-heading)] leading-relaxed">
                    {caseRecord.description ?? 'No description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Key Dates — collapsible */}
                  <div className="bg-[var(--section-card-bg)] rounded-lg border border-[var(--section-card-border)] p-5">
                    <button
                      className="flex items-center justify-between w-full text-left"
                      onClick={() => setKeyDatesCollapsed((v) => !v)}
                    >
                      <h2 className="text-xs font-semibold text-[var(--section-subheading)] uppercase tracking-wide">Key Dates</h2>
                      {keyDatesCollapsed
                        ? <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                        : <ChevronUpIcon className="w-4 h-4 text-slate-400" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {!keyDatesCollapsed && (
                        <motion.div
                          key="key-dates"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto', transition: { duration: 0.2 } }}
                          exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-2 text-sm mt-3">
                            {firstHearing ? (
                              <div className="flex items-start gap-2">
                                <CalendarIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs text-slate-500">First Hearing</p>
                                  <p className="font-medium text-slate-700">
                                    {new Date(firstHearing.hearingDate).toLocaleDateString('en-IN', {
                                      day: 'numeric', month: 'long', year: 'numeric',
                                    })}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                            {latestOrder ? (
                              <div className="flex items-start gap-2">
                                <GavelIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs text-slate-500">Latest Order</p>
                                  <p className="font-medium text-slate-700">
                                    {new Date(latestOrder.orderDate).toLocaleDateString('en-IN', {
                                      day: 'numeric', month: 'long', year: 'numeric',
                                    })}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                            {!firstHearing && !latestOrder && (
                              <p className="text-slate-400 text-sm">No key dates available.</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Case Summary — collapsible */}
                  <div className="bg-white rounded-lg border border-slate-200 p-5">
                    <button
                      className="flex items-center justify-between w-full text-left"
                      onClick={() => setCaseSummaryCollapsed((v) => !v)}
                    >
                      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Case Summary</h2>
                      {caseSummaryCollapsed
                        ? <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                        : <ChevronUpIcon className="w-4 h-4 text-slate-400" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {!caseSummaryCollapsed && (
                        <motion.div
                          key="case-summary"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto', transition: { duration: 0.2 } }}
                          exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-1.5 text-sm mt-3">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Type</span>
                              <span className="font-medium text-slate-700">{caseTypeCfg.label}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Status</span>
                              <span className="font-medium text-slate-700">{statusCfg.label}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Documents</span>
                              <span className="font-medium text-slate-700">{documents.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Hearings</span>
                              <span className="font-medium text-slate-700">{hearings.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Orders</span>
                              <span className="font-medium text-slate-700">{orders.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Conditions</span>
                              <span className="font-medium text-slate-700">{conditions.length}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </div>
            </TabsContent>

            {/* ── Judicial Orders ── */}
            <TabsContent value="orders">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <GavelIcon className="w-8 h-8 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-500">No judicial orders recorded for this case</p>
                  <p className="text-xs text-slate-400 mt-1">Upload and verify case documents to extract judicial orders.</p>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-slate-200">
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">Order Date</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-40">Order Type</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Summary</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">Issued By</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-40">Source Document</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => {
                        const typeCfg = orderTypeConfig[o.orderType] ?? orderTypeConfig.other
                        return (
                          <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="text-sm font-semibold text-slate-700">
                                {new Date(o.orderDate).toLocaleDateString('en-IN', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                })}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', typeCfg.className)}>
                                {typeCfg.label}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-slate-600">{o.summary ?? '—'}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-slate-500">{o.issuedBy ?? '—'}</p>
                            </td>
                            <td className="py-3 px-4">
                              {o.sourceDocument ? (
                                <div className="flex items-center gap-1.5">
                                  <FileTextIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="text-xs text-slate-500 truncate max-w-[8rem]" title={o.sourceDocument}>
                                    {o.sourceDocument}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* ── Conditions ── */}
            <TabsContent value="conditions">
              <ConditionsTable conditions={conditions} showEmpty caseId={caseRecord.id} />
            </TabsContent>

            {/* ── Hearing History ── */}
            <TabsContent value="hearings">
              <HearingsTab hearings={hearings} />
            </TabsContent>

            {/* ── Findings ── */}
            <TabsContent value="findings">
              <div className="flex flex-col gap-4">
                {/* Important contextual label */}
                <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
                  <div className="flex gap-2">
                    <AlertTriangleIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-700">Document Findings</span> — These are document-level
                      findings from the verification module. They represent potential discrepancies in the case
                      documentation, not criminal findings or allegations against any individual.
                    </p>
                  </div>
                </div>

                {findings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <AlertTriangleIcon className="w-8 h-8 text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-500">No document findings recorded</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Run document verification from the case page to generate findings.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-slate-200">
                          <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">Finding Type</th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                          <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">Review Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {findings.map((f) => {
                          const revCfg = reviewConfig[f.reviewStatus] ?? reviewConfig.needs_review
                          return (
                            <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4">
                                <span className="text-xs font-medium text-slate-700">
                                  {findingTypeLabels[f.findingType] ?? f.findingType}
                                </span>
                              </td>
                              <td className="py-3 px-4 max-w-sm">
                                <p className="text-sm text-slate-700">{f.description}</p>
                              </td>
                              <td className="py-3 px-4">
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
              </div>
            </TabsContent>

            {/* ── Draft Application ── */}
            <TabsContent value="draft">
              <DraftApplicationTab data={data} />
            </TabsContent>

            {/* ── Changelog ── */}
            <TabsContent value="changelog">
              <ChangelogTab caseId={caseRecord.id} />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  )
}
