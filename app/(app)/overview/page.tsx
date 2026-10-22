import React from 'react'

import { HeroSection } from '@/components/landing/HeroSection'
import { OurProcessSection } from '@/components/landing/OurProcessSection'
import { IntroductionSection } from '@/components/landing/IntroductionSection'
import { TrustedServicesSection } from '@/components/landing/TrustedServicesSection'
import { TrustSection } from '@/components/landing/TrustSection'
import { LandingFooter } from '@/components/landing/LandingFooter'

export const dynamic = 'force-dynamic'

export default function OverviewPage() {
  return (
    <div className="min-h-full bg-[#0B0F17] text-slate-100 selection:bg-gold/30 selection:text-gold-light">
      {/* 1. Hero with animated Lady Justice visual */}
      <HeroSection />

      {/* 2. Our Process with flowing line & Traditional vs. NyayaTrace comparison */}
      <OurProcessSection />

      {/* 3. Introduction / Our Approach */}
      <IntroductionSection />

      {/* 4. Trusted Services section */}
      <TrustedServicesSection />

      {/* 5. Trust and Responsibility */}
      <TrustSection />

      {/* 6. Footer and calls to action */}
      <LandingFooter />
    </div>
  )
}
