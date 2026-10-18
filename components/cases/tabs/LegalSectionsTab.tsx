'use client'

import { useState } from 'react'
import { BookOpen, Search, Shield, Scale, Sparkles, AlertCircle } from 'lucide-react'
import { LEGAL_SECTIONS_DB, searchLegalSections, detectLegalSections, type LegalSectionMapping } from '@/lib/legal/sections'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LegalSectionsTabProps {
  caseData: {
    id: number
    title: string
    caseType: string
  }
  documentTextSnippet?: string
}

export function LegalSectionsTab({ caseData, documentTextSnippet = '' }: LegalSectionsTabProps) {
  const [query, setQuery] = useState('')
  const [sections, setSections] = useState<LegalSectionMapping[]>(LEGAL_SECTIONS_DB)
  const [scanning, setScanning] = useState(false)
  const [detectedCount, setDetectedCount] = useState<number | null>(null)

  function handleSearch(val: string) {
    setQuery(val)
    if (!val.trim()) {
      setSections(LEGAL_SECTIONS_DB)
    } else {
      setSections(searchLegalSections(val))
    }
  }

  async function handleScanCase() {
    setScanning(true)
    try {
      const res = await fetch(`/api/cases/${caseData.id}`)
      if (res.ok) {
        const fullCase = await res.json()
        const allText = (fullCase.documents || [])
          .map((d: { originalName: string }) => d.originalName)
          .join(' ') + ' ' + (fullCase.description || '') + ' ' + documentTextSnippet

        const detected = detectLegalSections(allText)
        if (detected.length > 0) {
          setSections(detected)
          setDetectedCount(detected.length)
        } else {
          setDetectedCount(0)
        }
      }
    } catch {
      // noop
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-teal" />
            Statutory Transition Engine (IPC ↔ BNS / CrPC ↔ BNSS)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cross-map substantive offences and procedural powers under new Indian criminal laws.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleScanCase}
            disabled={scanning}
            className="gap-1.5 text-xs bg-teal hover:bg-teal-light text-white"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {scanning ? 'Scanning...' : 'Auto-Detect from Case'}
          </Button>
        </div>
      </div>

      {detectedCount !== null && (
        <div className="flex items-center justify-between rounded-lg bg-teal-50 border border-teal-200 p-3 text-xs text-teal-900">
          <span>
            Auto-detection identified <strong>{detectedCount}</strong> statutory provisions in this case file.
          </span>
          <button
            type="button"
            onClick={() => {
              setDetectedCount(null)
              setSections(LEGAL_SECTIONS_DB)
              setQuery('')
            }}
            className="font-semibold underline hover:text-teal-700"
          >
            Reset to All Sections
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by IPC section (e.g. 302, 420, 167), BNS equivalent, or offense (e.g. murder, default bail)..."
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal focus:outline-none"
        />
      </div>

      {/* Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((item) => {
          const isBailable = item.bailable === 'Bailable'
          const isCognizable = item.cognizable === 'Cognizable'

          return (
            <div
              key={`${item.ipcSection}-${item.bnsSection}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-shadow hover:shadow-md"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.offense}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Triable by: {item.triableBy}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      isBailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    )}
                  >
                    {item.bailable}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      isCognizable ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {item.cognizable}
                  </span>
                </div>
              </div>

              {/* Transition Mapping Card */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">
                    Pre-2024 Law (IPC / CrPC)
                  </span>
                  <span className="block text-sm font-extrabold text-slate-800 mt-0.5">
                    Sec. {item.ipcSection}
                  </span>
                </div>
                <div className="rounded-lg bg-teal-50 border border-teal-200/80 p-2.5">
                  <span className="block text-[10px] font-bold uppercase text-teal-600">
                    New Law (BNS / BNSS)
                  </span>
                  <span className="block text-sm font-extrabold text-teal-900 mt-0.5">
                    Sec. {item.bnsSection}
                  </span>
                </div>
              </div>

              {/* Punishment & Ingredients */}
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <p>
                  <strong className="text-slate-800">Punishment:</strong> {item.punishment}
                </p>
                <p className="text-[11px] leading-relaxed text-slate-500 bg-slate-50 rounded p-2 border border-slate-100">
                  <strong className="text-slate-700">Key Ingredients:</strong> {item.keyElements}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
