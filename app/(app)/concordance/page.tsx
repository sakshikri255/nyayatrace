import { ConcordanceMatrix } from '@/components/legal/ConcordanceMatrix'
import { BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Dual Law Concordance — NyayaTrace',
  description: 'IPC ↔ BNS and CrPC ↔ BNSS section concordance matrix',
}

export default function ConcordancePage() {
  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
      {/* Page header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal/20 bg-teal/10 text-teal shrink-0">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--section-heading)]">Dual Law Concordance Matrix</h1>
          <p className="text-sm text-[var(--section-subheading)] mt-0.5">
            IPC ↔ BNS &amp; CrPC ↔ BNSS section converter — search by section number, offense name, or keyword
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-rose-700 font-medium dark:bg-rose-950/30 dark:border-rose-800/40 dark:text-rose-400">
          <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
          Non-Bailable offense
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-emerald-700 font-medium dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
          Bailable offense
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-blue-700 font-medium dark:bg-blue-950/30 dark:border-blue-800/40 dark:text-blue-400">
          <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
          Procedural section
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-violet-700 font-medium dark:bg-violet-950/30 dark:border-violet-800/40 dark:text-violet-400">
          <span className="h-2 w-2 rounded-full bg-violet-500 inline-block" />
          Compoundable
        </span>
      </div>

      {/* Matrix */}
      <ConcordanceMatrix />
    </div>
  )
}
