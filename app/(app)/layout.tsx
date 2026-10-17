import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MobileSidebarProvider } from '@/components/layout/MobileSidebarContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileSidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-offwhite">
        {/* Sidebar — desktop fixed, mobile overlay */}
        <Sidebar />

        {/* Main content column */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <div className="no-print">
            <Topbar />
          </div>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </MobileSidebarProvider>
  )
}
