'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { Clock } from 'lucide-react'
import { Tabs } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { CaseDetail } from '@/lib/queries/cases'
import type { DocumentRow } from '@/lib/queries/documents'
import type { FindingRow } from '@/lib/queries/findings'
import type { HearingRow, HearingChartPoint } from '@/lib/queries/hearings'
import { OverviewTab } from './tabs/OverviewTab'
import { DocumentsTab } from './tabs/DocumentsTab'
import { UploadsTab } from './tabs/UploadsTab'
import { FindingsTab } from './tabs/FindingsTab'
import { HearingsTab } from './tabs/HearingsTab'
import { ReportTab } from './tabs/ReportTab'
import { MasterChronologyView } from '@/components/progress/MasterChronologyView'
import { AnalysisWorkspace } from './tabs/AnalysisWorkspace'
import { LegalSectionsTab } from './tabs/LegalSectionsTab'

interface CaseDetailTabsProps {
  caseData: CaseDetail
  documents: DocumentRow[]
  findings: FindingRow[]
  hearings: HearingRow[]
  hearingChartData?: HearingChartPoint[]
}

type TabId =
  | 'uploads'
  | 'chronology'
  | 'synopsis'
  | 'findings'
  | 'sections'
  | 'hearings'
  | 'report'

const tabVariants: Variants = {
  hidden: { opacity: 0, x: -4 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: 4, transition: { duration: 0.1 } },
}

export function CaseDetailTabs({
  caseData,
  documents,
  findings,
  hearings,
  hearingChartData,
}: CaseDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('uploads')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab') as string | null
      if (tabParam === 'detective' || tabParam === 'chronology') {
          setActiveTab('chronology')
        } else if (tabParam === 'overview' || tabParam === 'documents') {
          setActiveTab('uploads')
        } else if (
          tabParam &&
          [
            'uploads',
            'chronology',
            'synopsis',
            'findings',
            'sections',
            'hearings',
            'report',
          ].includes(tabParam)
        ) {
          setActiveTab(tabParam as TabId)
        } else {
          setActiveTab('uploads')
        }
    }
  }, [caseData.id])

  function changeActiveTab(tab: TabId) {
    setActiveTab(tab)
  }

    const TAB_ITEMS: Array<{
      id: TabId
      label: string
      count?: number
      icon?: React.ElementType
      badgeClassName?: string
    }> = [
      { id: 'uploads', label: 'Uploads', count: documents.length },
      { id: 'chronology', label: 'Checkpoints & Chronology', icon: Clock },
      { id: 'synopsis', label: 'Analysis & Synopsis' },
      { id: 'findings', label: 'Findings', count: findings.length, badgeClassName: 'text-amber-700 bg-amber-50 border border-amber-200' },
      { id: 'sections', label: 'Legal Sections' },
      { id: 'hearings', label: 'Hearings', count: hearings.length },
      { id: 'report', label: 'Report' },
    ]

    return (
      <Tabs
        value={activeTab}
        onValueChange={(v) => changeActiveTab(v as TabId)}
        className="w-full"
      >
        <div
          aria-label="Case sections"
          className="relative mb-5 flex w-full min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap rounded-xl border border-slate-200/80 bg-slate-100 px-1 py-2 scrollbar-none scroll-smooth dark:border-slate-700/80 dark:bg-slate-800"
          tabIndex={0}
        >
          {TAB_ITEMS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => changeActiveTab(tab.id)}
                className={cn(
                  'relative flex flex-none cursor-pointer select-none items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium outline-none transition-all',
                  isActive
                    ? 'bg-white font-semibold text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-white'
                )}
              >
                {Icon && <Icon className={cn('h-3.5 w-3.5 transition-colors', isActive ? 'text-teal' : 'text-slate-400')} />}
                <span>{tab.label}</span>

                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold transition-all',
                      isActive
                        ? 'bg-slate-100 text-slate-600'
                        : tab.badgeClassName || 'bg-slate-200/70 text-slate-500'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full pt-1"
        >
          {activeTab === 'uploads' && (
            <UploadsTab
              caseData={caseData}
              documents={documents}
              findings={findings}
              hearings={hearings}
              onGoToAnalysis={() => changeActiveTab('synopsis')}
            />
          )}
          {activeTab === 'chronology' && (
            <MasterChronologyView
              caseId={caseData.id}
              caseNumber={caseData.caseNumber}
              caseTitle={caseData.title}
            />
          )}
          {activeTab === 'synopsis' && (
            <AnalysisWorkspace
              caseData={caseData}
              documents={documents}
              onUploadDocuments={() => changeActiveTab('uploads')}
            />
          )}
          {activeTab === 'findings' && (
            <FindingsTab caseId={caseData.id} findings={findings} />
          )}
          {activeTab === 'sections' && (
            <LegalSectionsTab caseData={caseData} />
          )}
          {activeTab === 'hearings' && (
            <HearingsTab
              hearings={hearings}
              chartData={hearingChartData}
              caseTitle={caseData.title}
            />
          )}
          {activeTab === 'report' && (
            <ReportTab caseId={caseData.id} />
          )}
        </motion.div>
      </AnimatePresence>
    </Tabs>
  )
}
