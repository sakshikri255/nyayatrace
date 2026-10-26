'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link2, ShieldCheck, UserCheck, Shield } from 'lucide-react'

export function TrustSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  const PRINCIPLES = [
    {
      title: 'Source-Linked Findings',
      principle: 'Traceability Over Assumptions',
      description:
        'Findings refer back to available uploaded documents and page numbers whenever possible. Legal arguments are only as reliable as their grounding in authentic records.',
      icon: Link2,
      accent: 'teal',
    },
    {
      title: 'Human Verification',
      principle: 'Lawyer in the Loop',
      description:
        'AI-generated findings remain unverified until reviewed by the user. The platform surfaces potential discrepancies; the advocate determines their evidentiary weight.',
      icon: ShieldCheck,
      accent: 'gold',
    },
    {
      title: 'Professional Control',
      principle: 'Assistive, Not Adjudicative',
      description:
        'NyayaSetu assists lawyers and law students to organize and understand cases; it does not decide cases, determine guilt, or replace professional legal judgment.',
      icon: UserCheck,
      accent: 'teal',
    },
  ]

  return (
    <section
      ref={ref}
      className="relative py-20 lg:py-28 overflow-hidden border-b border-white/5 bg-midnight-900"
    >
      {/* Background radial gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 50% 50%, rgba(197, 168, 128, 0.04) 0%, transparent 70%),
              radial-gradient(ellipse 50% 30% at 20% 80%, rgba(13, 148, 136, 0.04) 0%, transparent 60%)
            `,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-gold" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold">
              INTEGRITY &amp; GOVERNANCE
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-4xl font-semibold text-slate-100 tracking-tight leading-tight mb-4">
            Trust and Responsibility
          </h2>

          <p className="text-base sm:text-lg text-slate-300/90 font-light">
            Built on core legal ethics — maintaining verifiable evidence, transparent reasoning, and attorney autonomy.
          </p>
        </div>

        {/* 3 Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {PRINCIPLES.map((item, idx) => {
            const Icon = item.icon
            const isGold = item.accent === 'gold'
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: idx * 0.12, ease: 'easeOut' }}
                className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-midnight-950/80 p-6 sm:p-7 shadow-xl hover:border-gold/30 transition-all duration-300"
              >
                {/* Top Corner Accent Notch */}
                <div
                  className={`absolute top-0 left-8 right-8 h-px ${
                    isGold
                      ? 'bg-gradient-to-r from-transparent via-gold/60 to-transparent'
                      : 'bg-gradient-to-r from-transparent via-teal/50 to-transparent'
                  }`}
                />

                <div>
                  {/* Icon & Label */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                        isGold
                          ? 'border-gold/30 bg-gold/10 text-gold-light'
                          : 'border-teal/30 bg-teal/10 text-teal-light'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
                      Principle {idx + 1}
                    </span>
                  </div>

                  <span className="text-[11px] font-medium tracking-wide text-gold block mb-1">
                    {item.principle}
                  </span>

                  <h3 className="text-lg font-semibold text-slate-100 mb-3">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Assurance */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Audit Compliant</span>
                  <span>Human Overridable</span>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
export default TrustSection
