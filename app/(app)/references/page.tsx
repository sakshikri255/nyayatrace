import React from 'react'
import { ReferencesSection } from '@/components/landing/ReferencesSection'

export const dynamic = 'force-dynamic'

export default function ReferencesPage() {
  return (
    <div className="min-h-full bg-[#0B0F17] text-slate-100 selection:bg-gold/30 selection:text-gold-light">
      <ReferencesSection />
    </div>
  )
}
