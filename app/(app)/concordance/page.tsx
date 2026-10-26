import { ConcordanceMatrix } from '@/components/legal/ConcordanceMatrix'
import { BookOpen, Scale, ArrowRightLeft } from 'lucide-react'

export const metadata = {
  title: 'Dual Law Concordance — NyayaSetu',
  description: 'IPC ↔ BNS and CrPC ↔ BNSS section concordance matrix',
}

interface Props {
  searchParams?: { section?: string; law?: string; q?: string }
}

export default function ConcordancePage({ searchParams }: Props) {
  // Build an initial query from URL params: ?section=302&law=IPC → "302"
  const initialQuery = searchParams?.section ?? searchParams?.q ?? ''

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
      {/* ── Page Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--section-card-border)] bg-gradient-to-br from-[var(--section-card-bg)] via-[var(--card)] to-[var(--section-card-bg)] p-5 sm:p-6 shadow-sm">
        {/* Subtle decorative background ambient glow */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-gold/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-teal/30 bg-teal/10 text-teal shrink-0 shadow-xs ring-2 ring-teal/10">
              <BookOpen className="h-6 w-6 stroke-[2]" />
              <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal text-[9px] text-white font-bold">
                <ArrowRightLeft className="h-2.5 w-2.5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--section-heading)]">
                  Dual Law Concordance Matrix
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal/10 text-teal border border-teal/25">
                  <Scale className="h-3 w-3" />
                  2024 Legal Transition
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--section-subheading)] mt-1 max-w-3xl leading-relaxed">
                IPC ↔ BNS &amp; CrPC ↔ BNSS section converter — search by section number, offense name, or keyword
              </p>
            </div>
          </div>
        </div>

        {/* ── Legend Reference Bar ── */}
        <div className="relative z-10 mt-5 pt-4 border-t border-[var(--section-card-border)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="text-[11px] uppercase tracking-wider text-[var(--section-subheading)] font-semibold mr-1 hidden sm:inline">
              Legend:
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/80 bg-rose-50/80 px-3 py-1 text-rose-700 font-medium dark:bg-rose-950/40 dark:border-rose-800/50 dark:text-rose-300 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-rose-500 inline-block shadow-xs" />
              Non-Bailable offense
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/80 bg-emerald-50/80 px-3 py-1 text-emerald-700 font-medium dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-300 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block shadow-xs" />
              Bailable offense
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-300/80 bg-blue-50/80 px-3 py-1 text-blue-700 font-medium dark:bg-blue-950/40 dark:border-blue-800/50 dark:text-blue-300 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block shadow-xs" />
              Procedural section
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/80 bg-violet-50/80 px-3 py-1 text-violet-700 font-medium dark:bg-violet-950/40 dark:border-violet-800/50 dark:text-violet-300 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-violet-500 inline-block shadow-xs" />
              Compoundable
            </span>
          </div>
        </div>
      </div>

      {/* ── Concordance Matrix Component ── */}
      <ConcordanceMatrix initialQuery={initialQuery} />
    </div>
  )
}
