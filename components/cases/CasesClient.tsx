'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PlusIcon, SearchIcon } from 'lucide-react'
import { toast } from 'sonner'
import { CasesTable } from './CasesTable'
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
}

export function CasesClient({
  initialCases,
  initialDialogOpen = false,
}: CasesClientProps & { initialDialogOpen?: boolean }) {
  const router = useRouter()
  const [cases, setCases] = useState<CaseWithCounts[]>(initialCases)
  const [search, setSearch] = useState('')
  const [searchMatches, setSearchMatches] = useState<CaseWithCounts[] | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(initialDialogOpen)
  const [form, setForm] = useState<NewCaseForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

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
      return matchesStatus && matchesType
    })
  }, [cases, searchMatches, search, statusFilter, typeFilter])

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
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cases</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {cases.length} total · {filtered.length} shown
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="gap-2 bg-teal hover:bg-teal-light text-white border-0"
        >
          <PlusIcon className="w-4 h-4" />
          New Case
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by title or case number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v != null && setStatusFilter(v)}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => v != null && setTypeFilter(v)}>
          <SelectTrigger size="sm" className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <CasesTable cases={filtered} />
        </div>
      ) : cases.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 text-teal">
            <PlusIcon className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">No cases created yet.</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Create a case to upload documents and generate a source-linked case synopsis.
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="mt-5 gap-2 bg-teal text-white hover:bg-teal-light"
          >
            <PlusIcon className="h-4 w-4" />
            Create Your First Case
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          No cases match these filters.
        </div>
      )}

      {/* New Case Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg">Create a case</DialogTitle>
          </DialogHeader>
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 mt-2"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Title <span className="text-rose-500">*</span>
              </label>
              <Input
                name="title"
                placeholder="Case title"
                value={form.title}
                onChange={handleFormChange}
                className="h-8 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Case number (optional)</label>
                <Input
                  name="caseNumber"
                  placeholder="Generated if left blank"
                  value={form.caseNumber}
                  onChange={handleFormChange}
                  className="h-8 text-sm font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Case type (optional)</label>
                <Select
                  value={form.caseType || 'unspecified'}
                  onValueChange={(v) => v != null && setForm((p) => ({ ...p, caseType: v === 'unspecified' ? '' : v }))}
                >
                  <SelectTrigger size="sm" className="w-full">
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
                <label className="text-xs font-medium text-slate-600">Procedural status (optional)</label>
                <Select
                  value={form.status}
                  onValueChange={(v) => v != null && setForm((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger size="sm" className="w-full">
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
                <label className="text-xs font-medium text-slate-600">Court (optional)</label>
                <Input
                  name="court"
                  placeholder="Court name"
                  value={form.court}
                  onChange={handleFormChange}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Description
              </label>
              <Textarea
                name="description"
                placeholder="Brief description of the case…"
                value={form.description}
                onChange={handleFormChange}
                className="text-sm resize-none"
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Jurisdiction (optional)</label>
              <Input
                name="jurisdiction"
                placeholder="State, region, or jurisdiction"
                value={form.jurisdiction}
                onChange={handleFormChange}
                className="h-8 text-sm"
              />
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-teal hover:bg-teal-light text-white border-0 w-full sm:w-auto"
              >
                {submitting ? 'Creating…' : 'Create Case'}
              </Button>
            </DialogFooter>
          </motion.form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
