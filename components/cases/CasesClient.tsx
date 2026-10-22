'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  SearchIcon,
  LayoutGridIcon,
  TableIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { CasesTable } from './CasesTable'
import { CasesGrid } from './CasesGrid'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CaseWithCounts } from '@/lib/queries/cases'
import { calculateStatutoryBail } from '@/lib/analysis/statutoryBail'
import { cn } from '@/lib/utils'
import { useSession } from '@/hooks/useSession'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'closed', label: 'Closed' },
  { value: 'stayed', label: 'Stayed' },
  { value: 'unspecified', label: 'Not specified' },
]

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'civil', label: 'Civil' },
  { value: 'bail', label: 'Bail' },
  { value: 'parole', label: 'Parole' },
  { value: 'unspecified', label: 'Not specified' },
]

interface CasesClientProps {
  initialCases: CaseWithCounts[]
  initialDialogOpen?: boolean
}

interface NewCaseForm {
  caseNumber: string
  title: string
  description: string
  caseType: string
  status: string
  court: string
  jurisdiction: string
  judge: string
  advocate: string
}

const EMPTY_FORM: NewCaseForm = {
  caseNumber: '',
  title: '',
  description: '',
  caseType: 'unspecified',
  status: 'unspecified',
  court: '',
  jurisdiction: '',
  judge: '',
  advocate: '',
}

type ViewMode = 'grid' | 'table'

function PillButton({
  active,
  onClick,
  children,
  accentActive,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  accentActive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-semibold transition-colors border cursor-pointer',
        active
          ? accentActive
            ? 'bg-teal text-white border-teal'
            : 'bg-[var(--section-heading)] text-[var(--section-card-bg)] border-[var(--section-heading)]'
          : 'bg-transparent text-[var(--section-subheading)] border-[var(--section-card-border)] hover:border-teal/40 hover:text-teal'
      )}
    >
      {children}
    </button>
  )
}

export function CasesClient({
  initialCases,
  initialDialogOpen = false,
}: CasesClientProps) {
  const router = useRouter()
  const [cases, setCases] = useState<CaseWithCounts[]>(initialCases)
  const [search, setSearch] = useState('')
  const [searchMatches, setSearchMatches] = useState<CaseWithCounts[] | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(initialDialogOpen)
  const [form, setForm] = useState<NewCaseForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const session = useSession()
  const [scopeFilter, setScopeFilter] = useState<'my' | 'all' | string>('my')

  // Keep cases in sync with prop updates
  useEffect(() => {
    setCases(initialCases)
  }, [initialCases])

  // Automatically update form advocate and sync case list on persona switch
  useEffect(() => {
    if (session?.name) {
      setForm((p) => ({ ...p, advocate: session.name }))
      fetch('/api/cases')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setCases(data)
        })
        .catch(() => {})
    }
  }, [session?.id, session?.name])

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') === '1') {
      setDialogOpen(true)
    }
  }, [])

  useEffect(() => {
    const query = search.trim()
    if (!query) {
      setSearchMatches(null)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      fetch(`/api/cases?search=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((data) => {
          if (!controller.signal.aborted) setSearchMatches(Array.isArray(data) ? data : [])
        })
        .catch(() => {
          if (!controller.signal.aborted) setSearchMatches([])
        })
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [search])

  // Client-side filtering
  const filtered = useMemo(() => {
    const source = search.trim() ? searchMatches ?? [] : cases
    return source.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      const matchesType = typeFilter === 'all' || c.caseType === typeFilter

      let matchesScope = true
      if (scopeFilter === 'my' && session?.name) {
        matchesScope = c.advocate === session.name
      } else if (scopeFilter !== 'all' && scopeFilter !== 'my') {
        matchesScope = c.advocate === scopeFilter
      }

      return matchesStatus && matchesType && matchesScope
    })
  }, [cases, searchMatches, search, statusFilter, typeFilter, scopeFilter, session])

  // Analytics Metrics
  const metrics = useMemo(() => {
    const totalDocs = cases.reduce((acc, c) => acc + (c.documentCount || 0), 0)
    const totalFindings = cases.reduce((acc, c) => acc + (c.findingCount || 0), 0)
    const urgentBailCount = cases.filter((c) => {
      const b = calculateStatutoryBail(c)
      return b.status === 'accrued' || b.status === 'urgent'
    }).length
    const activeCount = cases.filter((c) => c.status === 'active').length

    return { totalDocs, totalFindings, urgentBailCount, activeCount }
  }, [cases])

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('A case title is required.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to create case.')
        return
      }
      // Refresh list
      const refreshed = await fetch('/api/cases').then((r) => r.json())
      setCases(refreshed)
      setDialogOpen(false)
      setForm(EMPTY_FORM)
      toast.success('Case created. Opening workspace…')
      router.push(`/cases/${data.id}`)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── 1. Page Header & Primary Actions ──────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--section-heading)]">Cases &amp; Records</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal/10 text-teal border border-teal/20">
              {cases.length} cases registered
            </span>
          </div>
          <p className="text-xs text-[var(--section-subheading)] mt-1">
            {scopeFilter === 'my' && session
              ? `Showing matters assigned to Advocate ${session.name}.`
              : 'Showing all chamber case records.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => setDialogOpen(true)}
              className="gap-2 bg-teal hover:bg-teal-light text-white border-0 shadow-sm transition-all cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              New Case Record
            </Button>
          </motion.div>
        </div>
      </div>

      {/* ── 2. Floating Metrics Strip ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-8 px-6 py-4 border-b border-[var(--section-card-border)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-3xl font-bold text-teal tabular-nums">{metrics.activeCount}</span>
          <span className="text-xs text-[var(--section-subheading)] uppercase tracking-wide">Active Cases</span>
        </div>
        <div className="w-px h-10 bg-[var(--section-card-border)]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-3xl font-bold text-rose-500 tabular-nums flex items-center gap-1.5">
            {metrics.urgentBailCount}
            {metrics.urgentBailCount > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
            )}
          </span>
          <span className="text-xs text-[var(--section-subheading)] uppercase tracking-wide">Custody Alerts</span>
        </div>
        <div className="w-px h-10 bg-[var(--section-card-border)]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-3xl font-bold text-[var(--section-heading)] tabular-nums">{metrics.totalDocs}</span>
          <span className="text-xs text-[var(--section-subheading)] uppercase tracking-wide">Indexed Docs</span>
        </div>
        <div className="w-px h-10 bg-[var(--section-card-border)]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-3xl font-bold text-amber-500 tabular-nums">{metrics.totalFindings}</span>
          <span className="text-xs text-[var(--section-subheading)] uppercase tracking-wide">Findings Flagged</span>
        </div>
      </div>

      {/* ── 3. Search + Pill Filters ───────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Search bar */}
        <div className="relative max-w-lg">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--section-subheading)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search title, case number, court…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--section-card-bg)] border border-[var(--section-card-border)] text-sm text-[var(--section-heading)] placeholder:text-[var(--section-subheading)] focus:outline-none focus:border-teal/60 focus:ring-1 focus:ring-teal/30 transition-colors"
          />
        </div>

        {/* Filter pills row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Status pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_OPTIONS.filter(o => o.value !== 'unspecified').map((opt) => (
              <PillButton
                key={opt.value}
                active={statusFilter === opt.value}
                accentActive={opt.value === 'all'}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </PillButton>
            ))}
          </div>

          <div className="w-px h-5 bg-[var(--section-card-border)]" />

          {/* Type pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {TYPE_OPTIONS.filter(o => o.value !== 'unspecified').map((opt) => (
              <PillButton
                key={opt.value}
                active={typeFilter === opt.value}
                accentActive={opt.value === 'all'}
                onClick={() => setTypeFilter(opt.value)}
              >
                {opt.label}
              </PillButton>
            ))}
          </div>

          <div className="w-px h-5 bg-[var(--section-card-border)]" />

          {/* Scope pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <PillButton active={scopeFilter === 'my'} onClick={() => setScopeFilter('my')}>
              My Cases
            </PillButton>
            <PillButton active={scopeFilter === 'all'} onClick={() => setScopeFilter('all')}>
              All ({cases.length})
            </PillButton>
            <PillButton active={scopeFilter === 'Aditi Sharma'} onClick={() => setScopeFilter('Aditi Sharma')}>
              Adv. Aditi
            </PillButton>
            <PillButton active={scopeFilter === 'Rohan Mehta'} onClick={() => setScopeFilter('Rohan Mehta')}>
              Adv. Rohan
            </PillButton>
          </div>

          <div className="ml-auto flex items-center gap-1 rounded-lg border border-[var(--section-card-border)] p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              title="Card view"
              className={cn(
                'p-1.5 rounded-md transition-colors cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-[var(--section-heading)] text-[var(--section-card-bg)]'
                  : 'text-[var(--section-subheading)] hover:text-[var(--section-heading)]'
              )}
            >
              <LayoutGridIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Table view"
              className={cn(
                'p-1.5 rounded-md transition-colors cursor-pointer',
                viewMode === 'table'
                  ? 'bg-[var(--section-heading)] text-[var(--section-card-bg)]'
                  : 'text-[var(--section-subheading)] hover:text-[var(--section-heading)]'
              )}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Main View Display ──────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* Visual Cards View */}
        {viewMode === 'grid' && (
          <motion.div
            key="grid-cards"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <CasesGrid
              cases={filtered}
              onDeleteCase={(id) => {
                setCases((prev) => prev.filter((c) => c.id !== id))
                setSearchMatches((prev) => (prev ? prev.filter((c) => c.id !== id) : null))
              }}
            />
          </motion.div>
        )}

        {/* High-Density Table View */}
        {viewMode === 'table' && (
          <motion.div
            key="table-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-[var(--section-card-border)] bg-[var(--section-card-bg)] overflow-hidden"
          >
            <CasesTable
              cases={filtered}
              onDeleteCase={(id) => {
                setCases((prev) => prev.filter((c) => c.id !== id))
                setSearchMatches((prev) => (prev ? prev.filter((c) => c.id !== id) : null))
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 5. New Case Dialog ────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl p-6 bg-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Create a New Case Record
            </DialogTitle>
          </DialogHeader>
          <motion.form
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-3.5 mt-3"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">
                Case Title <span className="text-rose-500">*</span>
              </label>
              <Input
                name="title"
                placeholder="e.g. State of Maharashtra v. Rajesh Kumar"
                value={form.title}
                onChange={handleFormChange}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Case Number (optional)
                </label>
                <Input
                  name="caseNumber"
                  placeholder="Generated if left blank"
                  value={form.caseNumber}
                  onChange={handleFormChange}
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Case Type
                </label>
                <select
                  value={form.caseType}
                  onChange={(e) => setForm((p) => ({ ...p, caseType: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal cursor-pointer"
                >
                  <option value="unspecified">Not specified</option>
                  <option value="criminal">Criminal</option>
                  <option value="civil">Civil</option>
                  <option value="bail">Bail</option>
                  <option value="parole">Parole</option>
                  <option value="writ">Writ Petition</option>
                  <option value="appeal">Appeal</option>
                  <option value="revision">Revision</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Procedural Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal cursor-pointer"
                >
                  <option value="unspecified">Not specified</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="closed">Closed</option>
                  <option value="stayed">Stayed</option>
                  <option value="disposed">Disposed</option>
                  <option value="adjourned">Adjourned</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Court / Forum</label>
                <Input
                  name="court"
                  placeholder="e.g. Sessions Court, Mumbai"
                  value={form.court}
                  onChange={handleFormChange}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">
                Brief Case Narrative / Allegations
              </label>
              <Textarea
                name="description"
                placeholder="Summary of allegations, FIR registration, or key questions of law…"
                value={form.description}
                onChange={handleFormChange}
                className="text-sm resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Lead Advocate / Counsel
                </label>
                <Input
                  name="advocate"
                  placeholder="e.g. Aditi Sharma"
                  value={form.advocate}
                  onChange={handleFormChange}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Presiding Judge / Bench
                </label>
                <Input
                  name="judge"
                  placeholder="e.g. Hon'ble P. R. Deshmukh"
                  value={form.judge}
                  onChange={handleFormChange}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">
                State / Jurisdiction
              </label>
              <Input
                name="jurisdiction"
                placeholder="State, District, or High Court jurisdiction"
                value={form.jurisdiction}
                onChange={handleFormChange}
                className="h-9 text-sm"
              />
            </div>

            <DialogFooter className="mt-3">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-teal hover:bg-teal-light text-white border-0 w-full sm:w-auto font-semibold"
              >
                {submitting ? 'Creating Case Record…' : 'Create Case Record'}
              </Button>
            </DialogFooter>
          </motion.form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
