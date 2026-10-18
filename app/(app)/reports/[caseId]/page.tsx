import { notFound } from 'next/navigation'
import { CaseBriefView, type CaseBriefData } from '@/components/reports/CaseBriefView'

export const dynamic = 'force-dynamic'

interface Props {
  params: { caseId: string }
}

export default async function ReportDetailPage({ params }: Props) {
  const caseId = parseInt(params.caseId, 10)
  if (isNaN(caseId)) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/cases/${caseId}/brief`, { cache: 'no-store' })

  if (res.status === 404) notFound()
  if (!res.ok) {
    throw new Error(`Failed to load brief: ${res.status}`)
  }

  const data: CaseBriefData = await res.json()

  return <CaseBriefView data={data} />
}
