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
} from 'lucide-react'

interface Stage {
  number: string
  title: string
  description: string
  icon: React.ElementType
  renderVisual: () => React.ReactNode
}

export function OurProcessSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-80px' })
  const shouldReduceMotion = useReducedMotion()

  const STAGES: Stage[] = [
    {
      number: '01',
      title: 'Upload Case Documents',
      description:
        'Bring authorized case PDFs, statements, orders, and supporting documents into one organized workspace.',
      icon: UploadCloud,
      renderVisual: () => (
        <div className="relative h-28 w-full rounded-lg bg-midnight-950/80 border border-white/10 p-3 overflow-hidden flex items-center justify-center">
          {/* Subtle Converging Pages into Folder Graphic */}
          <div className="relative flex items-center justify-center w-full h-full">
            {/* Background floating pages */}
            <div className="absolute -left-1 top-2 w-12 h-14 rounded border border-white/10 bg-midnight-800/90 rotate-[-12deg] shadow-sm flex flex-col p-1.5 gap-1">
              <div className="h-1 w-6 bg-slate-600 rounded" />
              <div className="h-1 w-8 bg-slate-700 rounded" />
              <div className="h-1 w-5 bg-slate-700 rounded" />
            </div>
            <div className="absolute -right-1 top-2 w-12 h-14 rounded border border-white/10 bg-midnight-800/90 rotate-[12deg] shadow-sm flex flex-col p-1.5 gap-1">
              <div className="h-1 w-7 bg-slate-600 rounded" />
              <div className="h-1 w-5 bg-slate-700 rounded" />
              <div className="h-1 w-8 bg-slate-700 rounded" />
            </div>
            {/* Center target case folder */}
            <div className="relative z-10 w-20 h-16 rounded-lg border border-gold/40 bg-gradient-to-b from-midnight-800 to-midnight-900 shadow-lg flex flex-col items-center justify-center p-2">
              <FolderDown className="w-6 h-6 text-gold mb-1" />
              <span className="text-[9px] font-mono text-gold-champagne font-medium">Case Records</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: '02',
      title: 'Extract and Organize',
      description:
        'Extract available text, process supported scanned pages, and organize key facts and events into a structured synopsis and chronology.',
      icon: Layers,
      renderVisual: () => (
        <div className="relative h-28 w-full rounded-lg bg-midnight-950/80 border border-white/10 p-2.5 overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/5 pb-1">
            <span className="font-mono text-teal-light flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> Event Extraction
            </span>
            <span className="text-emerald-400 font-mono text-[9px]">OCR Processed</span>
          </div>
          {/* Micro timeline and summary row */}
          <div className="space-y-1.5 py-1">
            <div className="flex items-center gap-2 text-[10px]">
              <span className="font-mono text-gold text-[9px] w-12 shrink-0">12 Jan</span>
              <div className="h-1.5 w-1.5 rounded-full bg-teal shrink-0" />
              <span className="text-slate-300 truncate">FIR No. 102 Registered</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="font-mono text-gold text-[9px] w-12 shrink-0">14 Jan</span>
              <div className="h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
              <span className="text-slate-300 truncate">Initial Remand Order</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="font-mono text-gold text-[9px] w-12 shrink-0">28 Feb</span>
              <div className="h-1.5 w-1.5 rounded-full bg-teal-light shrink-0" />
              <span className="text-slate-300 truncate">Forensic Report Logged</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: '03',
      title: 'Trace and Verify',
      description:
        'Compare relevant passages, inspect potential inconsistencies, and trace each finding to its source document and page.',
      icon: SearchCheck,
      renderVisual: () => (
        <div className="relative h-28 w-full rounded-lg bg-midnight-950/80 border border-white/10 p-2.5 overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/5 pb-1">
            <span className="font-mono text-gold flex items-center gap-1">
              <Link className="w-3 h-3" /> Dual Citation Trace
            </span>
            <span className="text-amber-400 font-mono text-[9px]">Inconsistency</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[9px] py-1">
            <div className="rounded border border-white/10 bg-midnight-900/90 p-1.5">
              <span className="text-gold-light font-medium block">Witness Statement</span>
              <span className="text-slate-400 block truncate mt-0.5">“Present at scene at 10 PM”</span>
              <span className="text-[8px] font-mono text-slate-500 mt-1 block">p. 8 · Para 3</span>
            </div>
            <div className="rounded border border-amber-500/20 bg-amber-500/5 p-1.5">
              <span className="text-amber-300 font-medium block">Duty Log Report</span>
              <span className="text-slate-300 block truncate mt-0.5">“Officer on patrol duty”</span>
              <span className="text-[8px] font-mono text-amber-400/80 mt-1 block">p. 14 · Line 6</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: '04',
      title: 'Prepare with Clarity',
      description:
        'Use the reviewed synopsis, chronology, evidence references, and key issues to build an editable working brief.',
      icon: FileCheck2,
      renderVisual: () => (
        <div className="relative h-28 w-full rounded-lg bg-midnight-950/80 border border-white/10 p-2.5 overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/5 pb-1">
            <span className="font-mono text-emerald-400 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Working Legal Brief
            </span>
            <span className="text-teal-light font-mono text-[9px]">Hearing Ready</span>
          </div>
          <div className="space-y-1.5 py-1">
            <div className="flex items-center justify-between text-[10px] bg-white/[0.02] p-1 rounded">
              <span className="text-slate-200">1. Grounds for Bail / Relief</span>
              <span className="text-gold text-[8px] font-mono">Sec. 167(2)</span>
            </div>
            <div className="flex items-center justify-between text-[10px] bg-white/[0.02] p-1 rounded">
              <span className="text-slate-200">2. Discrepancy Matrix</span>
              <span className="text-teal-light text-[8px] font-mono">3 Citations</span>
            </div>
            <div className="flex items-center justify-between text-[10px] bg-white/[0.02] p-1 rounded">
              <span className="text-slate-200">3. Master Chronology</span>
              <span className="text-emerald-400 text-[8px] font-mono">Verified</span>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <section
      id="process"
      ref={containerRef}
      className="relative py-20 lg:py-28 overflow-hidden border-b border-white/5 bg-midnight-900"
    >
      {/* ── Background Elements ── */}
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
        
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold font-serif">
              STRUCTURED WORKFLOW
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-4xl font-normal text-slate-100 tracking-tight leading-tight mb-4">
            Our Process
          </h2>

          <p className="text-base sm:text-lg text-slate-300/90 font-light">
            From lengthy documents to a clearer understanding of the case.
          </p>
        </div>

        {/* ── Desktop Flowing Journey Line & 4 Stages ── */}
        <div className="relative">
          
          {/* Animated Connecting Flow Line (Desktop) */}
          <div className="hidden lg:block absolute top-[68px] left-[12%] right-[12%] h-0.5 -z-0">
            {/* Background static line */}
            <div className="absolute inset-0 bg-white/10" />
            {/* Animated drawing line */}
            <motion.div
              initial={shouldReduceMotion ? { width: '100%' } : { width: '0%' }}
              animate={isInView ? { width: '100%' } : {}}
              transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.2 }}
              className="absolute inset-0 bg-gradient-to-r from-gold via-teal to-gold"
            />
          </div>

          {/* 4 Stages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6 relative z-10">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon
              return (
                <motion.div
                  key={stage.number}
                  initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    ease: 'easeOut',
                    delay: shouldReduceMotion ? 0 : 0.15 * idx,
                  }}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-midnight-950/80 p-5 shadow-xl hover:border-gold/30 hover:bg-midnight-950 transition-all duration-300"
                >
                  {/* Stage Number & Icon Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-gradient-to-b from-midnight-800 to-midnight-900 text-gold shadow-md group-hover:scale-105 group-hover:border-gold transition-transform">
                      <Icon className="w-5 h-5 text-gold-light" />
                    </div>
                    <span className="font-serif text-lg font-bold text-gold/40 group-hover:text-gold/80 transition-colors">
                      {stage.number}
                    </span>
                  </div>

                  {/* Stage Title */}
                  <h3 className="font-serif text-base font-medium text-slate-100 mb-2">
                    {stage.title}
                  </h3>

                  {/* Stage Description */}
                  <p className="text-xs text-slate-400 leading-relaxed mb-4 min-h-[56px] font-light">
                    {stage.description}
                  </p>

                  {/* Mini Visual Transformation Card */}
                  <div className="mt-auto pt-2">
                    {stage.renderVisual()}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ── Workflow Comparison: Traditional vs. NyayaTrace ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 lg:mt-20 rounded-2xl border border-white/10 bg-midnight-950/90 p-6 sm:p-8 backdrop-blur-md shadow-2xl"
        >
          <div className="text-center mb-8">
            <span className="text-[11px] font-serif tracking-widest uppercase text-gold">
              METHODOLOGY COMPARISON
            </span>
            <h4 className="font-serif text-xl sm:text-2xl font-normal text-slate-100 mt-1">
              Elevating the Legal Research Standard
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Traditional Workflow Card */}
            <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 text-rose-400">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span className="font-serif text-sm font-semibold tracking-wide uppercase">
                    Traditional Workflow
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-sans mt-3">
                  <span className="bg-midnight-900 px-3 py-1.5 rounded border border-white/10">
                    Open PDFs
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="bg-midnight-900 px-3 py-1.5 rounded border border-white/10">
                    Search page by page
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="bg-midnight-900 px-3 py-1.5 rounded border border-white/10">
                    Re-read statements
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="bg-midnight-900 px-3 py-1.5 rounded border border-white/10">
                    Manually organize events
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-white/5">
                Prone to missed cross-references, fragmented notes, and repetitive page searches under time pressure.
              </p>
            </div>

            {/* NyayaTrace-Assisted Workflow Card */}
            <div className="rounded-xl border border-teal/40 bg-teal/5 p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="flex items-center gap-2 mb-3 text-teal-light">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="font-serif text-sm font-semibold tracking-wide uppercase">
                    NyayaTrace-Assisted Workflow
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200 font-sans mt-3">
                  <span className="bg-midnight-900/90 px-3 py-1.5 rounded border border-teal/30 text-teal-light font-medium">
                    Organize documents
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal shrink-0" />
                  <span className="bg-midnight-900/90 px-3 py-1.5 rounded border border-teal/30 text-teal-light font-medium">
                    Generate source-linked synopsis
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal shrink-0" />
                  <span className="bg-midnight-900/90 px-3 py-1.5 rounded border border-teal/30 text-teal-light font-medium">
                    Review relevant passages
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal shrink-0" />
                  <span className="bg-midnight-900/90 px-3 py-1.5 rounded border border-gold/40 text-gold-light font-medium">
                    Prepare structured brief
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 mt-4 pt-3 border-t border-teal/20">
                Maintains immediate traceability to source records while the lawyer exercises full editorial control.
              </p>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  )
}
export default OurProcessSection
