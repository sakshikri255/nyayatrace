'use client'

import { motion } from 'framer-motion'
import { AlertCircle, Briefcase, CheckCircle, FileText } from 'lucide-react'

interface KPICardProps {
  label: string
  value: number | string
  icon: 'briefcase' | 'fileText' | 'alertCircle' | 'checkCircle'
  description?: string
  accent?: 'teal' | 'amber' | 'green' | 'default'
  delay?: number
}

const accentStyles: Record<NonNullable<KPICardProps['accent']>, { bg: string; text: string }> = {
  teal:    { bg: 'bg-teal-50',   text: 'text-teal-700' },
  amber:   { bg: 'bg-amber-50',  text: 'text-amber-700' },
  green:   { bg: 'bg-green-50',  text: 'text-green-700' },
  default: { bg: 'bg-gray-100',  text: 'text-gray-600' },
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
}: KPICardProps) {
  const { bg, text } = accentStyles[accent]
  const Icon = icons[icon]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08, duration: 0.3, ease: 'easeOut' }}
      className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-md ${bg} ${text}`}>
          <Icon size={18} strokeWidth={1.75} />
        </span>
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
        {description && (
          <p className="mt-1.5 text-xs text-gray-400">{description}</p>
        )}
      </div>
    </motion.div>
  )
}
