'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CaseDetail } from '@/lib/queries/cases'

export function EditCaseDialog({ caseData }: { caseData: CaseDetail }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    caseNumber: caseData.caseNumber,
    title: caseData.title,
    description: caseData.description ?? '',
    caseType: caseData.caseType || 'unspecified',
    status: caseData.status || 'unspecified',
    court: caseData.court ?? '',
    jurisdiction: caseData.jurisdiction ?? '',
  })

  function update(name: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Case could not be updated.')
      setOpen(false)
      toast.success('Case details saved.')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Case could not be updated.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-auto gap-2 rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-200"
      >
        <Pencil className="h-4 w-4" /> Edit case
      </Button>
      <DialogContent className="sm:max-w-2xl p-6">
        <DialogHeader><DialogTitle className="text-lg">Edit case details</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="mt-2 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Case title <span className="text-rose-600">Required</span>
            <Input value={form.title} onChange={(event) => update('title', event.target.value)} required maxLength={200} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Case number
              <Input value={form.caseNumber} onChange={(event) => update('caseNumber', event.target.value)} required maxLength={100} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Case type
              <select
                value={form.caseType}
                onChange={(e) => update('caseType', e.target.value)}
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
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Procedural status
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
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
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Court
              <Input value={form.court} onChange={(event) => update('court', event.target.value)} maxLength={200} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Jurisdiction
            <Input value={form.jurisdiction} onChange={(event) => update('jurisdiction', event.target.value)} maxLength={200} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Case notes
            <Textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={4} maxLength={5000} />
          </label>
          <div className="flex justify-end border-t border-slate-200 pt-3">
            <Button type="submit" disabled={saving} className="bg-teal text-white hover:bg-teal-light">
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}