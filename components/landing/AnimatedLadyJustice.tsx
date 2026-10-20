'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * AnimatedLadyJustice
 *
 * Cinematic Lady Justice (Justitia) visual with a genuinely moving balance scale (taraju).
 * The statue image provides the regal neoclassical sculpture, columns, and warm lighting.
 * Her raised left hand holds the suspension ring, from which an intricately detailed,
 * layered SVG balance scale hangs.
 *
 * The scale beam tilts with a gentle, natural ease-in-out cycle (4s),
 * the left and right pans counterbalance vertically with staggered micro-inertia,
 * and the entire visual breathes with a subtle floating motion and ambient golden aura.
 *
 * Fully respects prefers-reduced-motion.
 */
export function AnimatedLadyJustice() {
  const shouldReduceMotion = useReducedMotion()
  const [isHovered, setIsHovered] = useState(false)

  // Timing: 4.2 second full cycle
  const cycleDuration = 2.2

  return (
    <div
      className="relative w-full max-w-[460px] mx-auto select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="img"
      aria-label="Statue of Lady Justice with delicately animated balance scales in antique bronze and champagne gold"
    >
      {/* ── Ambient Volumetric Glow Behind Statue ── */}
      <div
        className="absolute -inset-4 rounded-3xl opacity-60 blur-2xl pointer-events-none transition-opacity duration-700"
        style={{
          background: isHovered
            ? 'radial-gradient(ellipse 65% 55% at 65% 35%, rgba(229,195,120,0.22) 0%, rgba(13,148,136,0.12) 50%, transparent 80%)'
            : 'radial-gradient(ellipse 60% 50% at 65% 35%, rgba(197,168,128,0.14) 0%, rgba(13,148,136,0.06) 50%, transparent 80%)',
        }}
      />

      {/* ── Outer Framed Card Container with Floating Breathing Motion ── */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [-3, 3, -3],
              }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-b from-midnight-800/90 via-midnight-900/95 to-midnight-950 p-2 sm:p-2.5 shadow-2xl shadow-black/80 backdrop-blur-sm"
      >
        {/* Subtle Top Gold Accent Line */}
        <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-gold-light/60 to-transparent" />

        {/* ── Statue Image Container ── */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-midnight-950">
          <Image
            src="/images/lady-justice-statue.jpg"
            alt="Lady Justice holding the sword and the scales"
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 440px"
            priority
            className="object-cover object-center transform transition-transform duration-700 ease-out"
            style={{
              transform: isHovered ? 'scale(1.015)' : 'scale(1)',
            }}
          />

          {/* Cinematic Vignette Overlays for Seamless Atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 via-transparent to-midnight-950/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-midnight-950/30 via-transparent to-midnight-950/40 pointer-events-none" />

          {/* Restrained light sweep sheen */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-screen opacity-20"
            style={{
              background:
                'linear-gradient(115deg, transparent 20%, rgba(229,195,120,0.15) 45%, transparent 60%)',
            }}
          />

          {/* ══════════════════════════════════════════════════════════════════
              LAYERED GENUINELY ANIMATED BALANCE SCALES (TARAJU)
              SVG coordinate system matches the 896x1200 image 1:1.
              Ring in hand: x = 648, y = 205.
              Fulcrum pivot: x = 648, y = 275.
              Beam length: 256px (x: 520 to 776).
              Left pan center: x = 520, y = 445.
              Right pan center: x = 776, y = 445.
             ══════════════════════════════════════════════════════════════════ */}
          <svg
            viewBox="0 0 896 1200"
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              {/* Metallic Gold Gradients */}
              <linearGradient id="lj-brass-beam" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#A88B58" />
                <stop offset="25%" stopColor="#F5DFAB" />
                <stop offset="50%" stopColor="#C8A668" />
                <stop offset="75%" stopColor="#FFF2D1" />
                <stop offset="100%" stopColor="#9C7F4D" />
              </linearGradient>

              <linearGradient id="lj-fulcrum" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF0CE" />
                <stop offset="50%" stopColor="#C9A86A" />
                <stop offset="100%" stopColor="#6C532B" />
              </linearGradient>

              <radialGradient id="lj-pan-left" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#FFF2D6" />
                <stop offset="30%" stopColor="#DFC085" />
                <stop offset="70%" stopColor="#9E7F47" />
                <stop offset="100%" stopColor="#544120" />
              </radialGradient>

              <radialGradient id="lj-pan-right" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#FFF2D6" />
                <stop offset="30%" stopColor="#DFC085" />
                <stop offset="70%" stopColor="#9E7F47" />
                <stop offset="100%" stopColor="#544120" />
              </radialGradient>

              <radialGradient id="lj-glow-pan" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F5DFAB" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#A88B58" stopOpacity="0" />
              </radialGradient>

              {/* Shadow Filters for realistic depth */}
              <filter id="lj-scale-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.65" />
              </filter>
            </defs>

            {/* ── TOP VERTICAL HOOK & RING (Anchored to hand ring at 648, 205) ── */}
            <g filter="url(#lj-scale-shadow)">
              {/* Ring interlock */}
              <circle
                cx="648"
                cy="210"
                r="11"
                fill="none"
                stroke="url(#lj-fulcrum)"
                strokeWidth="3.2"
              />
              {/* Vertical rod from ring to pivot */}
              <line
                x1="648"
                y1="221"
                x2="648"
                y2="275"
                stroke="url(#lj-fulcrum)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Ornate decorative collar / bead on rod */}
              <circle cx="648" cy="246" r="4.5" fill="url(#lj-brass-beam)" />
              {/* Center Pivot Boss / Fulcrum Bearing */}
              <circle cx="648" cy="275" r="7.5" fill="url(#lj-fulcrum)" stroke="#423218" strokeWidth="1.5" />
              <circle cx="648" cy="275" r="3.2" fill="#FFE8B5" />
            </g>

            {/* ── ANIMATED SCALE BEAM ──
                Tilts around pivot (648, 275).
                Angles between -3.2° and +3.2°.
            ── */}
            <motion.g
              animate={
                shouldReduceMotion
                  ? { rotate: 0 }
                  : {
                      rotate: [-3.2, 3.2, -3.2],
                    }
              }
              transition={{
                duration: cycleDuration,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                transformOrigin: '648px 275px',
              }}
              filter="url(#lj-scale-shadow)"
            >
              {/* Central pointer needle pointing upward towards center */}
              <polygon
                points="648,252 645,274 651,274"
                fill="url(#lj-fulcrum)"
              />

              {/* Main horizontal beam body (ornate sculpted dual taper) */}
              <path
                d="M 520,275 
                   C 555,272 610,271 648,272 
                   C 686,271 741,272 776,275 
                   C 741,278 686,279 648,278 
                   C 610,279 555,278 520,275 Z"
                fill="url(#lj-brass-beam)"
                stroke="#544120"
                strokeWidth="1.2"
              />

              {/* Left End Loop / Eyelet */}
              <circle cx="520" cy="275" r="5" fill="none" stroke="url(#lj-brass-beam)" strokeWidth="2.5" />
              <circle cx="520" cy="275" r="2" fill="#FFE8B5" />

              {/* Right End Loop / Eyelet */}
              <circle cx="776" cy="275" r="5" fill="none" stroke="url(#lj-brass-beam)" strokeWidth="2.5" />
              <circle cx="776" cy="275" r="2" fill="#FFE8B5" />
            </motion.g>

            {/* ── LEFT SUSPENSION CHAINS & PAN ──
                Anchored to beam left tip (520, 275).
                Moves vertically: when beam tilts -3.2° (left down), y moves +7.2px.
                When beam tilts +3.2° (left up), y moves -7.2px.
                Staggered slightly for believable inertia.
            ── */}
            <motion.g
              animate={
                shouldReduceMotion
                  ? { y: 0 }
                  : {
                      y: [7.2, -7.2, 7.2],
                    }
              }
              transition={{
                duration: cycleDuration,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              filter="url(#lj-scale-shadow)"
            >
              {/* Ambient Glow under Left Pan */}
              <ellipse cx="520" cy="455" rx="55" ry="14" fill="url(#lj-glow-pan)" />

              {/* Three Hanging Chains (antique link pattern) */}
              {/* Outer Left Chain */}
              <line
                x1="520"
                y1="275"
                x2="484"
                y2="442"
                stroke="#C8A668"
                strokeWidth="1.6"
                strokeDasharray="2.5 2.5"
                strokeLinecap="round"
                opacity="0.9"
              />
              {/* Outer Right Chain */}
              <line
                x1="520"
                y1="275"
                x2="556"
                y2="442"
                stroke="#C8A668"
                strokeWidth="1.6"
                strokeDasharray="2.5 2.5"
                strokeLinecap="round"
                opacity="0.9"
              />
              {/* Center Rear Chain */}
              <line
                x1="520"
                y1="275"
                x2="520"
                y2="437"
                stroke="#9E7F47"
                strokeWidth="1.4"
                strokeDasharray="2.5 2.5"
                strokeLinecap="round"
                opacity="0.75"
              />

              {/* Secondary micro-sway on the hanging pan */}
              <motion.g
                animate={
                  shouldReduceMotion
                    ? { rotate: 0 }
                    : {
                        rotate: [-0.9, 0.9, -0.9],
                      }
                }
                transition={{
                  duration: cycleDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.18, // Staggered lag creates true physics
                }}
                style={{
                  transformOrigin: '520px 275px',
                }}
              >
                {/* Left Pan (Brass Bowl / Dish) */}
                {/* Bowl Body */}
                <path
                  d="M 478,442 
                     C 482,464 500,472 520,472 
                     C 540,472 558,464 562,442 Z"
                  fill="url(#lj-pan-left)"
                  stroke="#4A381A"
                  strokeWidth="1.5"
                />
                {/* Rim Ellipse */}
                <ellipse
                  cx="520"
                  cy="442"
                  rx="42"
                  ry="7.5"
                  fill="#785B28"
                  stroke="url(#lj-brass-beam)"
                  strokeWidth="1.8"
                />
                {/* Rim Highlight */}
                <ellipse
                  cx="520"
                  cy="441.5"
                  rx="39"
                  ry="5.5"
                  fill="url(#lj-pan-left)"
                />

                {/* Evidence Token / Weight resting in Left Pan */}
                <polygon
                  points="515,441 520,432 525,441"
                  fill="#FFF2D1"
                  stroke="#A88B58"
                  strokeWidth="0.8"
                />
              </motion.g>
            </motion.g>

            {/* ── RIGHT SUSPENSION CHAINS & PAN ──
                Anchored to beam right tip (776, 275).
                Moves vertically: anti-phase to left pan!
                When beam tilts -3.2° (right up), y moves -7.2px.
                When beam tilts +3.2° (right down), y moves +7.2px.
            ── */}
            <motion.g
              animate={
                shouldReduceMotion
                  ? { y: 0 }
                  : {
                      y: [-7.2, 7.2, -7.2],
                    }
              }
              transition={{
                duration: cycleDuration,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              filter="url(#lj-scale-shadow)"
            >
              {/* Ambient Glow under Right Pan */}
              <ellipse cx="776" cy="455" rx="55" ry="14" fill="url(#lj-glow-pan)" />

              {/* Three Hanging Chains */}
              {/* Outer Left Chain */}
              <line
                x1="776"
                y1="275"
                x2="740"
                y2="442"
                stroke="#C8A668"
                strokeWidth="1.6"
                strokeDasharray="2.5 2.5"
                strokeLinecap="round"
                opacity="0.9"
              />
              {/* Outer Right Chain */}
              <line
                x1="776"
                y1="275"
                x2="812"
                y2="442"
                stroke="#C8A668"
                strokeWidth="1.6"
                strokeDasharray="2.5 2.5"
                strokeLinecap="round"
                opacity="0.9"
              />
              {/* Center Rear Chain */}
              <line
                x1="776"
                y1="275"
                x2="776"
                y2="437"
                stroke="#9E7F47"
                strokeWidth="1.4"
                strokeDasharray="2.5 2.5"
                strokeLinecap="round"
                opacity="0.75"
              />

              {/* Secondary micro-sway on the hanging pan */}
              <motion.g
                animate={
                  shouldReduceMotion
                    ? { rotate: 0 }
                    : {
                        rotate: [0.9, -0.9, 0.9],
                      }
                }
                transition={{
                  duration: cycleDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.18,
                }}
                style={{
                  transformOrigin: '776px 275px',
                }}
              >
                {/* Right Pan (Brass Bowl / Dish) */}
                {/* Bowl Body */}
                <path
                  d="M 734,442 
                     C 738,464 756,472 776,472 
                     C 796,472 814,464 818,442 Z"
                  fill="url(#lj-pan-right)"
                  stroke="#4A381A"
                  strokeWidth="1.5"
                />
                {/* Rim Ellipse */}
                <ellipse
                  cx="776"
                  cy="442"
                  rx="42"
                  ry="7.5"
                  fill="#785B28"
                  stroke="url(#lj-brass-beam)"
                  strokeWidth="1.8"
                />
                {/* Rim Highlight */}
                <ellipse
                  cx="776"
                  cy="441.5"
                  rx="39"
                  ry="5.5"
                  fill="url(#lj-pan-right)"
                />

                {/* Counter-weight in Right Pan */}
                <rect
                  x="771"
                  y="435"
                  width="10"
                  height="7"
                  rx="1.5"
                  fill="#DFC085"
                  stroke="#6C532B"
                  strokeWidth="0.8"
                />
              </motion.g>
            </motion.g>
          </svg>

          {/* ── Status Badge Inset (Bottom Right Corner) ── */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg border border-white/10 bg-midnight-950/85 px-3 py-2 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-light opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
              </span>
              <span className="font-serif text-[11px] tracking-wider uppercase text-gold-champagne/90">
                Impartial Justice
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted/70">
              Active Equilibrium
            </span>
          </div>
        </div>

        {/* ── Elegant Pedestal Inscription Footer ── */}
        <div className="mt-2.5 px-3 py-1.5 flex items-center justify-between text-xs text-muted/80">
          <span className="font-serif tracking-widest text-[11px] text-gold/90 uppercase">
            Justitia Regnorum Fundamentum
          </span>
          <span className="text-[10px] text-teal-light/80 font-medium">
            Taraju Balance
          </span>
        </div>
      </motion.div>
    </div>
  )
}
export default AnimatedLadyJustice
