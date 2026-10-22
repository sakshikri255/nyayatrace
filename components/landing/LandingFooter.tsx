'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Scale, Lock } from 'lucide-react'
import { NyayaTraceLogo } from '@/components/logo/NyayaTraceLogo'

export function LandingFooter() {
  const scrollToWorkspace = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.getElementById('workspace')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <footer className="relative bg-midnight-950 border-t border-white/10 text-slate-300">
      
      {/* ═══════════════ CALL TO ACTION BANNER ═══════════════ */}
      <div className="border-b border-white/5 py-16 sm:py-20 bg-gradient-to-b from-midnight-900/60 to-midnight-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold">
              EMPOWER YOUR PRACTICE
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-4xl font-bold text-slate-100 tracking-tight leading-tight mb-4">
            Spend Less Time Searching.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-light via-gold to-gold-champagne">
              More Time Understanding.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300/80 font-light max-w-2xl mx-auto mb-8">
            Bring structure to your case preparation while keeping every important finding open to review.
          </p>

          <div>
            <a
              href="#workspace"
              onClick={scrollToWorkspace}
              className="group inline-flex items-center justify-center gap-2.5 rounded-lg bg-gradient-to-r from-gold-muted via-gold to-gold-light px-7 py-3.5 text-sm font-semibold text-midnight-950 shadow-xl shadow-gold/15 hover:brightness-110 active:scale-[0.99] transition-all font-sans"
            >
              <span>Open Your Workspace</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-midnight-900" />
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-gold-muted" /> Local SQLite Storage
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-light" /> 100% Citation Grounded
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-gold" /> Human-in-the-Loop Verification
            </span>
          </div>

        </div>
      </div>

      {/* ═══════════════ MAIN FOOTER LINKS ═══════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <NyayaTraceLogo size="lg" variant="light" />
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-light">
              NyayaTrace is a professional legal intelligence workspace designed for lawyers and law students to organize case records, trace evidence citations, inspect inconsistencies, and prepare structured briefs.
            </p>
          </div>

          {/* Quick Workspace Modules */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-3">
              Workspace Modules
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/cases" className="hover:text-gold-light transition-colors">
                  Case Management
                </Link>
              </li>
              <li>
                <Link href="/verification" className="hover:text-gold-light transition-colors">
                  Evidence Verification
                </Link>
              </li>
              <li>
                <Link href="/bail-briefs" className="hover:text-gold-light transition-colors">
                  Bail &amp; Parole Briefs
                </Link>
              </li>
              <li>
                <Link href="/case-progress" className="hover:text-gold-light transition-colors">
                  Procedural Chronology
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Governance */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-3">
              Ethics &amp; Control
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="text-slate-400">
                Source-Linked Traceability
              </li>
              <li className="text-slate-400">
                Attorney Editorial Autonomy
              </li>
              <li className="text-slate-400">
                Unverified AI State Indicators
              </li>
              <li className="text-slate-400">
                Offline Local Execution
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="pt-6 border-t border-white/5 flex items-center justify-center gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} NyayaTrace. Assistive legal intelligence for judicial professionals.
          </p>
        </div>
      </div>

    </footer>
  )
}
export default LandingFooter
