'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
  isSidebarOpen: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  isSidebarOpen: true,
  toggleSidebar: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev)
  }

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}
