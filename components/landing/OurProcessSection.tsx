'use client'

import React, { useRef, useState } from 'react'
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion'
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
  description: string
  icon: React.ElementType
  accentColor: string
  renderVisual: () => React.ReactNode
}

export function OurProcessSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-80px' })
  const shouldReduceMotion = useReducedMotion()
  const [hoveredStage, setHoveredStage] = useState<string | null>(null)

  const STAGES: Stage[] = [
    {
      number: '01',
      title: 'Upload Documents',
      shortLabel: 'Upload',
      description: 'Upload FIRs, chargesheets, witness statements, and court orders in PDF or image format.',
      icon: UploadCloud,
      accentColor: 'gold',
      renderVisual: () => (
        <div className="relative min-h-[148px] w-full rounded-xl bg-midnight-950/90 border border-white/10 flex items-center justify-center p-3">
          <div className="absolute -left-1 top-4 w-12 h-16 rounded border border-white/10 bg-midnight-800/90 rotate-[-10deg] flex flex-col p-1.5 gap-1.5 pointer-events-none">
            <div className="h-1.5 w-6 bg-slate-600 rounded" />
            <div className="h-1.5 w-8 bg-slate-700 rounded" />
          </div>
          <div className="absolute -right-1 top-4 w-12 h-16 rounded border border-white/10 bg-midnight-800/90 rotate-[10deg] flex flex-col p-1.5 gap-1.5 pointer-events-none">
            <div className="h-1.5 w-7 bg-slate-600 rounded" />
            <div className="h-1.5 w-5 bg-slate-700 rounded" />
          </div>
          <motion.div
            animate={isInView ? { scale: [1, 1.04, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
            className="relative z-10 w-32 py-3 px-3 rounded-xl border border-gold/40 bg-gradient-to-b from-midnight-800 to-midnight-900 flex flex-col items-center justify-center gap-1.5 shadow-lg"
          >
            <FolderDown className="w-5 h-5 text-gold" />
            <span className="text-xs font-mono font-semibold text-gold-champagne">Case Records</span>
          </motion.div>
          {/* Animated upload particles */}
          {isInView && !shouldReduceMotion && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-gold/60"
                  initial={{ y: 20, x: (i - 1) * 14, opacity: 0 }}
                  animate={{ y: -20, opacity: [0, 1, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.4 + 0.6, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
        </div>
      ),
    },
    {
      number: '02',
      title: 'Extract & Organize',
      shortLabel: 'Extract',
      description: 'Run on-device OCR, extract key event dates, and build chronological milestone timelines.',
      icon: Layers,
      accentColor: 'teal',
      renderVisual: () => (
        <div className="relative min-h-[148px] w-full rounded-xl bg-midnight-950/90 border border-white/10 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-300 border-b border-white/10 pb-1.5">
            <span className="font-mono text-teal-light flex items-center gap-1.5 font-medium">
              <CalendarDays className="w-3.5 h-3.5" /> Events Extracted
            </span>
            <motion.span
              animate={isInView ? { opacity: [0.4, 1, 0.4] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="text-emerald-400 font-mono font-semibold text-xs"
            >OCR ✓</motion.span>
          </div>
          <div className="space-y-2 mt-2">
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
                className="flex items-center gap-2 text-xs"
              >
                <span className="font-mono text-gold-light text-[11px] font-semibold w-14 shrink-0">{item.date}</span>
                <motion.div
                  animate={isInView ? { scale: [1, 1.4, 1] } : {}}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5 + 1 }}
                  className={`h-2 w-2 rounded-full ${item.color} shrink-0`}
                />
                <span className="text-slate-200 truncate font-medium text-[11px]">{item.label}</span>
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
      description: 'Pinpoint cross-document discrepancies with instant links back to original page numbers.',
      icon: SearchCheck,
      accentColor: 'amber',
      renderVisual: () => (
        <div className="relative min-h-[148px] w-full rounded-xl bg-midnight-950/90 border border-white/10 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-300 border-b border-white/10 pb-1.5">
            <span className="font-mono text-gold flex items-center gap-1.5 font-medium">
              <Link className="w-3.5 h-3.5" /> Citation Trace
            </span>
            <motion.span
              animate={isInView ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
              className="text-amber-400 font-mono font-semibold text-[11px]"
            >⚠ Inconsistency</motion.span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="rounded-lg border border-white/10 bg-midnight-900/90 p-2 flex flex-col justify-between">
              <div>
                <span className="text-gold-light font-bold block text-xs">Witness Stmt</span>
                <span className="text-slate-200 block text-[11px] mt-0.5 leading-snug">&ldquo;10 PM at scene&rdquo;</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-1 block">p.8 · Para 3</span>
            </div>
            <motion.div
              animate={isInView ? { borderColor: ['rgba(245,158,11,0.3)', 'rgba(245,158,11,0.7)', 'rgba(245,158,11,0.3)'] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 flex flex-col justify-between"
            >
              <div>
                <span className="text-amber-300 font-bold block text-xs">Duty Log</span>
                <span className="text-slate-200 block text-[11px] mt-0.5 leading-snug">&ldquo;On patrol duty&rdquo;</span>
              </div>
              <span className="text-[10px] font-mono text-amber-300/90 mt-1 block">p.14 · Line 6</span>
            </motion.div>
          </div>
        </div>
      ),
    },
    {
      number: '04',
      title: 'Prepare Brief',
      shortLabel: 'Brief',
      description: 'Compile grounded facts, discrepancy tables, and statutory relief points into court-ready briefs.',
      icon: FileCheck2,
      accentColor: 'emerald',
      renderVisual: () => (
        <div className="relative min-h-[148px] w-full rounded-xl bg-midnight-950/90 border border-white/10 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-300 border-b border-white/10 pb-1.5">
            <span className="font-mono text-emerald-400 flex items-center gap-1.5 font-medium">
              <FileText className="w-3.5 h-3.5" /> Working Brief
            </span>
            <motion.span
              animate={isInView ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
              className="text-teal-light font-mono text-xs font-semibold"
            >Hearing Ready</motion.span>
          </div>
          <div className="space-y-1.5 mt-2">
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
                className="flex items-center justify-between text-xs bg-white/[0.04] px-2.5 py-1.5 rounded"
              >
                <span className="text-slate-100 font-medium text-[11px] truncate mr-1">{item.label}</span>
                <span className={`${item.color} font-mono text-[11px] font-semibold shrink-0`}>{item.tag}</span>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
  ]

  return (
    <section id="process" className="relative py-16 lg:py-24 border-b border-white/5 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 50% 10%, rgba(229, 195, 120, 0.05) 0%, transparent 60%),
              radial-gradient(ellipse 40% 40% at 80% 80%, rgba(13, 148, 136, 0.05) 0%, transparent 60%),
              linear-gradient(180deg, #070A0F 0%, #0B0F17 50%, #070A0F 100%)
            `,
          }}
        />
      </div>

      <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-center max-w-3xl mx-auto mb-12 lg:mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-gold">
              STRUCTURED WORKFLOW
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-100 tracking-tight leading-tight mb-4">
            Our Process
          </h2>
          <p className="text-base sm:text-lg text-slate-300/90 font-light">
            From lengthy documents to hearing-ready briefs — in four structured steps.
          </p>
        </motion.div>

        {/* Desktop Progress Line & Stage Labels */}
        <div className="hidden lg:block relative mb-12">
          {/* Animated connecting track */}
          <div className="absolute top-5 left-12 right-12 h-0.5 bg-white/5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-gold/60 via-teal/60 to-gold/60"
              initial={{ scaleX: 0, originX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            />
          </div>

          <div className="relative flex justify-between items-start max-w-4xl mx-auto">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon
              const isHovered = hoveredStage === stage.number
              return (
                <div key={stage.number} className="flex flex-col items-center gap-2 shrink-0">
                  <motion.div
                    initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: idx * 0.15 + 0.3, duration: 0.4, ease: 'backOut' }}
                    className="flex flex-col items-center gap-2 shrink-0"
                  >
                    <motion.div
                      animate={isHovered ? { scale: 1.12, borderColor: 'rgba(229,195,120,0.8)' } : { scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-midnight-900 text-gold shadow-lg shadow-gold/10"
                    >
                      <Icon className="w-5 h-5 text-gold-light" />
                    </motion.div>
                    <motion.span
                      animate={isHovered ? { color: '#e5c378' } : { color: '#cbd5e1' }}
                      className="text-xs font-mono font-semibold"
                    >
                      {stage.shortLabel}
                    </motion.span>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 4 Stage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 items-stretch">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon
            return (
              <motion.div
                key={stage.number}
                initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: 'easeOut', delay: shouldReduceMotion ? 0 : 0.15 + idx * 0.14 }}
                onHoverStart={() => setHoveredStage(stage.number)}
                onHoverEnd={() => setHoveredStage(null)}
                className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-midnight-950/80 p-5 shadow-xl hover:border-gold/40 hover:bg-midnight-950 transition-all duration-300 cursor-default"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <motion.div
                      animate={hoveredStage === stage.number ? { scale: 1.1, rotate: [0, -4, 4, 0] } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/30 bg-gradient-to-b from-midnight-800 to-midnight-900 text-gold shadow-md group-hover:border-gold"
                    >
                      <Icon className="w-5 h-5 text-gold-light" />
                    </motion.div>
                    <motion.span
                      animate={hoveredStage === stage.number ? { opacity: 0.9 } : { opacity: 0.4 }}
                      transition={{ duration: 0.25 }}
                      className="text-xl sm:text-2xl font-black text-gold"
                    >
                      {stage.number}
                    </motion.span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-1.5">{stage.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed mb-4">{stage.description}</p>
                </div>
                <div className="w-full mt-auto">{stage.renderVisual()}</div>

                {/* Bottom accent line */}
                <motion.div
                  className="mt-4 h-0.5 rounded-full bg-gradient-to-r from-gold/60 to-teal/60"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={hoveredStage === stage.number ? { scaleX: 1 } : { scaleX: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </motion.div>
            )
          })}
        </div>

        {/* Traditional vs NyayaTrace comparison strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: shouldReduceMotion ? 0 : 0.6 }}
          className="mt-12 lg:mt-16 rounded-2xl border border-white/10 bg-midnight-950/90 p-6 sm:p-8 backdrop-blur-md shadow-2xl"
        >
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.45, delay: 0.65 }}
            className="flex items-center justify-center gap-2.5 mb-7"
          >
            <motion.div
              animate={isInView ? { rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 1.2, delay: 0.8, ease: 'easeInOut' }}
            >
              <Zap className="w-5 h-5 text-gold" />
            </motion.div>
            <span className="text-base sm:text-lg font-bold text-slate-100">Elevating the Legal Research Standard</span>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Traditional */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -18 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-5"
            >
              <div className="flex items-center gap-2.5 mb-3.5 text-rose-400">
                <XCircle className="w-4 h-4 shrink-0" />
                <span className="text-sm font-bold uppercase tracking-wider">Traditional</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                {['Open PDFs', 'Page-by-page search', 'Re-read statements', 'Manually organize'].map((step, i, arr) => (
                  <React.Fragment key={step}>
                    <motion.span
                      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.75 + i * 0.09 }}
                      className="bg-midnight-900 px-3 py-1.5 rounded border border-white/10 text-slate-300 font-medium"
                    >
                      {step}
                    </motion.span>
                    {i < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-rose-300/80 mt-4 pt-3 border-t border-white/5 leading-relaxed font-normal">
                Prone to missed cross-references and repetitive searching under time pressure.
              </p>
            </motion.div>

            {/* NyayaTrace */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 18 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.75 }}
              className="rounded-xl border border-teal/40 bg-teal/5 p-5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-2.5 mb-3.5 text-teal-light">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-sm font-bold uppercase tracking-wider">NyayaTrace-Assisted</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                {['Organize docs', 'Source-linked synopsis', 'Review passages', 'Structured brief'].map((step, i, arr) => (
                  <React.Fragment key={step}>
                    <motion.span
                      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.8 + i * 0.09 }}
                      className={`px-3 py-1.5 rounded border font-semibold ${i === arr.length - 1 ? 'border-gold/50 bg-midnight-900/90 text-gold-light' : 'border-teal/40 bg-midnight-900/90 text-teal-light'}`}
                    >
                      {step}
                    </motion.span>
                    {i < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-teal shrink-0" />}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-200 mt-4 pt-3 border-t border-teal/20 leading-relaxed font-normal">
                Immediate traceability to source records with full editorial control.
              </p>
            </motion.div>

          </div>
        </motion.div>

      </div>
    </section>
  )
}
