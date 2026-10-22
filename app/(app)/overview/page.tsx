import React from 'react'

import { HeroSection } from '@/components/landing/HeroSection'
import { IntroductionSection } from '@/components/landing/IntroductionSection'
import { OurProcessSection } from '@/components/landing/OurProcessSection'
import { TrustedServicesSection } from '@/components/landing/TrustedServicesSection'
import { TrustSection } from '@/components/landing/TrustSection'
import { LandingFooter } from '@/components/landing/LandingFooter'

export const dynamic = 'force-dynamic'

export default function OverviewPage() {
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

      {/* 7. Footer and calls to action */}
      <LandingFooter />
    </div>
  )
}
