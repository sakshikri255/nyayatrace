/**
 * PageLoader — shown by Next.js loading.tsx files while a page segment is streaming.
 * Renders a centred spinner with a subtle pulsing background, consistent across all routes.
 */
export function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 select-none"
    >
      {/* Spinner ring */}
      <div className="relative h-11 w-11">
        {/* Static track */}
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-700" />
        {/* Spinning arc */}
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-teal" />
      </div>

      {/* Pulsing label */}
      <p className="animate-pulse text-[13px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
        Loading…
      </p>
    </div>
  )
}

/**
 * FullPageLoader — same spinner but fills the entire viewport height.
 * Used in top-level or full-screen page segments.
 */
export function FullPageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-[#F8FAFC] dark:bg-[#0B0F17] select-none"
    >
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-700" />
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-teal" />
      </div>
      <p className="animate-pulse text-[13px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
        Loading…
      </p>
    </div>
  )
}
