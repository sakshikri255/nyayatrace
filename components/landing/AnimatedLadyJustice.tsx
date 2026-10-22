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

  // Timing: 2.8s natural pendulum cycle with authentic bronze inertia
  const cycleDuration = 2.8

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
            ? 'radial-gradient(ellipse 65% 55% at 65% 35%, rgba(229,195,120,0.28) 0%, rgba(13,148,136,0.16) 50%, transparent 80%)'
            : 'radial-gradient(ellipse 60% 50% at 65% 35%, rgba(197,168,128,0.16) 0%, rgba(13,148,136,0.08) 50%, transparent 80%)',
        }}
      />

      {/* ── Outer Framed Card Container with Floating Breathing Motion ── */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [-4, 4, -4],
              }
        }
        transition={{
          duration: 4.8,
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
              transform: isHovered ? 'scale(1.02)' : 'scale(1)',
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
              Beam length: 256px (x: 520 to 776, radius 128px).
              Left pan center: x = 520, y = 445.
              Right pan center: x = 776, y = 445.
              Swing height: ±25px elevation (50px full range, ±11.2° tilt).
              3D Depth: dynamic perspective scaling (0.92x to 1.08x),
              depth shadow elongation, and staggered pendulum inertia.
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

              <radialGradient id="lj-pan-left" cx="50%" cy="38%" r="58%">
                <stop offset="0%" stopColor="#FFF5DC" />
                <stop offset="25%" stopColor="#E5C582" />
                <stop offset="65%" stopColor="#9E7F47" />
                <stop offset="100%" stopColor="#4A381A" />
              </radialGradient>

              <radialGradient id="lj-pan-right" cx="50%" cy="38%" r="58%">
                <stop offset="0%" stopColor="#FFF5DC" />
                <stop offset="25%" stopColor="#E5C582" />
                <stop offset="65%" stopColor="#9E7F47" />
                <stop offset="100%" stopColor="#4A381A" />
              </radialGradient>

              <radialGradient id="lj-glow-pan" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F5DFAB" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#A88B58" stopOpacity="0" />
              </radialGradient>

              {/* Shadow Filters for realistic 3D depth */}
              <filter id="lj-scale-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="4" dy="8" stdDeviation="5" floodColor="#000000" floodOpacity="0.7" />
              </filter>
              <filter id="lj-pan-depth-shadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="5" dy="12" stdDeviation="7" floodColor="#000000" floodOpacity="0.8" />
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

              {/* Graduated Index Arc / Gauge showing swing angle behind pointer */}
              <path
                d="M 630,248 A 28 28 0 0 1 666,248"
                fill="none"
                stroke="#C8A668"
                strokeWidth="1.2"
                strokeDasharray="2 3"
                opacity="0.85"
              />
              {/* Zero center calibration pip */}
              <line x1="648" y1="244" x2="648" y2="249" stroke="#FFF0CE" strokeWidth="1.8" />
              {/* Limit pips */}
              <line x1="632" y1="247" x2="634" y2="251" stroke="#A88B58" strokeWidth="1.2" />
              <line x1="664" y1="247" x2="662" y2="251" stroke="#A88B58" strokeWidth="1.2" />

              {/* Center Pivot Boss / Fulcrum Bearing */}
              <circle cx="648" cy="275" r="8" fill="url(#lj-fulcrum)" stroke="#423218" strokeWidth="1.5" />
              <circle cx="648" cy="275" r="3.4" fill="#FFE8B5" />
            </g>

            {/* ── ANIMATED SCALE BEAM ──
                Tilts around pivot (648, 275).
                Angles between -11.2° and +11.2° for deep, majestic swing.
            ── */}
            <motion.g
              animate={
                shouldReduceMotion
                  ? { rotate: 0 }
                  : {
                      rotate: [-11.2, 11.2, -11.2],
                    }
              }
              transition={{
                duration: cycleDuration,
                repeat: Infinity,
                ease: [0.45, 0.05, 0.55, 0.95],
              }}
              style={{
                transformOrigin: '648px 275px',
              }}
              filter="url(#lj-scale-shadow)"
            >
              {/* Central pointer needle pointing upward towards index gauge */}
              <polygon
                points="648,245 644,274 652,274"
                fill="url(#lj-fulcrum)"
                stroke="#544120"
                strokeWidth="0.8"
              />

              {/* Main horizontal beam body (ornate sculpted dual taper) */}
              <path
                d="M 520,275 
                   C 555,271 610,270 648,271 
                   C 686,270 741,271 776,275 
                   C 741,279 686,280 648,279 
                   C 610,280 555,279 520,275 Z"
                fill="url(#lj-brass-beam)"
                stroke="#544120"
                strokeWidth="1.4"
              />

              {/* Left End Loop / Eyelet */}
              <circle cx="520" cy="275" r="5.5" fill="none" stroke="url(#lj-brass-beam)" strokeWidth="2.6" />
              <circle cx="520" cy="275" r="2.2" fill="#FFE8B5" />

              {/* Right End Loop / Eyelet */}
              <circle cx="776" cy="275" r="5.5" fill="none" stroke="url(#lj-brass-beam)" strokeWidth="2.6" />
              <circle cx="776" cy="275" r="2.2" fill="#FFE8B5" />
            </motion.g>

            {/* ── LEFT SUSPENSION CHAINS & PAN ──
                Anchored to beam left tip (520, 275).
                Moves vertically ±25px: when beam tilts -11.2° (left down), y moves +25px.
                When beam tilts +11.2° (left up), y moves -25px.
                Perspective depth scaling: 1.08x at lowest/closest, 0.92x at highest/farthest.
            ── */}
            <motion.g
              animate={
                shouldReduceMotion
                  ? { y: 0, x: 0, scale: 1 }
                  : {
                      y: [25, -25, 25],
                      x: [3.5, -2.5, 3.5],
                      scale: [1.08, 0.92, 1.08],
                    }
              }
              transition={{
                duration: cycleDuration,
                repeat: Infinity,
                ease: [0.45, 0.05, 0.55, 0.95],
              }}
              style={{
                transformOrigin: '520px 275px',
              }}
              filter="url(#lj-pan-depth-shadow)"
            >
              {/* Dynamic Depth Glow under Left Pan */}
              <motion.ellipse
                cx="520"
                cy="455"
                rx="55"
                ry="14"
                fill="url(#lj-glow-pan)"
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        opacity: [0.95, 0.25, 0.95],
                        scale: [1.18, 0.82, 1.18],
                      }
                }
                transition={{
                  duration: cycleDuration,
                  repeat: Infinity,
                  ease: [0.45, 0.05, 0.55, 0.95],
                }}
                style={{
                  transformOrigin: '520px 455px',
                }}
              />

              {/* Three Hanging Chains (antique link pattern) */}
              {/* Outer Left Chain */}
              <line
                x1="520"
                y1="275"
                x2="484"
                y2="442"
                stroke="#C8A668"
                strokeWidth="1.7"
                strokeDasharray="2.5 2.5"
                strokeLinecap="round"
                opacity="0.92"
              />
              {/* Outer Right Chain */}
              <line
                x1="520"
                y1="275"
                x2="556"
                y2="442"
                stroke="#C8A668"
                strokeWidth="1.7"
                strokeDasharray="2.5 2.5"
                strokeLinecap="round"
                opacity="0.92"
              />
              {/* Center Rear Chain */}
              <line
                x1="520"
                y1="275"
                x2="520"
                y2="437"
                stroke="#9E7F47"
                strokeWidth="1.5"
                strokeDasharray="2.5 2.5"
                strokeLinecap="round"
                opacity="0.78"
              />

              {/* Secondary pendulum inertia sway on the hanging pan */}
              <motion.g
                animate={
                  shouldReduceMotion
                    ? { rotate: 0 }
                    : {
                        rotate: [-5.2, 5.2, -5.2],
                      }
                }
                transition={{
                  duration: cycleDuration,
                  repeat: Infinity,
                  ease: [0.45, 0.05, 0.55, 0.95],
                  delay: 0.16, // Staggered lag creates true physics inertia
                }}
                style={{
                  transformOrigin: '520px 275px',
                }}
              >
                {/* Left Pan (Brass Bowl / Dish) */}
                {/* Bowl Body */}
                <path
                  d="M 478,442 
                     C 482,465 500,473 520,473 
                     C 540,473 558,465 562,442 Z"
                  fill="url(#lj-pan-left)"
                  stroke="#4A381A"
                  strokeWidth="1.6"
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
                Moves vertically: counter-phase to left pan (±25px)!
                Perspective depth scaling: 0.92x when high/distant, 1.08x when low/close.
            ── */}
            <motion.g
              animate={
                shouldReduceMotion
                  ? { y: 0, x: 0, scale: 1 }
                  : {
                      y: [-25, 25, -25],
                      x: [-3.5, 2.5, -3.5],
                      scale: [0.92, 1.08, 0.92],
                    }
              }
              transition={{
                duration: cycleDuration,
                repeat: Infinity,
                ease: [0.45, 0.05, 0.55, 0.95],
              }}
              style={{
                transformOrigin: '776px 275px',
              }}
              filter="url(#lj-pan-depth-shadow)"
            >
              {/* Dynamic Depth Glow under Right Pan */}
              <motion.ellipse
                cx="776"
                cy="455"
                rx="55"
                ry="14"
                fill="url(#lj-glow-pan)"
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        opacity: [0.25, 0.95, 0.25],
                        scale: [0.82, 1.18, 0.82],
                      }
                }
                transition={{
                  duration: cycleDuration,
                  repeat: Infinity,
                  ease: [0.45, 0.05, 0.55, 0.95],
                }}
                style={{
                  transformOrigin: '776px 455px',
                }}
              />

              {/* Three Hanging Chains */}
              {/* Outer Left Chain */}
              <line
                x1="776"
                y1="275"
                x2="740"
                y2="442"
                stroke="#C8A668"
                strokeWidth="1.7"
                strokeDasharray="2.5 2.5"
                strokeLinecap="round"
                opacity="0.92"
              />
              {/* Outer Right Chain */}
              <line
                x1="776"
                y1="275"
                x2="812"
                y2="442"
                stroke="#C8A668"
                strokeWidth="1.7"
                strokeDasharray="2.5 2.5"
                strokeLinecap="round"
                opacity="0.92"
              />
              {/* Center Rear Chain */}
              <line
                x1="776"
                y1="275"
                x2="776"
                y2="437"
                stroke="#9E7F47"
                strokeWidth="1.5"
                strokeDasharray="2.5 2.5"
                strokeLinecap="round"
                opacity="0.78"
              />

              {/* Secondary pendulum inertia sway on the hanging pan */}
              <motion.g
                animate={
                  shouldReduceMotion
                    ? { rotate: 0 }
                    : {
                        rotate: [5.2, -5.2, 5.2],
                      }
                }
                transition={{
                  duration: cycleDuration,
                  repeat: Infinity,
                  ease: [0.45, 0.05, 0.55, 0.95],
                  delay: 0.16,
                }}
                style={{
                  transformOrigin: '776px 275px',
                }}
              >
                {/* Right Pan (Brass Bowl / Dish) */}
                {/* Bowl Body */}
                <path
                  d="M 734,442 
                     C 738,465 756,473 776,473 
                     C 796,473 814,465 818,442 Z"
                  fill="url(#lj-pan-right)"
                  stroke="#4A381A"
                  strokeWidth="1.6"
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
              <span className="text-[11px] font-semibold tracking-wider uppercase text-gold-champagne/90">
                Compassionate Advocacy
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted/70">
              Transparent Solution
            </span>
          </div>
        </div>

        {/* ── Elegant Pedestal Inscription Footer ── */}
        <div className="mt-2.5 px-3 py-1.5 flex items-center justify-between text-xs text-muted/80">
          <span className="tracking-widest text-[11px] font-semibold text-gold/90 uppercase">
            Safeguarding Your Rights & Liberties
          </span>
          <span className="text-[10px] text-teal-light/80 font-medium">
            Empowred Communities
          </span>
        </div>
      </motion.div>
    </div>
  )
}
export default AnimatedLadyJustice
