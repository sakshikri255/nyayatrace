import { redirect } from 'next/navigation'

export const runtime = 'nodejs'

interface CaseProgressDetailPageProps {
  params: Promise<{ caseId: string }>
}

export default async function CaseProgressDetailPage({ params }: CaseProgressDetailPageProps) {
  const { caseId } = await params
  redirect(`/cases/${caseId}?tab=hearings`)
}
