import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MobileSidebarProvider } from '@/components/layout/MobileSidebarContext'
import { NavigationProgressBar } from '@/components/layout/NavigationProgressBar'
import { AnimatedPageWrapper } from '@/components/layout/AnimatedPageWrapper'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { UrgencyTicker, type UrgencyItem } from '@/components/layout/UrgencyTicker'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { InstallPrompt } from '@/components/layout/InstallPrompt'
import { db } from '@/lib/db'
import { cases, hearings } from '@/lib/db/schema'
import { and, gte, lte, eq } from 'drizzle-orm'
import { calculateStatutoryBail } from '@/lib/analysis/statutoryBail'
import { calculateUTPRelief } from '@/lib/analysis/utpRelief'

function computeUrgentItems(): UrgencyItem[] {
  const items: UrgencyItem[] = []

  try {
    const today = new Date().toISOString().slice(0, 10)
    const in3days = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10)

    // 1. Upcoming hearings within 3 days
    const upcomingHearings = db
      .select({
        id: hearings.id,
        caseId: hearings.caseId,
        hearingDate: hearings.hearingDate,
        caseNumber: cases.caseNumber,
        caseTitle: cases.title,
      })
      .from(hearings)
      .innerJoin(cases, eq(cases.id, hearings.caseId))
      .where(and(gte(hearings.hearingDate, today), lte(hearings.hearingDate, in3days)))
      .limit(5)
      .all()

    for (const h of upcomingHearings) {
      const daysAway = Math.round(
        (new Date(h.hearingDate).getTime() - new Date(today).getTime()) / 86_400_000
      )
      items.push({
        id: `hearing-${h.id}`,
        label: `${h.caseTitle} — Hearing in ${daysAway === 0 ? 'TODAY' : `${daysAway}d`}`,
        href: `/bail-briefs/${h.caseId}`,
        level: daysAway === 0 ? 'critical' : 'warning',
      })
    }

    // 2. Bail default accrued or urgent cases
    const activeCases = db
      .select()
      .from(cases)
      .where(eq(cases.status, 'active'))
      .limit(30)
      .all()

    for (const c of activeCases) {
      if (!['criminal', 'bail'].includes(c.caseType)) continue

      const bail = calculateStatutoryBail({
        remandDate: c.remandDate,
        statutoryPeriodDays: c.statutoryPeriodDays,
        chargesheetFiled: c.chargesheetFiled,
        chargesheetDate: c.chargesheetDate,
        applicableLaw: c.applicableLaw,
      })
      if (bail.status === 'accrued') {
        items.push({
          id: `bail-accrued-${c.id}`,
          label: `${c.title} — Bail default right accrued`,
          href: `/bail-briefs/${c.id}`,
          level: 'critical',
        })
      } else if (bail.status === 'urgent') {
        items.push({
          id: `bail-urgent-${c.id}`,
          label: `${c.title} — Statutory bail deadline approaching`,
          href: `/bail-briefs/${c.id}`,
          level: 'warning',
        })
      }

      // 3. UTP relief eligible
      const maxPunishmentYears = (c as typeof c & { maxPunishmentYears?: number | null }).maxPunishmentYears
      if (maxPunishmentYears) {
        const utp = calculateUTPRelief({
          remandDate: c.remandDate,
          maxPunishmentYears,
          applicableLaw: c.applicableLaw,
          chargesheetFiled: c.chargesheetFiled,
        })
        if (utp.status === 'eligible') {
          items.push({
            id: `utp-${c.id}`,
            label: `${c.title} — UTP relief eligible (${utp.section})`,
            href: `/bail-briefs/${c.id}`,
            level: 'warning',
          })
        }
      }
    }
  } catch {
    // Silently ignore DB errors in layout
  }

  // Deduplicate and limit
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  }).slice(0, 10)
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const urgentItems = computeUrgentItems()

  return (
    <AuthGuard>
    <MobileSidebarProvider>
      <NavigationProgressBar />
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        {/* Sidebar — desktop fixed, mobile overlay */}
        <Sidebar />

        {/* Main content column */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <div className="no-print">
            <Topbar />
            <UrgencyTicker items={urgentItems} />
          </div>
          <main className="flex-1 overflow-y-auto bg-background text-foreground">
            <AnimatedPageWrapper>
              {children}
            </AnimatedPageWrapper>
          </main>
        </div>
      </div>
    </MobileSidebarProvider>
      <OfflineBanner />
      <InstallPrompt />
    </AuthGuard>
  )
}
