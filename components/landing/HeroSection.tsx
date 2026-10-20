'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Compass, ShieldCheck, FileCheck, UserCheck } from 'lucide-react'
import { AnimatedLadyJustice } from './AnimatedLadyJustice'

export function HeroSection() {
  const scrollToProcess = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.getElementById('process')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const scrollToWorkspace = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.getElementById('workspace')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-white/5">
      {/* ── Subtle Background Ambience ── */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {/* Soft dark legal chambers gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 75% 25%, rgba(229, 195, 120, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 20% 75%, rgba(13, 148, 136, 0.08) 0%, transparent 60%),
              linear-gradient(180deg, #070A0F 0%, #0B0F17 60%, #070A0F 100%)
            `,
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle, #C5A880 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* ══════════ LEFT COLUMN: Text and Actions ══════════ */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            {/* Eyebrow with gold accent line */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex items-center gap-3 mb-5"
            >
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-gold" />
              <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-gold font-serif">
                LEGAL INTELLIGENCE FOR CASE PREPARATION
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
              className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-slate-100 leading-[1.18] mb-6"
            >
              Complex Case Files.{' '}
              <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-gold-light via-gold to-gold-champagne">
                Clearer Legal Understanding.
              </span>
            </motion.h1>

            {/* Supporting Text */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.16 }}
              className="text-base sm:text-lg text-slate-300/90 leading-relaxed max-w-2xl mb-8 font-sans font-light"
            >
              Turn lengthy legal documents into structured case briefs, traceable evidence,
              and hearing-ready insights — with the lawyer always in control.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.24 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-10"
            >
              <a
                href="#workspace"
                onClick={scrollToWorkspace}
                className="group inline-flex items-center justify-center gap-2.5 rounded-lg bg-gradient-to-r from-gold-muted via-gold to-gold-light px-6 py-3.5 text-sm font-semibold text-midnight-950 shadow-lg shadow-gold/15 hover:brightness-110 active:scale-[0.99] transition-all font-sans"
              >
                <span>Open Your Workspace</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-midnight-900" />
              </a>

              <a
                href="#process"
                onClick={scrollToProcess}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/30 bg-midnight-800/60 px-6 py-3.5 text-sm font-medium text-slate-200 hover:bg-midnight-700/80 hover:border-gold/60 hover:text-white transition-all backdrop-blur-sm"
              >
                <Compass className="w-4 h-4 text-gold-light" />
                <span>Explore Our Process</span>
              </a>
            </motion.div>

            {/* Restrained Trust Pillars */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-slate-400"
            >
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-teal-light shrink-0" />
                <span>Source-linked findings</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                <span>Human verification loop</span>
              </div>
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-teal-light shrink-0" />
                <span>Lawyer in full control</span>
              </div>
            </motion.div>

          </div>

          {/* ══════════ RIGHT COLUMN: Animated Lady Justice ══════════ */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <AnimatedLadyJustice />
          </div>

        </div>
      </div>
    </section>
  )
}
export default HeroSection
