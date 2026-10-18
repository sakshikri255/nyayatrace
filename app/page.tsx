'use client'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { NyayaTraceLogo } from '@/components/logo/NyayaTraceLogo'
import { ShieldCheck, FileSearch, TrendingUp } from 'lucide-react'

/* ── Feature data ─────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: FileSearch,
    title: 'Fact & Evidence Verification',
    description:
      'Cross-reference witness statements, FIR documents, and forensic reports to surface inconsistencies automatically. Every discrepancy is logged with a full audit trail.',
  },
  {
    icon: ShieldCheck,
    title: 'Bail & Parole Case Briefs',
    description:
      'Generate structured case briefs for bail hearings and parole applications, drawing on hearing transcripts, judicial orders, and compliance records.',
  },
  {
    icon: TrendingUp,
    title: 'Case Progress & Transparency',
    description:
      'Track case milestones across hearings, appeals, and orders. Visualise timelines and share transparent progress summaries with stakeholders.',
  },
]

/* ── Animated feature card ────────────────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: React.ElementType
  title: string
  description: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.1 }}
      className="flex flex-col gap-4 rounded-xl border border-teal/20 bg-charcoal p-7 hover:border-teal/50 transition-colors"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10 border border-teal/20">
        <Icon size={20} className="text-teal-light" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-offwhite mb-1.5">{title}</h3>
        <p className="text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </motion.div>
  )
}

/* ── Features section with scroll-triggered animation ─────────── */
function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="features"
      ref={ref}
      className="bg-navy py-24 px-6"
    >
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3 }}
            className="text-xs font-semibold tracking-widest uppercase text-teal-light mb-3"
          >
            Capabilities
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
            className="text-3xl font-bold text-offwhite"
          >
            Built for the courtroom. Designed for clarity.
          </motion.h2>
        </div>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="grid md:grid-cols-3 gap-6"
        >
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ── Landing page ─────────────────────────────────────────────── */
export default function LandingPage() {
  redirect('/login')

  return (
    <div className="min-h-screen bg-navy text-offwhite">
      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24">
        {/* CSS gradient background */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% -10%, #0d3d38 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 80% 80%, #0f2a4a 0%, transparent 50%),
              linear-gradient(160deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)
            `,
          }}
        />

        {/* Animated radial pulse — very subtle */}
        <div
          className="absolute inset-0 -z-10 animate-hero-pulse opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 50% 40% at 50% 50%, #0D9488 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-8"
          >
            <NyayaTraceLogo size="lg" variant="light" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold tracking-tight text-offwhite leading-tight mb-5"
          >
            AI-Assisted Case Preparation
            <br />
            <span className="text-teal-light">&amp; Evidence Traceability</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.18 }}
            className="text-base sm:text-lg text-muted leading-relaxed max-w-xl mb-10"
          >
            NyayaTrace helps legal professionals verify facts, surface
            inconsistencies, and build transparent case narratives from raw
            court documents — faster and with a full audit trail.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.26 }}
            className="flex flex-col sm:flex-row gap-4 mb-8"
          >
            <Link
              href="/cases?new=1"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal/20 hover:bg-teal-light transition-colors"
            >
              Open Case Workspace →
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-dark bg-charcoal/60 px-6 py-3 text-sm font-semibold text-offwhite hover:bg-charcoal hover:border-teal/40 transition-colors"
            >
              Learn More ↓
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-[11px] font-medium tracking-widest uppercase text-muted/70"
          >
            Local case workspace · Source-linked document analysis
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="absolute bottom-8 flex flex-col items-center gap-1"
        >
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-teal/40" />
        </motion.div>
      </section>

      {/* ═══════════════════════ PRIVACY NOTICE ═══════════════════════ */}
      <div className="w-full bg-amber-900/30 border-y border-amber-700/30 py-4 px-6 text-center">
        <p className="text-sm text-amber-300">
          <span className="font-semibold">Use only public records or records you are authorized to process.</span>{' '}
          This local application has no login or access control. Do not upload confidential files.
        </p>
      </div>

      {/* ═════════════════════════ FEATURES ═════════════════════════ */}
      <FeaturesSection />

      {/* ═════════════════════════ FOOTER ═══════════════════════════ */}
      <footer className="bg-charcoal border-t border-border-dark py-12 px-6">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex flex-col gap-3">
            <NyayaTraceLogo size="sm" variant="light" />
            <p className="text-xs text-muted max-w-xs leading-relaxed">
              A local workspace for organizing uploaded case records and reviewing source-linked text extraction.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 text-xs text-muted">
            <p className="font-semibold text-muted/80 uppercase tracking-wider mb-1">Stack</p>
            <span>Next.js 14 · TypeScript · Tailwind CSS</span>
            <span>Framer Motion · shadcn/ui · Drizzle ORM</span>
            <span>SQLite · Lucide Icons · Recharts</span>
          </div>
        </div>

        <div className="mx-auto max-w-5xl mt-10 pt-6 border-t border-border-dark text-center text-xs text-muted/50">
          © {new Date().getFullYear()} NyayaTrace.
        </div>
      </footer>
    </div>
  )
}
