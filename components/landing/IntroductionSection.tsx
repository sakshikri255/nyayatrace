'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { FileText, ArrowRight, Clock, ShieldCheck, Link2, CheckCircle2 } from 'lucide-react'

export function IntroductionSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  const scrollToServices = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.getElementById('services')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section ref={ref} className="relative py-20 lg:py-28 overflow-hidden border-b border-white/5 bg-midnight-950">
      {/* Background radial ambient lights */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 50% 50% at 20% 40%, rgba(13, 148, 136, 0.05) 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 80% 60%, rgba(197, 168, 128, 0.06) 0%, transparent 60%)
            `,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* ══════════ LEFT COLUMN: Professional Legal Workspace Collage ══════════ */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="lg:col-span-6 relative"
          >
            {/* Soft backdrop glow */}
            <div className="absolute -inset-3 bg-gradient-to-r from-teal/10 via-gold/10 to-transparent rounded-3xl blur-xl -z-10" />

            <div className="relative rounded-2xl border border-white/10 bg-midnight-900/90 p-5 sm:p-6 shadow-2xl shadow-black/80 backdrop-blur-md overflow-hidden">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  <span className="text-xs font-mono text-slate-400 ml-2">NyayaTrace Evidence Matrix</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-teal-light font-medium bg-teal/10 px-2.5 py-0.5 rounded-full border border-teal/20">
                  <Link2 className="w-3 h-3" />
                  <span>Source Linked</span>
                </div>
              </div>

              {/* Main Document & Citation Layer */}
              <div className="space-y-4">
                
                {/* 1. Document Page Snippet */}
                <div className="rounded-xl border border-white/10 bg-midnight-950/80 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
                    <span className="flex items-center gap-1.5 font-medium text-slate-300">
                      <FileText className="w-3.5 h-3.5 text-gold" />
                      FIR Statement No. 34/2024
                    </span>
                    <span className="text-[11px] font-mono text-gold-champagne bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                      Page 4 · Para 12
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    “...The complainant stated that the vehicle departed the intersection at{' '}
                    <mark className="bg-amber-400/20 text-amber-200 px-1 py-0.5 rounded border border-amber-400/30 font-medium">
                      21:45 hours
                    </mark>
                    , heading west towards the toll barrier with two occupants aboard...”
                  </p>
                </div>

                {/* 2. Discrepancy & Verification Pin */}
                <div className="rounded-xl border border-teal/30 bg-teal/5 p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-teal to-teal-light" />
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-light shrink-0" />
                      <span className="text-xs font-semibold text-slate-200">
                        Cross-Document Discrepancy Flag
                      </span>
                    </div>
                    <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-teal/20 text-teal-light border border-teal/30">
                      Awaiting Review
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed pl-6">
                    Seizure Memo log records the vehicle impounded at{' '}
                    <span className="font-semibold text-teal-light">20:15 hours</span> at Sector 9 post (1.5 hrs earlier).
                  </p>
                  <div className="mt-2.5 pl-6 flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="text-teal-light font-mono underline cursor-default">View Seizure Memo (p. 2)</span>
                    <span>·</span>
                    <span className="text-gold-light font-mono underline cursor-default">Inspect Statement (p. 4)</span>
                  </div>
                </div>

                {/* 3. Chronology Ribbon */}
                <div className="rounded-xl border border-white/10 bg-midnight-950/60 p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-gold/10 text-gold border border-gold/20">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-medium text-slate-200 text-xs block">Procedural Timeline</span>
                      <span className="text-[10px] text-slate-400">14 verified milestones logged</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Audit Ready</span>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

          {/* ══════════ RIGHT COLUMN: Approach Description ══════════ */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, ease: 'easeOut', delay: 0.1 }}
            className="lg:col-span-6 flex flex-col justify-center"
          >
            {/* Small Label */}
            <div className="flex items-center gap-2 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold">
                OUR APPROACH
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-100 tracking-tight leading-[1.25] mb-5">
              Legal Preparation,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-light via-gold to-gold-champagne">
                Made More Structured.
              </span>
            </h2>

            {/* Description */}
            <p className="text-base text-slate-300/90 leading-relaxed mb-6 font-light">
              NyayaTrace helps legal professionals organize lengthy case files, understand key events,
              trace findings to their original sources, and review potential inconsistencies without repeatedly
              searching through every page.
            </p>

            <p className="text-sm text-slate-400 leading-relaxed mb-8">
              Every summary passage links directly to the uploaded court record and page index,
              giving lawyers and judicial clerks an immutable, human-verified audit trail for every argument.
            </p>

            {/* Secondary Link */}
            <div>
              <a
                href="#services"
                onClick={scrollToServices}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-gold-light hover:text-gold transition-colors"
              >
                <span>Explore NyayaTrace</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
export default IntroductionSection
