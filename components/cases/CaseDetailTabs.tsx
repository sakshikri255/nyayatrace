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
import { FindingsTab } from './tabs/FindingsTab'
import { HearingsTab } from './tabs/HearingsTab'
import { OrdersTab } from './tabs/OrdersTab'
import { BriefTab } from './tabs/BriefTab'
import { AnalysisWorkspace } from './tabs/AnalysisWorkspace'
import { MasterChronologyView } from '@/components/progress/MasterChronologyView'
import { LegalSectionsTab } from './tabs/LegalSectionsTab'

type JudicialOrder = {
  id: number
  caseId: number
  orderDate: string
  orderType: string
  summary: string | null
  issuedBy: string | null
  documentId: number | null
  createdAt: string | null
}

type BailCondition = {
  id: number
  caseId: number
  conditionText: string
  conditionType: string
  status: string
  orderId: number | null
  createdAt: string | null
}

interface CaseDetailTabsProps {
  caseData: CaseDetail
  documents: DocumentRow[]
  findings: FindingRow[]
  hearings: HearingRow[]
  hearingChartData?: HearingChartPoint[]
  orders: JudicialOrder[]
  conditions: BailCondition[]
}

type TabId =
  | 'overview'
  | 'documents'
  | 'synopsis'
  | 'chronology'
  | 'findings'
  | 'sections'
  | 'hearings'
  | 'orders'
  | 'brief'

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
  orders,
  conditions,
}: CaseDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab') as TabId | 'detective' | null
      if (tabParam === 'detective' || tabParam === 'chronology') {
        setActiveTab('chronology')
      } else if (
        tabParam &&
        [
          'overview',
          'documents',
          'synopsis',
          'findings',
          'sections',
          'hearings',
          'orders',
          'brief',
        ].includes(tabParam)
      ) {
        setActiveTab(tabParam as TabId)
      } else {
        setActiveTab('overview')
      }
    }
  }, [caseData.id])

    const TAB_ITEMS: Array<{
      id: TabId
      label: string
      count?: number
      icon?: React.ElementType
      badgeClassName?: string
    }> = [
      { id: 'overview', label: 'Overview' },
      { id: 'documents', label: 'Documents', count: documents.length },
      { id: 'chronology', label: 'Checkpoints & Chronology', icon: Clock },
      { id: 'synopsis', label: 'Analysis & Synopsis' },
      { id: 'findings', label: 'Findings', count: findings.length, badgeClassName: 'text-amber-700 bg-amber-50 border border-amber-200' },
      { id: 'sections', label: 'Legal Sections' },
      { id: 'hearings', label: 'Hearings', count: hearings.length },
      { id: 'orders', label: 'Orders', count: orders.length },
      { id: 'brief', label: 'Brief' },
    ]

    return (
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabId)}
        className="w-full"
      >
        <div className="relative mb-5 w-full max-w-full overflow-x-auto border-b border-slate-200 pb-0 flex items-center gap-1 scrollbar-none">
          {TAB_ITEMS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex-none px-3.5 py-2.5 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer outline-none select-none',
                  isActive ? 'text-teal font-bold' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {Icon && <Icon className={cn('w-3.5 h-3.5 transition-colors', isActive ? 'text-teal' : 'text-slate-400')} />}
                <span>{tab.label}</span>

                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.2 text-[10px] font-bold transition-all',
                      tab.badgeClassName || 'bg-slate-100 text-slate-500',
                      isActive && 'scale-105'
                    )}
                  >
                    {tab.count}
                  </span>
                )}

                {/* Animated Sliding Indicator Line */}
                {isActive && (
                  <motion.div
                    layoutId="caseDetailActiveTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal rounded-full shadow-[0_1px_6px_rgba(13,148,136,0.35)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
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
          {activeTab === 'overview' && (
            <OverviewTab
              caseData={caseData}
              documents={documents}
              findings={findings}
              hearings={hearings}
              onGoToAnalysis={() => setActiveTab('synopsis')}
            />
          )}
          {activeTab === 'documents' && (
            <DocumentsTab caseId={caseData.id} initialDocuments={documents} />
          )}
          {activeTab === 'synopsis' && (
            <AnalysisWorkspace
              caseData={caseData}
              documents={documents}
              onUploadDocuments={() => setActiveTab('documents')}
              onGoToChronology={() => setActiveTab('chronology')}
            />
          )}
          {activeTab === 'findings' && (
            <FindingsTab caseId={caseData.id} findings={findings} />
          )}
          {activeTab === 'chronology' && (
            <MasterChronologyView
              caseId={caseData.id}
              caseNumber={caseData.caseNumber}
              caseTitle={caseData.title}
            />
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
          {activeTab === 'orders' && (
            <OrdersTab caseId={caseData.id} orders={orders} conditions={conditions} />
          )}
          {activeTab === 'brief' && (
            <BriefTab caseId={caseData.id} />
          )}
        </motion.div>
      </AnimatePresence>
    </Tabs>
  )
}
