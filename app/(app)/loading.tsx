import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-full bg-offwhite px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Header Skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40 bg-slate-200/80 rounded-md" />
          <Skeleton className="h-4 w-56 bg-slate-200/60 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 bg-slate-200/80 rounded-md" />
        </div>
      </div>

      {/* Alert banner skeleton */}
      <Skeleton className="h-16 w-full bg-slate-200/50 rounded-xl border border-slate-200/60" />

      {/* KPI 4-Card Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 bg-slate-200/80 rounded" />
              <Skeleton className="h-8 w-8 rounded-full bg-slate-200/60" />
            </div>
            <Skeleton className="h-8 w-16 bg-slate-200/90 rounded" />
            <Skeleton className="h-3 w-32 bg-slate-200/50 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content / Table Skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-44 bg-slate-200/80 rounded" />
            <Skeleton className="h-3.5 w-64 bg-slate-200/50 rounded" />
          </div>
          <Skeleton className="h-8 w-24 bg-slate-200/70 rounded-md" />
        </div>

        {/* 5 simulated list rows */}
        <div className="space-y-3 pt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg bg-teal/10" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-48 bg-slate-200/80 rounded" />
                  <Skeleton className="h-3 w-32 bg-slate-200/50 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-20 rounded-full bg-slate-200/60" />
                <Skeleton className="h-6 w-16 rounded-full bg-slate-200/50" />
                <Skeleton className="h-4 w-24 bg-slate-200/40 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
