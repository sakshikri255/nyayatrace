import { getAllCases } from '@/lib/queries/cases'
import { CasesClient } from '@/components/cases/CasesClient'

export const dynamic = 'force-dynamic'

interface CasesPageProps {
  searchParams?: { new?: string }
}

export default function CasesPage({ searchParams }: CasesPageProps) {
  const initialCases = getAllCases()

  return (
    <div className="min-h-full bg-[#F8FAFC] p-6 sm:p-8 space-y-6">
      <CasesClient
        initialCases={initialCases}
        initialDialogOpen={searchParams?.new === '1'}
      />
    </div>
  )
}
