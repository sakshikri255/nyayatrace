import { Skeleton } from '@/components/ui/skeleton'

export default function VerificationLoading() {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-200">
      <div className="max-w-6xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {/* Heading */}
        <div className="flex items-start gap-4">
          <Skeleton className="w-10 h-10 rounded-lg bg-teal/10 shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-72 bg-slate-200/80 rounded-md" />
            <Skeleton className="h-4 w-96 bg-slate-200/50 rounded-md" />
          </div>
        </div>

        {/* Card grid — 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-28 bg-teal/10 rounded" />
                  <Skeleton className="h-4 w-full bg-slate-200/70 rounded" />
                  <Skeleton className="h-3.5 w-3/4 bg-slate-200/50 rounded" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full bg-slate-200/60 shrink-0" />
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="flex flex-col items-center gap-1">
                    <Skeleton className="h-7 w-8 bg-slate-200/80 rounded" />
                    <Skeleton className="h-3 w-12 bg-slate-200/40 rounded" />
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Skeleton className="h-10 w-full bg-teal/8 rounded-lg border border-teal/15 mt-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
