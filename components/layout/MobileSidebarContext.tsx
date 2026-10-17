'use client'

import { createContext, useContext, useState } from 'react'

interface MobileSidebarContextValue {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

const MobileSidebarContext = createContext<MobileSidebarContextValue>({
  mobileOpen: false,
  setMobileOpen: () => {},
})

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <MobileSidebarContext.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </MobileSidebarContext.Provider>
  )
}

export function useMobileSidebar() {
  return useContext(MobileSidebarContext)
}
