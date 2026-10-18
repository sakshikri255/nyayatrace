'use client'

import { useState, useEffect } from 'react'
import { Bookmark, Plus, Trash2, Tag, FileText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface AnnotationItem {
  id: number
  caseId: number
  documentId: number
  pageNumber: number
  selectedText: string | null
  note: string
  tag: 'alibi' | 'medical' | 'panchnama' | 'fir_lapse' | 'eyewitness' | 'procedural_lapse' | 'general'
  color: 'amber' | 'emerald' | 'teal' | 'rose' | 'blue'
  createdAt: string
  documentName?: string
}

interface AnnotationsPanelProps {
  caseId: number
  documentId: number | null
  currentPage: number
  onNavigateToPage?: (page: number) => void
}

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  alibi: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  medical: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  panchnama: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  fir_lapse: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  eyewitness: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  procedural_lapse: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  general: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
}

export function AnnotationsPanel({
  caseId,
  documentId,
  currentPage,
  onNavigateToPage,
}: AnnotationsPanelProps) {
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [note, setNote] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [tag, setTag] = useState<AnnotationItem['tag']>('general')
  const [color, setColor] = useState<AnnotationItem['color']>('amber')
  const [saving, setSaving] = useState(false)

  async function loadAnnotations() {
    try {
      const res = await fetch(`/api/annotations?caseId=${caseId}`)
      if (res.ok) {
        const data = await res.json()
        setAnnotations(data)
      }
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnotations()
  }, [caseId])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!documentId) {
      toast.error('Select a document before adding an annotation.')
      return
    }
    if (!note.trim()) {
      toast.error('Annotation note cannot be empty.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          documentId,
          pageNumber: currentPage,
          selectedText: selectedText.trim() || null,
          note: note.trim(),
          tag,
          color,
        }),
      })

      if (!res.ok) throw new Error('Failed to create annotation')

      const created = await res.json()
      setAnnotations((prev) => [created, ...prev])
      setNote('')
      setSelectedText('')
      setShowAddForm(false)
      toast.success('Annotation saved.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error creating annotation')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/annotations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setAnnotations((prev) => prev.filter((a) => a.id !== id))
        toast.success('Annotation removed.')
      }
    } catch {
      toast.error('Failed to remove annotation.')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-teal" />
          <h3 className="text-sm font-semibold text-slate-800">
            Evidence Annotations ({annotations.length})
          </h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="h-7 text-xs gap-1 border-slate-300"
        >
          <Plus className="h-3.5 w-3.5" />
          {showAddForm ? 'Cancel' : 'New Note'}
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Target: Page <strong>{currentPage}</strong>
            </span>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value as AnnotationItem['tag'])}
              className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700"
            >
              <option value="general">#General</option>
              <option value="alibi">#Alibi</option>
              <option value="medical">#MedicalEvidence</option>
              <option value="fir_lapse">#FIRContradiction</option>
              <option value="panchnama">#PanchnamaLapse</option>
              <option value="eyewitness">#Eyewitness</option>
              <option value="procedural_lapse">#ProceduralLapse</option>
            </select>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Legal observation or argument regarding this page..."
            rows={2}
            className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-teal"
            required
          />

          <input
            type="text"
            value={selectedText}
            onChange={(e) => setSelectedText(e.target.value)}
            placeholder="Optional quoted excerpt from page..."
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-teal"
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
              className="h-6 px-2 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="h-6 px-3 text-xs bg-teal hover:bg-teal-light text-white"
            >
              {saving ? 'Saving...' : 'Pin Note'}
            </Button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {loading ? (
          <p className="text-xs text-slate-400 text-center py-6">Loading annotations...</p>
        ) : annotations.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Bookmark className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">No sticky annotations yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Add observations, tag alibis, or highlight procedural lapses across pages.
            </p>
          </div>
        ) : (
          annotations.map((item) => {
            const style = TAG_COLORS[item.tag] || TAG_COLORS.general
            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-lg border p-3 text-xs shadow-xs transition-shadow hover:shadow-sm',
                  style.bg,
                  style.border
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        style.text
                      )}
                    >
                      #{item.tag}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateToPage?.(item.pageNumber)}
                      className="text-slate-500 hover:text-slate-900 font-medium underline text-[11px]"
                    >
                      p. {item.pageNumber}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                <p className="text-slate-800 font-medium leading-relaxed">{item.note}</p>

                {item.selectedText && (
                  <p className="mt-1.5 rounded bg-white/70 p-1.5 text-[11px] italic text-slate-600 border border-slate-200/50">
                    “{item.selectedText}”
                  </p>
                )}

                {item.documentName && (
                  <p className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                    <FileText className="h-2.5 w-2.5" />
                    {item.documentName}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
