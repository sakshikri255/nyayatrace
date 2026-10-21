'use client'

import React from 'react'
import Link from 'next/link'
import {
  PlusCircle,
  Search,
  Scale,
  CalendarDays,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react'
import { KPICard } from '@/components/dashboard/KPICard'
import { ActivityLineChart } from '@/components/dashboard/ActivityLineChart'
import { RecentCasesTable } from '@/components/dashboard/RecentCasesTable'
import type { DashboardStats, RecentCase, CaseWithCounts } from '@/lib/queries/cases'
import type { HearingChartPoint } from '@/lib/queries/hearings'

interface WorkspaceDashboardSectionProps {
  stats: DashboardStats
  recentCases: RecentCase[]
  chartData: HearingChartPoint[]
  statutoryBailCases: CaseWithCounts[]
  today: string
}

export function WorkspaceDashboardSection({
  stats,
  recentCases,
  chartData,
  statutoryBailCases,
  today,
}: WorkspaceDashboardSectionProps) {
  return (
    <section
      id="workspace"
      className="relative py-20 lg:py-24 border-b border-white/5 bg-midnight-950"
    >
      {/* Subtle Visual Transition Gradient */}
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-midnight-900 to-transparent pointer-events-none" />

      {/* Background Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 40% at 50% 10%, rgba(229, 195, 120, 0.05) 0%, transparent 60%),
              radial-gradient(ellipse 60% 50% at 80% 90%, rgba(13, 148, 136, 0.05) 0%, transparent 60%)
            `,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        
        {/* ── Section Title & Date Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold">
                YOUR LEGAL WORKSPACE
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-3xl font-semibold text-slate-100 tracking-tight">
              Case Dashboard &amp; Activity
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-light mt-1">
              Continue working with your existing cases, documents, and review tasks.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs font-mono text-slate-400">{today}</span>
            <div className="flex items-center gap-2 mt-1 sm:justify-end">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-emerald-400/90">Local Engine Active</span>
            </div>
          </div>
        </div>

        {/* ── Statutory Default Bail Watchlist Alert ── */}
        {statutoryBailCases.length > 0 && (
          <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-midnight-950 to-rose-950/20 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <span className="relative flex h-3.5 w-3.5 shrink-0 mt-1 sm:mt-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-rose-500" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-rose-200 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-400 inline" />
                    Statutory Default Bail Watchlist ({statutoryBailCases.length} Active Cases)
                  </h3>
                  <p className="text-xs text-rose-300/80 mt-0.5 font-light">
                    Indefeasible statutory right accrued or nearing statutory expiry under Section 167(2) CrPC / Section 187 BNSS.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/bail-briefs"
                  className="rounded-lg bg-rose-600/90 hover:bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition-colors flex items-center gap-1.5"
                >
                  <span>Inspect Bail Briefs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Empty State Handling ── */}
        {stats.totalCases === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-midnight-900/60 p-12 text-center max-w-xl mx-auto shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold border border-gold/25">
              <PlusCircle size={28} />
            </div>
            <h3 className="text-xl font-semibold text-slate-100">
              No cases created yet
            </h3>
            <p className="mt-2 text-sm text-slate-400 font-light leading-relaxed">
              Create your first case to upload court documents, extract structured chronological events, and generate source-linked legal briefs.
            </p>
            <Link
              href="/cases?new=1"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-muted via-gold to-gold-light px-5 py-2.5 text-xs font-semibold text-midnight-950 shadow-md hover:brightness-110 transition-all"
            >
              <PlusCircle size={15} />
              <span>Create Your First Case</span>
            </Link>
          </div>
        ) : (
          <>
            {/* ── KPI Cards Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <KPICard
                label="Total Cases"
                value={stats.totalCases}
                icon="briefcase"
                description="Active legal files"
                accent="default"
                delay={0}
                href="/cases"
                theme="dark"
              />
              <KPICard
                label="Documents Processed"
                value={stats.documentsProcessed}
                icon="fileText"
                description="Status: verified complete"
                accent="teal"
                delay={1}
                href="/cases"
                theme="dark"
              />
              <KPICard
                label="Awaiting Review"
                value={stats.findingsAwaitingReview}
                icon="alertCircle"
                description="Findings needing attention"
                accent="amber"
                delay={2}
                href="/verification"
                theme="dark"
              />
              <KPICard
                label="Verified Findings"
                value={stats.verifiedFindings}
                icon="checkCircle"
                description="Confirmed discrepancies"
                accent="green"
                delay={3}
                href="/verification"
                theme="dark"
              />
            </div>

            {/* ── Chart + Quick Actions Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Activity Line Chart (2/3 width) */}
              <div className="lg:col-span-2">
                <ActivityLineChart data={chartData} theme="dark" />
              </div>

              {/* Quick Actions Card (1/3 width) */}
              <div className="rounded-2xl border border-white/10 bg-midnight-950/80 p-5 sm:p-6 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 mb-1">
                    Quick Actions
                  </h3>
                  <p className="text-xs text-slate-400 font-light mb-5">
                    Common litigation tasks
                  </p>
                  
                  <div className="flex flex-col gap-2.5">
                    <Link
                      href="/cases?new=1"
                      className="group flex items-center justify-between px-4 py-3 rounded-xl border border-gold/30 bg-gold/5 text-gold-light hover:bg-gold/15 hover:border-gold transition-all text-xs font-medium"
                    >
                      <div className="flex items-center gap-2.5">
                        <PlusCircle size={16} className="text-gold" />
                        <span>Create New Case</span>
                      </div>
                      <ArrowRight size={13} className="text-gold/60 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      href="/verification"
                      className="group flex items-center justify-between px-4 py-3 rounded-xl border border-teal/30 bg-teal/5 text-teal-light hover:bg-teal/15 hover:border-teal transition-all text-xs font-medium"
                    >
                      <div className="flex items-center gap-2.5">
                        <Search size={16} className="text-teal" />
                        <span>Verify Evidence Matrix</span>
                      </div>
                      <ArrowRight size={13} className="text-teal/60 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      href="/bail-briefs"
                      className="group flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05] hover:border-white/20 transition-all text-xs font-medium"
                    >
                      <div className="flex items-center gap-2.5">
                        <Scale size={16} className="text-gold" />
                        <span>Bail &amp; Parole Briefs</span>
                      </div>
                      <ArrowRight size={13} className="text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      href="/cause-list"
                      className="group flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05] hover:border-white/20 transition-all text-xs font-medium"
                    >
                      <div className="flex items-center gap-2.5">
                        <CalendarDays size={16} className="text-teal-light" />
                        <span>Court Diary</span>
                      </div>
                      <ArrowRight size={13} className="text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Fast Launch</span>
                  <span>Instant Index</span>
                </div>
              </div>

            </div>

            {/* ── Recent Cases Table ── */}
            <div className="pt-2">
              <RecentCasesTable cases={recentCases} theme="dark" />
            </div>
          </>
        )}

      </div>
    </section>
  )
}
export default WorkspaceDashboardSection
