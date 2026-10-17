'use client'

import { useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { CaseDetail } from '@/lib/queries/cases'
import type { DocumentRow } from '@/lib/queries/documents'
import type { FindingRow } from '@/lib/queries/findings'
import type { HearingRow } from '@/lib/queries/hearings'
import { OverviewTab } from './tabs/OverviewTab'
import { DocumentsTab } from './tabs/DocumentsTab'
import { FindingsTab } from './tabs/FindingsTab'
import { HearingsTab } from './tabs/HearingsTab'
import { OrdersTab } from './tabs/OrdersTab'
import { BriefTab } from './tabs/BriefTab'
import { AnalysisWorkspace } from './tabs/AnalysisWorkspace'

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
  orders: JudicialOrder[]
  conditions: BailCondition[]
}

type TabId = 'overview' | 'documents' | 'synopsis' | 'findings' | 'hearings' | 'orders' | 'brief'

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
  orders,
  conditions,
}: CaseDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(documents.length === 0 ? 'documents' : 'overview')

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as TabId)}
      className="w-full"
    >
      <TabsList variant="line" className="mb-4 h-auto w-full max-w-full justify-start overflow-x-auto rounded-none border-b border-slate-200 pb-0">
        <TabsTrigger value="overview" className="flex-none px-3">Overview</TabsTrigger>
        <TabsTrigger value="documents" className="flex-none px-3">
          Documents{documents.length > 0 && <span className="ml-1 text-xs text-slate-400">({documents.length})</span>}
        </TabsTrigger>
        <TabsTrigger value="synopsis" className="flex-none px-3">Synopsis</TabsTrigger>
        <TabsTrigger value="findings" className="flex-none px-3">
          Findings{findings.length > 0 && <span className="ml-1 text-xs text-amber-500">({findings.length})</span>}
        </TabsTrigger>
        <TabsTrigger value="hearings" className="flex-none px-3">
          Hearings{hearings.length > 0 && <span className="ml-1 text-xs text-slate-400">({hearings.length})</span>}
        </TabsTrigger>
        <TabsTrigger value="orders" className="flex-none px-3">Orders</TabsTrigger>
        <TabsTrigger value="brief" className="flex-none px-3">Brief</TabsTrigger>
      </TabsList>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <TabsContent value="overview">
            <OverviewTab caseData={caseData} documents={documents} findings={findings} hearings={hearings} />
          </TabsContent>
          <TabsContent value="documents">
            <DocumentsTab caseId={caseData.id} initialDocuments={documents} />
          </TabsContent>
          <TabsContent value="synopsis">
            <AnalysisWorkspace
              caseData={caseData}
              documents={documents}
              onUploadDocuments={() => setActiveTab('documents')}
            />
          </TabsContent>
          <TabsContent value="findings">
            <FindingsTab caseId={caseData.id} findings={findings} />
          </TabsContent>
          <TabsContent value="hearings">
            <HearingsTab hearings={hearings} />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersTab caseId={caseData.id} orders={orders} conditions={conditions} />
          </TabsContent>
          <TabsContent value="brief">
            <BriefTab caseId={caseData.id} />
          </TabsContent>
        </motion.div>
      </AnimatePresence>
    </Tabs>
  )
}
