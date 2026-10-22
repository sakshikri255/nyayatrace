import { cn } from 'cn'

type Status = 'active' | 'closed' | 'pending' | 'stayed' | 'unspecified'
type CaseType = 'criminal' | 'civil' | 'bail' | 'parole' | 'unspecified'

const statusConfig: Record<Status, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  closed: {
    label: 'Closed',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  stayed: {
    label: 'Stayed',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  unspecified: {
    label: 'Not specified',
    className: 'rounded-md border-slate-200/80 bg-slate-100 px-3 py-1 font-medium text-slate-700',
  },
}

const typeConfig: Record<CaseType, { label: string; className: string }> = {
  criminal: {
    label: 'Criminal',
    className: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  civil: {
    label: 'Civil',
    className: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  bail: {
    label: 'Bail',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  parole: {
    label: 'Parole',
    className: 'bg-violet-100 text-violet-800 border-violet-200',
  },
  unspecified: {
    label: 'Not specified',
    className: 'rounded-md border-slate-200/80 bg-slate-100 px-3 py-1 font-medium text-slate-700',
  },
}

interface CaseStatusBadgeProps {
  status: Status
  className?: string
}

export function CaseStatusBadge({ status, className }: CaseStatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.pending
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {status === 'active' && (
        <span
          aria-hidden="true"
          className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600"
        />
      )}
      {config.label}
    </span>
  )
}

interface CaseTypeBadgeProps {
  caseType: CaseType
  className?: string
}

export function CaseTypeBadge({ caseType, className }: CaseTypeBadgeProps) {
  const config = typeConfig[caseType] ?? typeConfig.criminal
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
