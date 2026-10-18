import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MobileSidebarProvider } from '@/components/layout/MobileSidebarContext'
import { NavigationProgressBar } from '@/components/layout/NavigationProgressBar'
import { AnimatedPageWrapper } from '@/components/layout/AnimatedPageWrapper'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileSidebarProvider>
      <NavigationProgressBar />
      <div className="flex h-screen w-full overflow-hidden bg-offwhite">
        {/* Sidebar — desktop fixed, mobile overlay */}
        <Sidebar />

        {/* Main content column */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <div className="no-print">
            <Topbar />
          </div>
          <main className="flex-1 overflow-y-auto">
            <AnimatedPageWrapper>
              {children}
            </AnimatedPageWrapper>
          </main>
        </div>
      </div>
    </MobileSidebarProvider>
  )
}
