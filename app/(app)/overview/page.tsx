import { PlusCircle, Upload, Search } from 'lucide-react'
import Link from 'next/link'

import { getDashboardStats, getRecentCases } from '@/lib/queries/cases'
import { getAllHearingsPerMonth } from '@/lib/queries/hearings'
import { KPICard } from '@/components/dashboard/KPICard'
import { ActivityLineChart } from '@/components/dashboard/ActivityLineChart'
import { RecentCasesTable } from '@/components/dashboard/RecentCasesTable'
import { PageTransition } from '@/components/layout/PageTransition'

export default function OverviewPage() {
  const stats = getDashboardStats()
  const recentCases = getRecentCases(5)
  const chartData = getAllHearingsPerMonth()

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <PageTransition>
    <div className="min-h-full bg-offwhite">
      <div className="px-6 py-6 space-y-6">
        {stats.totalCases === 0 ? (
          <section className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal">
              <PlusCircle size={25} />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">No cases created yet.</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-gray-500">
              Create a case to upload documents and generate a source-linked case synopsis.
            </p>
            <Link
              href="/cases?new=1"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-teal px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-light"
            >
              <PlusCircle size={16} />
              Create Your First Case
            </Link>
          </section>
        ) : (
          <>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Overview</h1>
            <p className="text-xs text-gray-400 mt-0.5">{today}</p>
          </div>
        </div>

        {/* KPI cards row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Cases"
            value={stats.totalCases}
            icon="briefcase"
            description="All cases in the system"
            accent="default"
            delay={0}
          />
          <KPICard
            label="Documents Processed"
            value={stats.documentsProcessed}
            icon="fileText"
            description="Processing status: complete"
            accent="teal"
            delay={1}
          />
          <KPICard
            label="Awaiting Review"
            value={stats.findingsAwaitingReview}
            icon="alertCircle"
            description="Findings needing review"
            accent="amber"
            delay={2}
          />
          <KPICard
            label="Verified Findings"
            value={stats.verifiedFindings}
            icon="checkCircle"
            description="Confirmed discrepancies"
            accent="green"
            delay={3}
          />
        </div>

        {/* Chart + Quick Actions row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Activity chart — takes 2/3 width */}
          <div className="lg:col-span-2">
            <ActivityLineChart data={chartData} />
          </div>

          {/* Quick actions — takes 1/3 width */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Quick Actions</h3>
            <p className="text-xs text-gray-400 mb-4">Common tasks</p>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/cases?new=1"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-md border border-teal text-teal text-sm font-medium hover:bg-teal hover:text-white transition-colors duration-150"
              >
                <PlusCircle size={16} strokeWidth={1.75} />
                Create New Case
              </Link>
              <Link
                href="/cases"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-md border border-teal text-teal text-sm font-medium hover:bg-teal hover:text-white transition-colors duration-150"
              >
                <Upload size={16} strokeWidth={1.75} />
                Upload Documents
              </Link>
              <Link
                href="/cases"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-md border border-teal text-teal text-sm font-medium hover:bg-teal hover:text-white transition-colors duration-150"
              >
                <Search size={16} strokeWidth={1.75} />
                Search Records
              </Link>
            </div>
          </div>
        </div>

        {/* Recent cases table */}
        <RecentCasesTable cases={recentCases} />
          </>
        )}
      </div>
    </div>
    </PageTransition>
  )
}
