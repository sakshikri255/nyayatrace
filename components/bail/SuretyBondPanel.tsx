'use client'

import { useState, useEffect, useCallback } from 'react'
import { BadgeIndianRupeeIcon, EditIcon, CheckIcon, RefreshCwIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SuretyBond {
  id: number
  conditionId: number
  suretyName: string
  relationship: string
  bondAmount: string
  documentReference: string | null
  verificationStatus: 'pending' | 'verified' | 'rejected'
}

interface SuretyBondPanelProps {
  conditionId: number
  caseId: number
}

const verificationConfig = {
  pending:  { label: 'Pending Verification', className: 'bg-amber-100 text-amber-700' },
  verified: { label: 'Verified',              className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected',              className: 'bg-rose-100 text-rose-700' },
}

export function SuretyBondPanel({ conditionId, caseId }: SuretyBondPanelProps) {
  const [bond, setBond] = useState<SuretyBond | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [suretyName, setSuretyName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [bondAmount, setBondAmount] = useState('')
  const [docRef, setDocRef] = useState('')
  const [verStatus, setVerStatus] = useState<'pending' | 'verified' | 'rejected'>('pending')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cases/${caseId}/conditions/${conditionId}/surety`)
      if (res.ok) {
        const data = await res.json() as SuretyBond | null
        setBond(data)
        if (data) {
          setSuretyName(data.suretyName)
          setRelationship(data.relationship)
          setBondAmount(data.bondAmount)
          setDocRef(data.documentReference ?? '')
          setVerStatus(data.verificationStatus)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [caseId, conditionId])

  useEffect(() => { load() }, [load])

  function startEditing() {
    if (!bond) {
      setSuretyName('')
      setRelationship('')
      setBondAmount('')
      setDocRef('')
      setVerStatus('pending')
    }
    setEditing(true)
  }

  async function handleSave() {
    if (!suretyName.trim() || !relationship.trim() || !bondAmount.trim()) {
      toast.error('Surety name, relationship, and bond amount are required.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/cases/${caseId}/conditions/${conditionId}/surety`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suretyName, relationship, bondAmount, documentReference: docRef || null, verificationStatus: verStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to save surety bond')
      }
      toast.success('Surety bond details saved.')
      setEditing(false)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-amber-50/50 border-t border-amber-100 px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
        <RefreshCwIcon className="w-3 h-3 animate-spin" /> Loading surety details…
      </div>
    )
  }

  return (
    <div className="bg-amber-50/40 border-t border-amber-100 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BadgeIndianRupeeIcon className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Surety Bond Details</span>
        </div>
        <button
          onClick={editing ? () => setEditing(false) : startEditing}
          className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
        >
          <EditIcon className="w-3 h-3" />
          {editing ? 'Cancel' : bond ? 'Edit' : 'Add Details'}
        </button>
      </div>

      {editing ? (
        <div className="rounded-md border border-amber-200 bg-white p-3 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Surety Name</label>
              <input
                value={suretyName}
                onChange={(e) => setSuretyName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Relationship</label>
              <input
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Father, Friend"
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Bond Amount</label>
              <input
                value={bondAmount}
                onChange={(e) => setBondAmount(e.target.value)}
                placeholder="e.g. ₹50,000"
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Document Reference</label>
              <input
                value={docRef}
                onChange={(e) => setDocRef(e.target.value)}
                placeholder="Optional"
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Verification Status</label>
            <div className="flex gap-1">
              {(['pending', 'verified', 'rejected'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setVerStatus(s)}
                  className={cn(
                    'rounded px-2 py-1 text-xs font-medium border transition-colors',
                    verStatus === s ? verificationConfig[s].className + ' border-current' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  )}
                >
                  {verificationConfig[s].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setEditing(false)} className="text-xs text-slate-500 hover:text-slate-700">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              <CheckIcon className="w-3 h-3" />
              {saving ? 'Saving…' : 'Save Bond Details'}
            </button>
          </div>
        </div>
      ) : bond ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase">Surety</span>
            <span className="font-medium text-slate-800">{bond.suretyName}</span>
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase">Relationship</span>
            <span className="font-medium text-slate-800">{bond.relationship}</span>
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase">Bond Amount</span>
            <span className="font-medium text-slate-800">{bond.bondAmount}</span>
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase">Status</span>
            <span className={cn('inline-flex rounded-full px-2 py-0.5 font-medium', verificationConfig[bond.verificationStatus].className)}>
              {verificationConfig[bond.verificationStatus].label}
            </span>
          </div>
          {bond.documentReference && (
            <div className="col-span-2 sm:col-span-4">
              <span className="block text-[10px] font-semibold text-slate-400 uppercase">Document Ref.</span>
              <span className="text-slate-600">{bond.documentReference}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-amber-700/70">No surety bond details recorded. Click &quot;Add Details&quot; to add.</p>
      )}
    </div>
  )
}
