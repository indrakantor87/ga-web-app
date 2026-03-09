'use client'

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { usePathname } from 'next/navigation'
import { SidebarProvider, useSidebar } from "@/components/SidebarContext";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isSidebarOpen } = useSidebar()
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 transition-all duration-300">
      <div 
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-30 transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <Sidebar />
      </div>
      
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  )
}