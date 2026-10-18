import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
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
      {/* Back navigation */}
      <Link
        href="/bail-briefs"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors mb-5"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        All Bail &amp; Parole Briefs
      </Link>

      <BailBriefView data={data} />
    </div>
  )
}
