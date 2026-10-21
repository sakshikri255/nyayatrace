'use client'

import React, { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import {
  UploadCloud,
  Layers,
  SearchCheck,
  FileCheck2,
  FolderDown,
  CalendarDays,
  FileText,
  Link,
  ArrowRight,
  XCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react'

interface Stage {
  number: string
  title: string
  shortLabel: string
  icon: React.ElementType
  accentColor: string
  renderVisual: () => React.ReactNode
}

export function OurProcessSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-80px' })
  const shouldReduceMotion = useReducedMotion()

  const STAGES: Stage[] = [
    {
      number: '01',
      title: 'Upload Documents',
      shortLabel: 'Upload',
      icon: UploadCloud,
      accentColor: 'gold',
      renderVisual: () => (
        <div className="relative h-24 w-full rounded-lg bg-midnight-950/80 border border-white/10 overflow-hidden flex items-center justify-center">
          <div className="absolute -left-1 top-3 w-11 h-13 rounded border border-white/10 bg-midnight-800/90 rotate-[-10deg] flex flex-col p-1.5 gap-1">
            <div className="h-1 w-5 bg-slate-600 rounded" />
            <div className="h-1 w-7 bg-slate-700 rounded" />
          </div>
          <div className="absolute -right-1 top-3 w-11 h-13 rounded border border-white/10 bg-midnight-800/90 rotate-[10deg] flex flex-col p-1.5 gap-1">
            <div className="h-1 w-6 bg-slate-600 rounded" />
            <div className="h-1 w-4 bg-slate-700 rounded" />
          </div>
          <motion.div
            animate={isInView ? { scale: [1, 1.04, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
            className="relative z-10 w-16 h-14 rounded-lg border border-gold/40 bg-gradient-to-b from-midnight-800 to-midnight-900 flex flex-col items-center justify-center gap-1"
          >
            <FolderDown className="w-5 h-5 text-gold" />
            <span className="text-[8px] font-mono text-gold-champagne">Case Records</span>
          </motion.div>
        </div>
      ),
    },
    {
      number: '02',
      title: 'Extract & Organize',
      shortLabel: 'Extract',
      icon: Layers,
      accentColor: 'teal',
      renderVisual: () => (
        <div className="relative h-24 w-full rounded-lg bg-midnight-950/80 border border-white/10 p-2.5 overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-[9px] text-slate-400 border-b border-white/5 pb-1">
            <span className="font-mono text-teal-light flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> Events Extracted
            </span>
            <motion.span
              animate={isInView ? { opacity: [0.4, 1, 0.4] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="text-emerald-400 font-mono"
            >OCR ✓</motion.span>
          </div>
          <div className="space-y-1 py-0.5">
            {[
              { date: '12 Jan', label: 'FIR Registered', color: 'bg-teal' },
              { date: '14 Jan', label: 'Remand Order', color: 'bg-gold' },
              { date: '28 Feb', label: 'Forensic Report', color: 'bg-teal-light' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -8 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.35 }}
                className="flex items-center gap-2 text-[9px]"
              >
                <span className="font-mono text-gold text-[8px] w-10 shrink-0">{item.date}</span>
                <div className={`h-1.5 w-1.5 rounded-full ${item.color} shrink-0`} />
                <span className="text-slate-300 truncate">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      number: '03',
      title: 'Trace & Verify',
      shortLabel: 'Verify',
      icon: SearchCheck,
      accentColor: 'amber',
      renderVisual: () => (
        <div className="relative h-24 w-full rounded-lg bg-midnight-950/80 border border-white/10 p-2.5 overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-[9px] text-slate-400 border-b border-white/5 pb-1">
            <span className="font-mono text-gold flex items-center gap-1">
              <Link className="w-3 h-3" /> Citation Trace
            </span>
            <motion.span
              animate={isInView ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
              className="text-amber-400 font-mono"
            >⚠ Inconsistency</motion.span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 py-0.5">
            <div className="rounded border border-white/10 bg-midnight-900/90 p-1.5">
              <span className="text-gold-light font-medium block text-[8px]">Witness Stmt</span>
              <span className="text-slate-400 block text-[8px] mt-0.5">"10 PM at scene"</span>
              <span className="text-[7px] font-mono text-slate-500 mt-0.5 block">p.8 · Para 3</span>
            </div>
            <div className="rounded border border-amber-500/30 bg-amber-500/5 p-1.5">
              <span className="text-amber-300 font-medium block text-[8px]">Duty Log</span>
              <span className="text-slate-300 block text-[8px] mt-0.5">"On patrol duty"</span>
              <span className="text-[7px] font-mono text-amber-400/80 mt-0.5 block">p.14 · Line 6</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: '04',
      title: 'Prepare Brief',
      shortLabel: 'Brief',
      icon: FileCheck2,
      accentColor: 'emerald',
      renderVisual: () => (
        <div className="relative h-24 w-full rounded-lg bg-midnight-950/80 border border-white/10 p-2.5 overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-[9px] text-slate-400 border-b border-white/5 pb-1">
            <span className="font-mono text-emerald-400 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Working Brief
            </span>
            <span className="text-teal-light font-mono text-[8px]">Hearing Ready</span>
          </div>
          <div className="space-y-1 py-0.5">
            {[
              { label: 'Grounds for Bail', tag: 'Sec. 167(2)', color: 'text-gold' },
              { label: 'Discrepancy Matrix', tag: '3 Citations', color: 'text-teal-light' },
              { label: 'Master Chronology', tag: 'Verified ✓', color: 'text-emerald-400' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 8 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
                className="flex items-center justify-between text-[9px] bg-white/[0.02] px-1.5 py-0.5 rounded"
              >
                <span className="text-slate-200">{item.label}</span>
                <span className={`${item.color} font-mono text-[8px]`}>{item.tag}</span>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
  ]

  return (
    <section
      id="process"
      ref={containerRef}
      className="relative py-16 lg:py-24 overflow-hidden border-b border-white/5 bg-midnight-900"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 50% 20%, rgba(197, 168, 128, 0.05) 0%, transparent 60%),
              radial-gradient(ellipse 70% 40% at 50% 80%, rgba(13, 148, 136, 0.05) 0%, transparent 60%)
            `,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold">
              STRUCTURED WORKFLOW
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-slate-100 tracking-tight leading-tight mb-3">
            Our Process
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-light">
            From lengthy documents to hearing-ready briefs — in four structured steps.
          </p>
        </div>

        {/* Animated Flow Bar (desktop) */}
        <div className="hidden lg:flex items-center justify-center gap-0 mb-8 px-8">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon
            return (
              <React.Fragment key={stage.number}>
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: idx * 0.15, duration: 0.4, ease: 'backOut' }}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-gradient-to-b from-midnight-800 to-midnight-900 shadow-md">
                    <Icon className="w-4 h-4 text-gold-light" />
                  </div>
                  <span className="text-[10px] font-semibold text-gold/80 tracking-wider">{stage.shortLabel}</span>
                </motion.div>
                {idx < STAGES.length - 1 && (
                  <div className="flex-1 mx-2 h-0.5 relative">
                    <div className="absolute inset-0 bg-white/10" />
                    <motion.div
                      initial={shouldReduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
                      animate={isInView ? { scaleX: 1 } : {}}
                      transition={{ delay: idx * 0.15 + 0.2, duration: 0.5, ease: 'easeInOut' }}
                      style={{ originX: 0 }}
                      className="absolute inset-0 bg-gradient-to-r from-gold via-teal to-gold"
                    />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* 4 Stage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon
            return (
              <motion.div
                key={stage.number}
                initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, ease: 'easeOut', delay: shouldReduceMotion ? 0 : 0.1 + idx * 0.12 }}
                className="group flex flex-col rounded-2xl border border-white/10 bg-midnight-950/80 p-4 shadow-xl hover:border-gold/30 hover:bg-midnight-950 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-gradient-to-b from-midnight-800 to-midnight-900 text-gold shadow-md group-hover:scale-105 group-hover:border-gold transition-transform">
                    <Icon className="w-4 h-4 text-gold-light" />
                  </div>
                  <span className="text-base font-bold text-gold/30 group-hover:text-gold/70 transition-colors">
                    {stage.number}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-100 mb-1">{stage.title}</h3>
                <div className="mt-auto pt-2">{stage.renderVisual()}</div>
              </motion.div>
            )
          })}
        </div>

        {/* Comparison: Traditional vs NyayaTrace */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-12 lg:mt-16 rounded-2xl border border-white/10 bg-midnight-950/90 p-5 sm:p-7 backdrop-blur-md shadow-2xl"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Zap className="w-4 h-4 text-gold" />
            <span className="text-sm font-semibold text-slate-100">Elevating the Legal Research Standard</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Traditional */}
            <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4">
              <div className="flex items-center gap-2 mb-3 text-rose-400">
                <XCircle className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wide">Traditional</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {['Open PDFs', 'Page-by-page search', 'Re-read statements', 'Manually organize'].map((step, i, arr) => (
                  <React.Fragment key={step}>
                    <span className="bg-midnight-900 px-2.5 py-1 rounded border border-white/10 text-slate-300">{step}</span>
                    {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-[10px] text-rose-300/70 mt-3 pt-2 border-t border-white/5">
                Prone to missed cross-references and repetitive searching under time pressure.
              </p>
            </div>

            {/* NyayaTrace */}
            <div className="rounded-xl border border-teal/40 bg-teal/5 p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-teal/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-3 text-teal-light">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wide">NyayaTrace-Assisted</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {['Organize docs', 'Source-linked synopsis', 'Review passages', 'Structured brief'].map((step, i, arr) => (
                  <React.Fragment key={step}>
                    <span className={`px-2.5 py-1 rounded border font-medium ${i === arr.length - 1 ? 'border-gold/40 bg-midnight-900/90 text-gold-light' : 'border-teal/30 bg-midnight-900/90 text-teal-light'}`}>{step}</span>
                    {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-teal shrink-0" />}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-[10px] text-slate-300/80 mt-3 pt-2 border-t border-teal/20">
                Immediate traceability to source records with full editorial control.
              </p>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  )
}
export default OurProcessSection
