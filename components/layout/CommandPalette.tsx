'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Briefcase,
  Scale,
  FileText,
  TrendingUp,
  PlusCircle,
  BookOpen,
  ArrowRight,
  X,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  title: string
  subtitle?: string
  category: 'Cases' | 'Sections' | 'Search' | 'Actions'
  icon: React.ElementType
  onSelect: () => void
  badge?: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<CommandItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  // Search effect
  useEffect(() => {
    if (!open) return

    const trimmed = query.trim()
    if (!trimmed) {
      // Default quick actions
      setItems([
        {
          id: 'act-new-case',
          title: 'Create New Case Record',
          subtitle: 'Initialize a new case file and begin uploading exhibits',
          category: 'Actions',
          icon: PlusCircle,
          onSelect: () => {
            setOpen(false)
            router.push('/cases?new=1')
          },
          badge: 'Action',
        },
        {
          id: 'act-cases',
          title: 'All Cases & Workspaces',
          subtitle: 'Browse all active, stayed, and pending case files',
          category: 'Actions',
          icon: Briefcase,
          onSelect: () => {
            setOpen(false)
            router.push('/cases')
          },
        },
        {
          id: 'act-bail',
          title: 'Bail & Parole Briefs',
          subtitle: 'Review structured bail summaries and Section 167(2) default bail windows',
          category: 'Actions',
          icon: Scale,
          onSelect: () => {
            setOpen(false)
            router.push('/bail-briefs')
          },
        },
        {
          id: 'act-verification',
          title: 'Evidence Verification Workspace',
          subtitle: 'Inspect cross-document contradictions and source passages',
          category: 'Actions',
          icon: Search,
          onSelect: () => {
            setOpen(false)
            router.push('/verification')
          },
        },
        {
          id: 'act-progress',
          title: 'Case Progress & Hearing Timelines',
          subtitle: 'View hearing outcomes and judicial milestone activity',
          category: 'Actions',
          icon: TrendingUp,
          onSelect: () => {
            setOpen(false)
            router.push('/case-progress')
          },
        },
      ])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [casesRes, sectionsRes, searchRes] = await Promise.all([
          fetch(`/api/cases?search=${encodeURIComponent(trimmed)}`),
          fetch(`/api/legal-sections?q=${encodeURIComponent(trimmed)}`),
          fetch(`/api/search?q=${encodeURIComponent(trimmed)}`),
        ])

        const newItems: CommandItem[] = []

        // Cases
        if (casesRes.ok) {
          const casesData = await casesRes.json()
          for (const c of casesData.slice(0, 4)) {
            newItems.push({
              id: `case-${c.id}`,
              title: `${c.caseNumber}: ${c.title}`,
              subtitle: `${c.caseType.toUpperCase()} | ${c.court || 'Court unspecified'} | ${c.documentCount} docs`,
              category: 'Cases',
              icon: Briefcase,
              onSelect: () => {
                setOpen(false)
                router.push(`/cases/${c.id}`)
              },
              badge: c.status,
            })
          }
        }

        // Legal Sections
        if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json()
          for (const s of sectionsData.slice(0, 4)) {
            newItems.push({
              id: `sec-${s.ipcSection}`,
              title: `IPC Sec. ${s.ipcSection} ↔ BNS Sec. ${s.bnsSection}: ${s.offense}`,
              subtitle: `${s.bailable} | ${s.cognizable} | Triable: ${s.triableBy}`,
              category: 'Sections',
              icon: BookOpen,
              onSelect: () => {
                setOpen(false)
                router.push(`/bail-briefs`)
              },
              badge: s.bailable,
            })
          }
        }

        // Full-Text Page Matches
        if (searchRes.ok) {
          const searchData = await searchRes.json()
          for (const item of (searchData.results || []).slice(0, 5)) {
            newItems.push({
              id: `match-${item.id}`,
              title: item.documentName ? `${item.documentName} (p. ${item.pageNumber})` : item.caseTitle,
              subtitle: item.snippet,
              category: 'Search',
              icon: FileText,
              onSelect: () => {
                setOpen(false)
                router.push(`/verification/${item.caseId}`)
              },
              badge: item.caseNumber,
            })
          }
        }

        setItems(newItems)
        setSelectedIndex(0)
      } catch (err) {
        console.error('Command search error:', err)
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, open, router])

  // Key navigation in list
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1 < items.length ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : items.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (items[selectedIndex]) {
        items[selectedIndex].onSelect()
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-lg border border-border-dark bg-charcoal/80 px-3 py-1.5 text-xs text-muted hover:text-offwhite hover:border-teal/50 transition-colors"
      >
        <Search className="h-3.5 w-3.5 text-teal" />
        <span>Search cases, sections, text...</span>
        <kbd className="ml-2 rounded border border-border-dark bg-navy/80 px-1.5 py-0.5 text-[10px] font-mono text-muted">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl overflow-hidden p-0 bg-white border-slate-200 shadow-2xl">
          {/* Search bar header */}
          <div className="flex items-center border-b border-slate-200 px-4 py-3 bg-slate-50">
            <Search className="h-5 w-5 text-teal shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search case numbers, IPC/BNS sections, or full document text..."
              className="ml-3 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd className="ml-2 rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-500 border border-slate-200">
              ESC
            </kbd>
          </div>

          {/* Result items */}
          <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Searching records...</div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No matching cases, sections, or document text found.
              </div>
            ) : (
              items.map((item, index) => {
                const Icon = item.icon
                const isSelected = index === selectedIndex
                return (
                  <div
                    key={item.id}
                    onClick={() => item.onSelect()}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-2.5 text-left cursor-pointer transition-colors',
                      isSelected ? 'bg-teal/10 text-teal-900' : 'hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
                          isSelected
                            ? 'border-teal bg-teal text-white'
                            : 'border-slate-200 bg-white text-slate-600'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs truncate text-slate-900">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600 border border-slate-200">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && <ArrowRight className="h-4 w-4 text-teal shrink-0 ml-2" />}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer hotkeys hint */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="rounded border bg-white px-1 font-mono text-[10px]">↑</kbd>{' '}
                <kbd className="rounded border bg-white px-1 font-mono text-[10px]">↓</kbd> to navigate
              </span>
              <span>
                <kbd className="rounded border bg-white px-1 font-mono text-[10px]">↵</kbd> to select
              </span>
            </div>
            <span className="font-medium text-teal-800">NyayaTrace Command Bar</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
