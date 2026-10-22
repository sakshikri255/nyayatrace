import React from 'react'

interface NyayaTraceLogoProps {
  size?: 'sm' | 'lg'
  /** 'light' = white wordmark (dark bg), 'dark' = navy wordmark, 'auth' = warm ivory/gold (auth pages), 'gold' = black/gold/white theme */
  variant?: 'light' | 'dark' | 'auth' | 'gold'
  className?: string
}

export function NyayaTraceLogo({
  size = 'lg',
  variant = 'gold',
  className = '',
}: NyayaTraceLogoProps) {
  const isSmall = size === 'sm'
  const iconSize = isSmall ? 24 : 40
  const fontSize = isSmall ? 14 : 22

  // "Nyaya" base color
  const wordmarkColor =
    variant === 'auth'  ? '#2C1F0E' :
    variant === 'dark'  ? '#0F172A' :
    '#FFFFFF'

  // Icon structural color (pillar, beam, base, pivot)
  const teal =
    variant === 'auth' ? '#7A6240' :
    variant === 'dark' ? '#0F172A' :
    '#C5A880' // Rich warm gold

  // Icon accent color (chains, pans)
  const tealLight =
    variant === 'auth' ? '#C5A880' :
    variant === 'dark' ? '#334155' :
    '#E5C378' // Radiant light gold

  // "Trace" accent word
  const accentColor =
    variant === 'auth' ? '#C5A880' :
    variant === 'dark' ? '#C5A880' :
    '#E5C378' // Light gold

  return (
    <div
      className={`flex items-center gap-2 select-none ${className}`}
      aria-label="NyayaTrace"
    >
      {/* ── Scales of Justice Icon ── */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Central pillar */}
        <rect x="19" y="8" width="2" height="24" rx="1" fill={teal} />

        {/* Base */}
        <rect x="12" y="30" width="16" height="2.5" rx="1.25" fill={teal} />

        {/* Horizontal beam */}
        <rect x="6" y="11.5" width="28" height="2" rx="1" fill={teal} />

        {/* Left chain */}
        <line x1="9" y1="13.5" x2="9" y2="20" stroke={tealLight} strokeWidth="1.5" strokeLinecap="round" />

        {/* Right chain */}
        <line x1="31" y1="13.5" x2="31" y2="20" stroke={tealLight} strokeWidth="1.5" strokeLinecap="round" />

        {/* Left pan (arc / bowl shape) */}
        <path
          d="M5 20 Q9 26 13 20"
          stroke={tealLight}
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right pan (arc / bowl shape — slightly lower to show imbalance) */}
        <path
          d="M27 22 Q31 28 35 22"
          stroke={tealLight}
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Top pivot dot */}
        <circle cx="20" cy="9" r="2" fill={teal} />
      </svg>

      {/* ── Wordmark ── */}
      {!isSmall && (
        <span
          style={{
            fontSize,
            fontWeight: 700,
            color: wordmarkColor,
            letterSpacing: '-0.01em',
            fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif',
            lineHeight: 1,
          }}
        >
          Nyaya
          <span style={{ color: accentColor }}>Trace</span>
        </span>
      )}
    </div>
  )
}

export default NyayaTraceLogo
