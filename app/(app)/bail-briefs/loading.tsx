import { Skeleton } from '@/components/ui/skeleton'

export default function BailBriefsLoading() {
  return (
    <div className="px-6 py-6 max-w-7xl mx-auto flex flex-col gap-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-64 bg-slate-200/80 rounded-md" />
        <Skeleton className="h-4 w-80 bg-slate-200/50 rounded-md" />
      </div>

      {/* Disclaimer skeleton */}
      <Skeleton className="h-14 w-full bg-amber-100/60 rounded-lg border border-amber-200/60" />

      {/* Card grid — 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28 bg-slate-200/80 rounded" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-14 rounded-full bg-teal/10" />
                <Skeleton className="h-5 w-14 rounded-full bg-slate-200/60" />
              </div>
            </div>
            <Skeleton className="h-4 w-full bg-slate-200/70 rounded" />
            <Skeleton className="h-3.5 w-24 bg-slate-200/40 rounded" />
            <Skeleton className="h-16 w-full bg-slate-100/80 rounded-lg" />
            <Skeleton className="h-9 w-full bg-teal/10 rounded-md mt-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
