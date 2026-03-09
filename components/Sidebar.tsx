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
    ]
  },
]

export function Sidebar() {
  const pathname = usePathname()
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
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-xl font-bold text-indigo-600 leading-tight">
          Persediaan Barang<br/>
          Perkasa Networks
        </h1>
      </div>

      <div className="px-4 py-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          MAIN
        </p>
        
        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <div key={item.label}>
              {item.subItems ? (
                <div>
                  {(() => {
                    const isAnyActive = item.subItems.some((s) => pathname === s.href || pathname.startsWith(`${s.href}/`))
                    return (
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
                    )
                  })()}
                  
                  {openMenus[item.label] && (
                    <div className="ml-9 mt-1 space-y-1">
                      {item.subItems.map((sub) => (
                        <Link 
                          key={sub.href} 
                          href={sub.href}
                          className={clsx(
                            "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                            pathname === sub.href
                              ? "text-indigo-600 bg-indigo-50"
                              : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                          )}
                        >
                          <div className="w-1.5 h-1.5 rounded-full border border-current opacity-60"></div>
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href 
                      ? "text-indigo-600 bg-indigo-50" 
                      : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}
