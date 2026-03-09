'use client'

import React, { useState } from 'react'
import { 
  Home, 
  Database, 
  FileText, 
  Paperclip, 
  Settings, 
  ChevronDown, 
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { useSidebar } from './SidebarContext'
import Image from 'next/image'

type MenuItem = {
  label: string
  href: string
  icon: React.ElementType
  subItems?: { label: string; href: string }[]
}

const MENU_ITEMS: MenuItem[] = [
  { 
    label: 'Dashboard', 
    href: '/', 
    icon: Home 
  },
  { 
    label: 'Data Master', 
    href: '#', 
    icon: Database,
    subItems: [
      { label: 'Jenis Barang', href: '/master/categories' },
      { label: 'Satuan', href: '/master/units' },
      { label: 'Data Barang', href: '/master/items' },
    ]
  },
  { 
    label: 'Transaksi', 
    href: '#', 
    icon: FileText,
    subItems: [
      { label: 'Barang Masuk', href: '/transactions/in' },
      { label: 'Barang Keluar', href: '/transactions/out' },
      { label: 'Log Aktivitas', href: '/transactions/logs' },
    ]
  },
  { 
    label: 'Laporan', 
    href: '#', 
    icon: Paperclip,
    subItems: [
      { label: 'Laporan Stok', href: '/reports/stock' },
      { label: 'Laporan Barang Masuk', href: '/reports/in' },
      { label: 'Laporan Barang Keluar', href: '/reports/out' },
    ]
  },
  { 
    label: 'Settings', 
    href: '#', 
    icon: Settings,
    subItems: [
      { label: 'Data Settings', href: '/settings/data' },
      { label: 'Manajemen User', href: '/settings/users' },
    ]
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarOpen } = useSidebar()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => ({
    'Data Master': pathname.startsWith('/master'),
    'Transaksi': pathname.startsWith('/transactions'),
    'Laporan': pathname.startsWith('/reports'),
    'Settings': pathname.startsWith('/settings'),
  }))

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <aside className={clsx(
      "h-full bg-white flex flex-col overflow-y-auto transition-all duration-300",
      isSidebarOpen ? "w-64" : "w-20"
    )}>
      <div className={clsx("p-4 border-b border-gray-100 flex items-center gap-3", !isSidebarOpen && "justify-center")}>
        {isSidebarOpen ? (
          <div>
            <h1 className="text-lg font-bold text-indigo-600 leading-tight">
              Persediaan
            </h1>
            <p className="text-xs text-gray-500">Perkasa Networks</p>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            P
          </div>
        )}
      </div>

      <div className="px-3 py-4">
        {isSidebarOpen && (
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
            MAIN
          </p>
        )}
        
        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <div key={item.label} className="group relative">
              {item.subItems ? (
                <div>
                  {(() => {
                    const isAnyActive = item.subItems.some((s) => pathname === s.href || pathname.startsWith(`${s.href}/`))
                    
                    if (!isSidebarOpen) {
                      return (
                        <div className="relative">
                          <button
                            className={clsx(
                              "w-full flex justify-center p-3 rounded-md transition-colors",
                              isAnyActive ? "text-indigo-600 bg-indigo-50" : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
                            )}
                          >
                            <item.icon className="w-6 h-6" />
                          </button>
                          {/* Tooltip/Hover Menu for Mini Sidebar */}
                          <div className="absolute left-full top-0 ml-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                            <p className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">{item.label}</p>
                            {item.subItems.map((sub) => {
                              const isSubActive = pathname === sub.href
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  className={clsx(
                                    "block px-3 py-2 rounded-md text-sm transition-colors",
                                    isSubActive ? "text-indigo-600 bg-indigo-50 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
                                  )}
                                >
                                  {sub.label}
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }

                    return (
                      <>
                        <button
                          onClick={() => toggleMenu(item.label)}
                          className={clsx(
                            "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isAnyActive ? "text-indigo-600 bg-indigo-50" : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </div>
                          {openMenus[item.label] ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        {openMenus[item.label] && (
                          <div className="mt-1 ml-4 pl-4 border-l border-gray-100 space-y-1">
                            {item.subItems.map((sub) => {
                              const isSubActive = pathname === sub.href
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  className={clsx(
                                    "block px-3 py-2 rounded-md text-sm transition-colors",
                                    isSubActive ? "text-indigo-600 font-medium" : "text-gray-500 hover:text-indigo-600"
                                  )}
                                >
                                  {sub.label}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={clsx(
                    "flex items-center rounded-md transition-colors",
                    isSidebarOpen 
                      ? "px-3 py-2 gap-3 text-sm font-medium" 
                      : "justify-center p-3",
                    pathname === item.href 
                      ? "text-indigo-600 bg-indigo-50" 
                      : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                  )}
                >
                  <item.icon className={clsx(isSidebarOpen ? "w-5 h-5" : "w-6 h-6")} />
                  {isSidebarOpen && <span>{item.label}</span>}
                  
                  {!isSidebarOpen && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}
