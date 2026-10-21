'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  SearchIcon,
  LayoutGridIcon,
  TableIcon,
  FileTextIcon,
  AlertTriangleIcon,
  ShieldAlertIcon,
  BriefcaseIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CaseWithCounts } from '@/lib/queries/cases'
import { calculateStatutoryBail } from '@/lib/analysis/statutoryBail'
import { cn } from '@/lib/utils'
import { getSession, type UserRecord } from '@/lib/auth'

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
  caseType: '',
  status: 'unspecified',
  court: '',
  jurisdiction: '',
  judge: '',
  advocate: '',
}

type ViewMode = 'grid' | 'table'

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

  const [session, setSession] = useState<UserRecord | null>(null)
  const [scopeFilter, setScopeFilter] = useState<'my' | 'all' | string>('my')

  useEffect(() => {
    const cur = getSession()
    setSession(cur)
    if (cur) {
      setForm((p) => ({ ...p, advocate: cur.name }))
    }
  }, [])

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
        if (
          session.role?.toLowerCase().includes('judge') ||
          session.name.toLowerCase().includes('deshmukh')
        ) {
          matchesScope = !!(c.judge && c.judge.toLowerCase().includes('deshmukh'))
        } else {
          matchesScope = c.advocate === session.name
        }
      } else if (scopeFilter !== 'all' && scopeFilter !== 'my') {
        matchesScope =
          c.advocate === scopeFilter ||
          !!(c.judge && c.judge.toLowerCase().includes(scopeFilter.toLowerCase()))
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cases &amp; Records</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal/10 text-teal border border-teal/20">
              {cases.length} cases registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>
              {scopeFilter === 'my' && session
                ? `Showing matters assigned to ${session.role?.toLowerCase().includes('judge') ? 'Bench of ' + session.name : 'Advocate ' + session.name}.`
                : 'Showing all chamber and judicial court records.'}
            </span>
            {scopeFilter === 'my' ? (
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className="text-teal hover:underline font-semibold text-xs ml-1"
              >
                Show all chamber records ({cases.length})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setScopeFilter('my')}
                className="text-teal hover:underline font-semibold text-xs ml-1"
              >
                Filter to my matters ({session ? (session.role?.toLowerCase().includes('judge') ? 'Judge Bench' : 'Adv. ' + session.name) : 'My Matters'})
              </button>
            )}
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

      {/* ── 2. Analytics Intelligence Strip ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Cases
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal/10 text-teal">
              <BriefcaseIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.activeCount}</span>
            <span className="text-xs text-slate-400">of {cases.length} total</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Custody Alerts
              </span>
              {metrics.urgentBailCount > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
              <ShieldAlertIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{metrics.urgentBailCount}</span>
            <span className="text-xs text-slate-400">default bail risks</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Indexed Documents
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <FileTextIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalDocs}</span>
            <span className="text-xs text-slate-400">pages OCR analyzed</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Contradictions Flagged
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <AlertTriangleIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{metrics.totalFindings}</span>
            <span className="text-xs text-slate-400">discrepancy findings</span>
          </div>
        </motion.div>
      </div>

      {/* ── 3. View Switcher Tabs & Filter Toolbar ─────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
        {/* View Mode Pills with sliding active indicator */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer z-10',
              viewMode === 'grid'
                ? 'text-slate-900 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {viewMode === 'grid' && (
              <motion.div
                layoutId="casesViewPill"
                className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <LayoutGridIcon className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>

          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer z-10',
              viewMode === 'table'
                ? 'text-slate-900 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {viewMode === 'table' && (
              <motion.div
                layoutId="casesViewPill"
                className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-44 sm:min-w-60">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search title, case number, court…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-50/50 border-slate-200"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => v != null && setStatusFilter(v)}>
            <SelectTrigger size="sm" className="w-32 h-8 text-xs bg-slate-50/50 border-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => v != null && setTypeFilter(v)}>
            <SelectTrigger size="sm" className="w-32 h-8 text-xs bg-slate-50/50 border-slate-200">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Assigned Advocate & Bench Scope */}
          <Select value={scopeFilter} onValueChange={(v) => v != null && setScopeFilter(v)}>
            <SelectTrigger size="sm" className="w-48 h-8 text-xs bg-slate-50/50 border-slate-200">
              <SelectValue placeholder="Assigned Persona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="my" className="text-xs font-semibold text-teal-800">
                {session?.role?.toLowerCase().includes('judge')
                  ? `My Bench (Hon'ble P. R. Deshmukh)`
                  : `My Cases (Adv. ${session?.name || 'Aditi Sharma'})`}
              </SelectItem>
              <SelectItem value="all" className="text-xs">
                All Chamber &amp; Bench Records ({cases.length})
              </SelectItem>
              <SelectItem value="Aditi Sharma" className="text-xs">
                Adv. Aditi Sharma (Senior Advocate)
              </SelectItem>
              <SelectItem value="Rohan Mehta" className="text-xs">
                Adv. Rohan Mehta (Junior Associate)
              </SelectItem>
              <SelectItem value="Deshmukh" className="text-xs">
                Hon&apos;ble P. R. Deshmukh (Sessions Judge)
              </SelectItem>
            </SelectContent>
          </Select>
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
            className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs"
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
                <Select
                  value={form.caseType || 'unspecified'}
                  onValueChange={(v) =>
                    v != null &&
                    setForm((p) => ({ ...p, caseType: v === 'unspecified' ? '' : v }))
                  }
                >
                  <SelectTrigger size="sm" className="w-full h-9">
                    <SelectValue placeholder="Not specified" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unspecified">Not specified</SelectItem>
                    <SelectItem value="criminal">Criminal</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="bail">Bail</SelectItem>
                    <SelectItem value="parole">Parole</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  Procedural Status
                </label>
                <Select
                  value={form.status}
                  onValueChange={(v) => v != null && setForm((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger size="sm" className="w-full h-9">
                    <SelectValue placeholder="Not specified" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unspecified">Not specified</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="stayed">Stayed</SelectItem>
                  </SelectContent>
                </Select>
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
