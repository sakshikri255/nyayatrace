import { Skeleton } from '@/components/ui/skeleton'

export default function VerificationLoading() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-offwhite animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-24 bg-slate-200/80 rounded" />
          <Skeleton className="h-4 w-4 bg-slate-200/50 rounded-full" />
          <Skeleton className="h-5 w-40 bg-teal/15 rounded" />
          <Skeleton className="h-5 w-56 bg-slate-200/70 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 bg-slate-200/70 rounded-md" />
        </div>
      </div>

      {/* 3-Pane Skeleton */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document List (20%) */}
        <div className="w-1/5 border-r border-slate-200 bg-white p-4 space-y-3">
          <Skeleton className="h-5 w-28 bg-slate-200/80 rounded" />
          <Skeleton className="h-8 w-full bg-slate-200/60 rounded-md" />
          <div className="space-y-2 pt-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full bg-slate-200/50 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Center: Document Viewer (50%) */}
        <div className="flex-1 bg-slate-100/60 p-6 flex flex-col items-center justify-center space-y-4">
          <Skeleton className="h-8 w-72 bg-slate-200/80 rounded-md" />
          <Skeleton className="h-[70vh] w-[90%] max-w-3xl bg-white rounded-lg shadow-sm border border-slate-200" />
        </div>

        {/* Right: Discrepancy & Annotations Panel (30%) */}
        <div className="w-[30%] border-l border-slate-200 bg-white p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Skeleton className="h-8 w-32 bg-slate-200/70 rounded-md" />
            <Skeleton className="h-8 w-32 bg-slate-200/50 rounded-md" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full bg-slate-200/60 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
