import { CauseListBoard } from '@/components/causelist/CauseListBoard'
import { CalendarDays } from 'lucide-react'

export const metadata = {
  title: 'Court Diary / Cause List — NyayaTrace',
  description: 'Weekly board view of all hearings across cases',
}

export default function CauseListPage() {
  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal/20 bg-teal/10 text-teal shrink-0">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--section-heading)]">Court Diary / Roznamcha</h1>
          <p className="text-sm text-[var(--section-subheading)] mt-0.5">
            Weekly board view of all scheduled hearings across all cases
          </p>
        </div>
      </div>

      {/* Board */}
      <CauseListBoard />
    </div>
  )
}
