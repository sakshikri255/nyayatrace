import { Skeleton } from '@/components/ui/skeleton'

export default function CaseDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6 animate-in fade-in duration-150">
      {/* Back button skeleton */}
      <Skeleton className="h-5 w-24 bg-slate-200/70 rounded" />

      {/* Case Header Card Skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-40 bg-teal/15 rounded" />
              <Skeleton className="h-5 w-20 bg-slate-200/70 rounded-full" />
              <Skeleton className="h-5 w-20 bg-slate-200/70 rounded-full" />
            </div>
            <Skeleton className="h-8 w-72 bg-slate-200/90 rounded-md" />
            <div className="flex items-center gap-4 pt-1">
              <Skeleton className="h-4 w-32 bg-slate-200/60 rounded" />
              <Skeleton className="h-4 w-32 bg-slate-200/60 rounded" />
              <Skeleton className="h-4 w-28 bg-slate-200/50 rounded" />
            </div>
          </div>
          {/* Quick stats strip */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24 bg-slate-200/70 rounded-md" />
            <div className="flex gap-4 border-l border-slate-200 pl-4">
              <div className="space-y-1 text-center">
                <Skeleton className="h-6 w-8 mx-auto bg-slate-200/80 rounded" />
                <Skeleton className="h-3 w-12 bg-slate-200/50 rounded" />
              </div>
              <div className="space-y-1 text-center">
                <Skeleton className="h-6 w-8 mx-auto bg-slate-200/80 rounded" />
                <Skeleton className="h-3 w-12 bg-slate-200/50 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs List Bar Skeleton */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {['Overview', 'Documents', 'Analysis', 'Findings', 'Chronology', 'Legal Sections', 'Hearings'].map((tab) => (
          <Skeleton key={tab} className="h-8 w-24 bg-slate-200/60 rounded-md" />
        ))}
      </div>

      {/* Main Tab Content Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-32 w-full bg-slate-200/50 rounded-xl border border-slate-200/70" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full bg-slate-200/60 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
