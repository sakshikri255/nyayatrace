import { getAllCases } from '@/lib/queries/cases'
import { CasesClient } from '@/components/cases/CasesClient'

export const dynamic = 'force-dynamic'

interface CasesPageProps {
  searchParams?: { new?: string }
}

export default function CasesPage({ searchParams }: CasesPageProps) {
  const initialCases = getAllCases()

  return (
    <div className="px-6 py-6 max-w-7xl mx-auto">
      <CasesClient
        initialCases={initialCases}
        initialDialogOpen={searchParams?.new === '1'}
      />
    </div>
  )
}
