import { Skeleton } from '@/components/ui/skeleton'

export default function ReportsLoading() {
  return (
    <div className="min-h-full bg-offwhite animate-in fade-in duration-200">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-28 bg-slate-200/80 rounded-md" />
          <Skeleton className="h-4 w-96 bg-slate-200/50 rounded-md" />
        </div>

        {/* Card grid — 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col gap-3"
            >
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-3.5 w-32 bg-slate-200/70 rounded" />
                <Skeleton className="h-5 w-16 rounded-full bg-teal/10" />
                <Skeleton className="h-5 w-16 rounded-full bg-slate-200/60" />
              </div>

              {/* Title */}
              <Skeleton className="h-4 w-full bg-slate-200/70 rounded" />

              {/* Meta */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-3.5 w-24 bg-slate-200/50 rounded" />
                <Skeleton className="h-3.5 w-20 bg-slate-200/40 rounded" />
              </div>

              {/* CTA */}
              <Skeleton className="h-9 w-36 bg-teal/10 rounded-md mt-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
