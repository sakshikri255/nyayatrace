'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Scale, Gavel, Users } from 'lucide-react'

/* ── Data ─────────────────────────────────────────────────────────── */

type ReferenceEntry = {
  name: string
  designation: string
  posting: string
}

type CourtGroup = {
  court: string
  entries: ReferenceEntry[]
}

type ReferenceCategory = {
  category: 'Judges' | 'Advocates'
  icon: React.ElementType
  groups: CourtGroup[]
}

const REFERENCES: ReferenceCategory[] = [
  {
    category: 'Judges',
    icon: Gavel,
    groups: [
      {
        court: 'Supreme Court of India',
        entries: [
          {
            name: "Hon'ble Mr. Justice Dipankar Datta",
            designation: 'Judge',
            posting: 'Supreme Court of India, New Delhi',
          },
          {
            name: "Hon'ble Mr. Justice P. K. Mishra",
            designation: 'Judge',
            posting: 'Supreme Court of India, New Delhi',
          },
        ],
      },
      {
        court: 'Patna High Court',
        entries: [
          {
            name: "Hon'ble Mr. Justice Mohit Kumar Shah",
            designation: 'Judge',
            posting: 'Patna High Court, Patna',
          },
        ],
      },
      {
        court: 'District Courts',
        entries: [
          {
            name: "Hon'ble Mr. Justice Satya Bhushan Arya",
            designation: 'Judicial Officer',
            posting: 'District Court, Banka',
          },
          {
            name: "Hon'ble Mr. Justice Satyavrat Verma",
            designation: 'Judicial Officer',
            posting: 'District Court, Bhagalpur',
          },
        ],
      },
    ],
  },
  {
    category: 'Advocates',
    icon: Scale,
    groups: [
      {
        court: 'Supreme Court of India',
        entries: [
          {
            name: 'Mr. Priyanshu Kumar Jha',
            designation: 'Advocate',
            posting: 'Supreme Court of India, New Delhi',
          },
          {
            name: 'Mr. Ashish Kumar',
            designation: 'Advocate',
            posting: 'Supreme Court of India, New Delhi',
          },
        ],
      },
      {
        court: 'Patna High Court',
        entries: [
          {
            name: 'Mr. Aman Raj',
            designation: 'Advocate',
            posting: 'Patna High Court, Patna',
          },
        ],
      },
      {
        court: 'Corporate Lawyer',
        entries: [
          {
            name: 'Mr. Kumar Vaibhav',
            designation: 'Corporate Lawyer',
            posting: 'Corporate Practice',
          },
        ],
      },
    ],
  },
]

/* ── Animated profile avatar ──────────────────────────────────────── */
function ProfileAvatar({ index }: { index: number }) {
  const ringDelay = (index * 0.18) % 2
  const bgId = `avatarBg-${index}`
  const figId = `avatarFig-${index}`
  return (
    <div className="relative shrink-0 w-12 h-12">
      {/* Outer pulsing ring */}
      <motion.span
        className="absolute inset-0 rounded-full border border-gold/40"
        animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, delay: ringDelay }}
      />
      {/* Inner pulsing ring */}
      <motion.span
        className="absolute inset-[3px] rounded-full border border-gold/25"
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, delay: ringDelay + 0.4 }}
      />

      {/* Avatar disc */}
      <div className="absolute inset-0 rounded-full border border-gold/30 overflow-hidden">
        {/* Silhouette SVG — head + shoulders */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          <rect width="48" height="48" rx="24" fill={`url(#${bgId})`} />
          {/* Head */}
          <circle cx="24" cy="18" r="8" fill={`url(#${figId})`} />
          {/* Shoulders */}
          <path d="M6 44 C6 32 42 32 42 44" fill={`url(#${figId})`} />
          <defs>
            <radialGradient id={bgId} cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0B0F17" />
            </radialGradient>
            <linearGradient id={figId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#C5A880" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#E5C378" stopOpacity="0.30" />
            </linearGradient>
          </defs>
        </svg>

        {/* Shimmer sweep on hover */}
        <span
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              'linear-gradient(120deg, transparent 30%, rgba(229,195,120,0.18) 50%, transparent 70%)',
          }}
        />
      </div>

      {/* Gold pulse dot */}
      <motion.span
        className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-gold border-2 border-midnight-900"
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, delay: ringDelay + 0.8 }}
      />
    </div>
  )
}

/* ── Reference card ───────────────────────────────────────────────── */
function ReferenceCard({
  entry,
  index,
  inView,
}: {
  entry: ReferenceEntry
  index: number
  inView: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, ease: 'easeOut', delay: index * 0.08 }}
      className="group flex items-start gap-4 rounded-xl border border-white/10 bg-midnight-850/60 px-5 py-4 hover:border-gold/30 hover:bg-midnight-850/90 transition-all duration-200"
    >
      <ProfileAvatar index={index} />

      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-semibold leading-snug text-slate-100 mb-0.5 break-words">
          {entry.name}
        </p>
        <p className="text-[11px] font-medium text-gold tracking-wide">
          {entry.designation}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
          {entry.posting}
        </p>
      </div>
    </motion.div>
  )
}

/* ── Court group ──────────────────────────────────────────────────── */
function CourtGroupBlock({
  group,
  baseDelay,
  inView,
}: {
  group: CourtGroup
  baseDelay: number
  inView: boolean
}) {
  return (
    <div className="space-y-3">
      {/* Court sub-heading */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.4, ease: 'easeOut', delay: baseDelay }}
        className="flex items-center gap-2"
      >
        <div className="h-px w-4 bg-teal/50 shrink-0" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-light">
          {group.court}
        </span>
      </motion.div>

      <div className="space-y-2.5 pl-0 sm:pl-1">
        {group.entries.map((entry, i) => (
          <ReferenceCard
            key={entry.name}
            entry={entry}
            index={baseDelay * 12 + i}
            inView={inView}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Main exported section ────────────────────────────────────────── */
export function ReferencesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section
      id="references"
      ref={ref}
      className="relative py-20 lg:py-28 overflow-hidden border-b border-white/5 bg-midnight-900"
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% 0%, rgba(197, 168, 128, 0.05) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 80% 100%, rgba(13, 148, 136, 0.04) 0%, transparent 60%)
          `,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gold" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold">
              PROFESSIONAL REFERENCES
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-semibold text-slate-100 tracking-tight leading-tight mb-4">
            References
          </h2>

          <p className="text-base text-slate-300/80 font-light">
            Esteemed judges and advocates who serve as professional references for NyayaSetu.
          </p>
        </div>

        {/* ── Two-column category grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {REFERENCES.map((category, catIdx) => {
            const CategoryIcon = category.icon
            return (
              <div key={category.category} className="space-y-8">
                {/* Category heading */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: catIdx * 0.12 }}
                  className="flex items-center gap-3 pb-3 border-b border-white/10"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/30 bg-gold/[0.07]">
                    <CategoryIcon className="w-4 h-4 text-gold" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 tracking-tight">
                    {category.category}
                  </h3>
                </motion.div>

                {/* Court groups */}
                <div className="space-y-7">
                  {category.groups.map((group, groupIdx) => (
                    <CourtGroupBlock
                      key={group.court}
                      group={group}
                      baseDelay={catIdx * 0.1 + groupIdx * 0.06}
                      inView={inView}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

export default ReferencesSection
