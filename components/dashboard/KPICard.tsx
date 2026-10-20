'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, Briefcase, CheckCircle, FileText, ArrowRightIcon } from 'lucide-react'

interface KPICardProps {
  label: string
  value: number | string
  icon: 'briefcase' | 'fileText' | 'alertCircle' | 'checkCircle'
  description?: string
  accent?: 'teal' | 'amber' | 'green' | 'default'
  delay?: number
  href?: string
  theme?: 'light' | 'dark'
}

const lightAccentStyles: Record<NonNullable<KPICardProps['accent']>, { bg: string; text: string }> = {
  teal:    { bg: 'bg-teal-50',   text: 'text-teal-700' },
  amber:   { bg: 'bg-amber-50',  text: 'text-amber-700' },
  green:   { bg: 'bg-green-50',  text: 'text-green-700' },
  default: { bg: 'bg-gray-100',  text: 'text-gray-600' },
}

const darkAccentStyles: Record<NonNullable<KPICardProps['accent']>, { bg: string; text: string; border: string }> = {
  teal:    { bg: 'bg-teal/15',        text: 'text-teal-light',     border: 'border-teal/30' },
  amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-300',      border: 'border-amber-500/30' },
  green:   { bg: 'bg-emerald-500/15', text: 'text-emerald-300',    border: 'border-emerald-500/30' },
  default: { bg: 'bg-gold/15',        text: 'text-gold-champagne', border: 'border-gold/30' },
}

const icons = {
  briefcase: Briefcase,
  fileText: FileText,
  alertCircle: AlertCircle,
  checkCircle: CheckCircle,
}

export function KPICard({
  label,
  value,
  icon,
  description,
  accent = 'default',
  delay = 0,
  href,
  theme = 'light',
}: KPICardProps) {
  const Icon = icons[icon]
  const isDark = theme === 'dark'

  const iconClasses = isDark
    ? `${darkAccentStyles[accent].bg} ${darkAccentStyles[accent].text} ${darkAccentStyles[accent].border} border`
    : `${lightAccentStyles[accent].bg} ${lightAccentStyles[accent].text}`

  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className={isDark ? "text-xs font-medium text-slate-400" : "text-sm font-medium text-gray-500"}>
          {label}
        </span>
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${iconClasses}`}>
          <Icon size={18} strokeWidth={1.75} />
        </span>
      </div>
      <div>
        <p className={`text-3xl font-bold leading-none ${isDark ? "font-serif text-slate-100" : "text-gray-900"}`}>
          {value}
        </p>
        {description && (
          <p className={`mt-1.5 text-xs ${isDark ? "text-slate-400 font-light" : "text-gray-400"}`}>
            {description}
          </p>
        )}
      </div>
      {href && (
        <div className={`flex items-center gap-1 text-[11px] font-medium mt-auto ${isDark ? "text-gold-light hover:text-gold" : "text-teal-600"}`}>
          View details
          <ArrowRightIcon className="w-3 h-3" />
        </div>
      )}
    </>
  )

  const cardClasses = isDark
    ? "rounded-2xl border border-white/10 bg-midnight-950/80 shadow-lg p-5 flex flex-col gap-3 hover:border-gold/40 hover:bg-midnight-900/90 transition-all duration-200"
    : "bg-white border border-gray-200 shadow-sm rounded-lg p-5 flex flex-col gap-3 hover:border-teal/40 hover:shadow-md transition-all"

  if (href) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay * 0.08, duration: 0.3, ease: 'easeOut' }}
      >
        <Link href={href} className={`${cardClasses} block`}>
          {inner}
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08, duration: 0.3, ease: 'easeOut' }}
      className={cardClasses}
    >
      {inner}
    </motion.div>
  )
}
export default KPICard
