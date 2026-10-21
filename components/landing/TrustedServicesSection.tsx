'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import {
  FileText,
  Search,
  TrendingUp,
  Scale,
  ArrowRight,
} from 'lucide-react'

interface ServiceCardData {
  title: string
  description: string
  href: string
  actionText: string
  icon: React.ElementType
  badge: string
}

export function TrustedServicesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  const SERVICES: ServiceCardData[] = [
    {
      title: 'Case Brief & Synopsis',
      description:
        'Transform uploaded documents into a structured overview of key facts, positions, and procedural information.',
      href: '/reports',
      actionText: 'View Case Briefs',
      icon: FileText,
      badge: 'Core Module',
    },
    {
      title: 'Evidence & Inconsistency Review',
      description:
        'Compare relevant passages and inspect potential inconsistencies with links to available source pages.',
      href: '/verification',
      actionText: 'Verify Evidence',
      icon: Search,
      badge: 'Discrepancy Matrix',
    },
    {
      title: 'Chronology & Case Progress',
      description:
        'Organize documented events, dates, and procedural developments into an easy-to-follow timeline.',
      href: '/case-progress',
      actionText: 'Track Progress',
      icon: TrendingUp,
      badge: 'Milestone Tracking',
    },
    {
      title: 'Hearing Preparation',
      description:
        'Build an editable working brief using reviewed case information, evidence references, and key issues.',
      href: '/bail-briefs',
      actionText: 'Prepare Brief',
      icon: Scale,
      badge: 'Bail & Orders',
    },
  ]

  return (
    <section
      id="services"
      ref={ref}
      className="relative py-20 lg:py-28 overflow-hidden border-b border-white/5 bg-midnight-950"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 40% at 75% 30%, rgba(197, 168, 128, 0.06) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 25% 70%, rgba(13, 148, 136, 0.05) 0%, transparent 60%)
            `,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold">
              PRECISION CAPABILITIES
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-4xl font-semibold text-slate-100 tracking-tight leading-tight mb-4">
            Tools for Better Case Preparation
          </h2>

          <p className="text-base sm:text-lg text-slate-300/90 font-light">
            Specialized modules engineered to organize documents, verify facts, and prepare hearing-ready briefs.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((card, idx) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-midnight-900/80 p-6 shadow-xl hover:border-gold/40 hover:bg-midnight-850 transition-all duration-300"
              >
                {/* Subtle Hover Gradient Sheen */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div>
                  {/* Top Row: Icon + Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/25 bg-midnight-950 text-gold shadow-sm group-hover:scale-105 group-hover:border-gold transition-transform">
                      <Icon className="w-5 h-5 text-gold-light" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-teal-light bg-teal/10 px-2 py-0.5 rounded border border-teal/20">
                      {card.badge}
                    </span>
                  </div>

                  {/* Card Title */}
                  <h3 className="text-lg font-semibold text-slate-100 mb-2.5 group-hover:text-gold-champagne transition-colors">
                    {card.title}
                  </h3>

                  {/* Card Description */}
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-light mb-6">
                    {card.description}
                  </p>
                </div>

                {/* Direct Working Link Button */}
                <div className="pt-4 border-t border-white/5">
                  <Link
                    href={card.href}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-gold-light group-hover:text-gold transition-colors"
                  >
                    <span>{card.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
export default TrustedServicesSection
