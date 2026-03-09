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
      "h-full bg-white flex flex-col overflow-y-auto transition-all duration-300 shadow-sm border-r border-gray-100",
      isSidebarOpen ? "w-64" : "w-20"
    )}>
      <div className={clsx("h-16 flex items-center gap-3 border-b border-gray-100", 
        isSidebarOpen ? "px-6" : "justify-center"
      )}>
        {isSidebarOpen ? (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo-perkasa-new.png" 
              alt="Perkasa Networks" 
              className="h-10 w-auto object-contain"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo-perkasa-new.png" 
              alt="Perkasa" 
              className="h-8 w-auto object-contain"
            />
          </div>
        )}
      </div>

      <div className="flex-1 py-6 px-3 space-y-1">
        {isSidebarOpen && (
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Menu Utama
          </p>
        )}
        
        <nav className="space-y-1.5">
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
                              "w-full flex justify-center p-3 rounded-xl transition-all duration-200",
                              isAnyActive 
                                ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            )}
                          >
                            <item.icon className="w-5 h-5" />
                          </button>
                          {/* Tooltip/Hover Menu for Mini Sidebar */}
                          <div className="absolute left-full top-0 ml-3 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.label}</p>
                            </div>
                            <div className="p-2 space-y-1">
                              {item.subItems.map((sub) => {
                                const isSubActive = pathname === sub.href
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    className={clsx(
                                      "block px-3 py-2 rounded-lg text-sm transition-colors",
                                      isSubActive 
                                        ? "bg-indigo-50 text-indigo-600 font-medium" 
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                  >
                                    {sub.label}
                                  </Link>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <>
                        <button
                          onClick={() => toggleMenu(item.label)}
                          className={clsx(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                            isAnyActive 
                              ? "bg-indigo-50 text-indigo-600" 
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={clsx("w-5 h-5", isAnyActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")} />
                            <span>{item.label}</span>
                          </div>
                          {openMenus[item.label] ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
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
                                    "block px-3 py-2 rounded-lg text-sm transition-colors",
                                    isSubActive 
                                      ? "text-indigo-600 font-medium bg-indigo-50/50" 
                                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
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
                    "flex items-center rounded-xl transition-all duration-200 group",
                    isSidebarOpen 
                      ? "px-3 py-2.5 gap-3 text-sm font-medium" 
                      : "justify-center p-3",
                    pathname === item.href 
                      ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className={clsx(
                    "transition-colors",
                    isSidebarOpen ? "w-5 h-5" : "w-5 h-5",
                    pathname === item.href ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  {isSidebarOpen && <span>{item.label}</span>}
                  
                  {!isSidebarOpen && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                      {item.label}
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
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
