import React from 'react'
import { getDashboardStats, getRecentCases, getAllCases } from '@/lib/queries/cases'
import { getAllHearingsPerMonth } from '@/lib/queries/hearings'
import { calculateStatutoryBail } from '@/lib/analysis/statutoryBail'

import { HeroSection } from '@/components/landing/HeroSection'
import { IntroductionSection } from '@/components/landing/IntroductionSection'
import { OurProcessSection } from '@/components/landing/OurProcessSection'
import { TrustedServicesSection } from '@/components/landing/TrustedServicesSection'
import { TrustSection } from '@/components/landing/TrustSection'
import { WorkspaceDashboardSection } from '@/components/landing/WorkspaceDashboardSection'
import { LandingFooter } from '@/components/landing/LandingFooter'

export const dynamic = 'force-dynamic'

export default function OverviewPage() {
  // Real data queries - preserved 100%
  const stats = getDashboardStats()
  const recentCases = getRecentCases(5)
  const chartData = getAllHearingsPerMonth()
  const allCases = getAllCases()
  const statutoryBailCases = allCases.filter((c) => {
    const bail = calculateStatutoryBail(c)
    return bail.status === 'accrued' || bail.status === 'urgent'
  })

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-full bg-midnight-950 text-slate-100 selection:bg-gold/30 selection:text-gold-light">
      {/* 1. Hero with animated Lady Justice visual */}
      <HeroSection />

      {/* 2. Introduction / Our Approach */}
      <IntroductionSection />

      {/* 3 & 4. Our Process with flowing line & Traditional vs. NyayaTrace comparison */}
      <OurProcessSection />

      {/* 5. Trusted Services section */}
      <TrustedServicesSection />

      {/* 6. Trust and Responsibility */}
      <TrustSection />

      {/* 7. Existing dashboard and workspace overview (at bottom) */}
      <WorkspaceDashboardSection
        stats={stats}
        recentCases={recentCases}
        chartData={chartData}
        statutoryBailCases={statutoryBailCases}
        today={today}
      />

      {/* 8. Footer and calls to action */}
      <LandingFooter />
    </div>
  )
}
