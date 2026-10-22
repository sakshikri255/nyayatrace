import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, BriefcaseIcon, SearchIcon, FileTextIcon } from 'lucide-react'
import { getBailBriefData } from '@/lib/queries/cases'
import { BailBriefView } from '@/components/bail/BailBriefView'
export const dynamic = 'force-dynamic'

interface PageProps {
  params: { caseId: string }
}

export default function BailBriefDetailPage({ params }: PageProps) {
  const caseId = parseInt(params.caseId, 10)
  if (isNaN(caseId)) notFound()

  const data = getBailBriefData(caseId)
  if (!data) notFound()

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Back navigation + cross-feature shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <Link
          href="/bail-briefs"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          All Bail &amp; Parole Briefs
        </Link>
        <div className="no-print flex flex-wrap items-center gap-2">
          <Link
            href={`/cases/${caseId}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <BriefcaseIcon className="w-3.5 h-3.5" />
            Case Workspace
          </Link>
          <Link
            href={`/verification/${caseId}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <SearchIcon className="w-3.5 h-3.5" />
            Verification
          </Link>
          <Link
            href={`/reports/${caseId}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-teal/40 hover:bg-teal/5 hover:text-teal transition-colors"
          >
            <FileTextIcon className="w-3.5 h-3.5" />
            Report
          </Link>
        </div>
      </div>

      <BailBriefView data={data} />
    </div>
  )
}
