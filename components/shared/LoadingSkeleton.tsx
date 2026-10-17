import { Skeleton } from '@/components/ui/skeleton'

export function KPICardSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
          <div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32 mt-1.5" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5">
      <Skeleton className="h-4 w-28 mb-1" />
      <Skeleton className="h-3 w-36 mb-4" />
      <Skeleton className="h-[220px] w-full rounded-md" />
    </div>
  )
}

export function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <Skeleton className="h-4 w-28 mb-1" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-5 py-3 flex items-center gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function VerificationSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header skeleton */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4">
        <Skeleton className="h-4 w-12" />
        <div className="w-px h-5 bg-slate-200" />
        <Skeleton className="h-4 flex-1 max-w-xs" />
        <div className="hidden sm:flex items-center gap-4">
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-8 w-14" />
        </div>
      </div>
      {/* Three panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="w-[24%] border-r border-slate-200 bg-white p-4 flex flex-col gap-3">
          <Skeleton className="h-3 w-20" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 py-2">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="flex-1 flex flex-col gap-1">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
        {/* Centre panel */}
        <div className="w-[48%] border-r border-slate-200 bg-slate-50 p-4 flex flex-col gap-3">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="flex-1 rounded-lg" />
        </div>
        {/* Right panel */}
        <div className="w-[28%] bg-white p-4 flex flex-col gap-3">
          <Skeleton className="h-3 w-20" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-100 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-14 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
