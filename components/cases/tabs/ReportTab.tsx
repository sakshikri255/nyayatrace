'use client'

import { useState, useEffect } from 'react'
import { FileTextIcon } from 'lucide-react'
import { CaseBriefView, type CaseBriefData } from '@/components/reports/CaseBriefView'

interface ReportTabProps {
  caseId: number
}

export function ReportTab({ caseId }: ReportTabProps) {
  const [data, setData] = useState<CaseBriefData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/cases/${caseId}/brief`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d: CaseBriefData) => setData(d))
      .catch(() => setError('Failed to load report.'))
      .finally(() => setLoading(false))
  }, [caseId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-slate-400 animate-pulse">Loading report…</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <FileTextIcon className="w-8 h-8 text-slate-300" />
        <p className="text-sm text-slate-500">{error ?? 'Report unavailable.'}</p>
      </div>
    )
  }

  return <CaseBriefView data={data} />
}
