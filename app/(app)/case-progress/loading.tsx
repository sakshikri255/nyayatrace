import { Skeleton } from '@/components/ui/skeleton'

export default function CaseProgressLoading() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-72 bg-slate-200/80 rounded-md" />
        <Skeleton className="h-4 w-96 bg-slate-200/50 rounded-md" />
      </div>

      {/* Card grid — 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3"
          >
            {/* Badges */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24 rounded bg-slate-200/70" />
              <Skeleton className="h-5 w-16 rounded-full bg-slate-200/50" />
              <Skeleton className="h-5 w-14 rounded-full bg-slate-200/40" />
            </div>
            {/* Title */}
            <Skeleton className="h-4 w-full bg-slate-200/70 rounded" />
            {/* Stats */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-3.5 w-16 bg-slate-200/50 rounded" />
              <Skeleton className="h-3.5 w-28 bg-slate-200/40 rounded" />
            </div>
            {/* CTA */}
            <Skeleton className="h-4 w-24 bg-teal/10 rounded mt-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
