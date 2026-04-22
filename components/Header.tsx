'use client'

import React, { useMemo, useState, useRef, useEffect } from 'react'
import { User, LogOut, ChevronDown, ChevronRight } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MENU_ITEMS } from '@/components/Sidebar'

type CurrentUser = {
  id: number
  email: string
  name: string
  role: string
} | null

export function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const defaultOpenMenus = useMemo<Record<string, boolean>>(
    () => ({
      'Data Master': pathname.startsWith('/master'),
      'Transaksi': pathname.startsWith('/transactions'),
      'Laporan': pathname.startsWith('/reports'),
      'Settings': pathname.startsWith('/settings'),
    }),
    [pathname]
  )

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!mounted) return
        if (!res.ok) {
          setCurrentUser(null)
          return
        }
        const data = (await res.json()) as { user?: CurrentUser }
        setCurrentUser(data?.user ?? null)
      } catch {
        if (!mounted) return
        setCurrentUser(null)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const toggleMenuGroup = (label: string) => {
    setOpenMenus((prev) => {
      const current = prev[label] ?? defaultOpenMenus[label] ?? false
      return { ...prev, [label]: !current }
    })
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
        <img src="/logo-perkasa-new.png" alt="Perkasa Networks" className="h-11 w-auto object-contain" />
      </Link>

      <div className="flex items-center gap-3 flex-1 justify-end">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-semibold text-gray-700 border border-gray-200"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            Menu
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 overflow-hidden">
              <nav className="px-2">
                {MENU_ITEMS.map((item) => {
                  const Icon = item.icon
                  if (item.subItems?.length) {
                    const isAnyActive = item.subItems.some((s) => pathname === s.href || pathname.startsWith(`${s.href}/`))
                    const isOpen = openMenus[item.label] ?? defaultOpenMenus[item.label] ?? false
                    return (
                      <div key={item.label} className="mb-1">
                        <button
                          onClick={() => toggleMenuGroup(item.label)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isAnyActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${isAnyActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                            {item.label}
                          </span>
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="mt-1 ml-7 pl-3 border-l border-gray-100 space-y-1">
                            {item.subItems.map((sub) => {
                              const isSubActive = pathname === sub.href || pathname.startsWith(`${sub.href}/`)
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                                    isSubActive ? 'bg-indigo-50/60 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                                  }`}
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  {sub.label}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }

                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}
        </div>

        <div className="relative pl-2 border-l border-gray-200 ml-2" ref={dropdownRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
              {(currentUser?.name || currentUser?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-gray-700">{currentUser?.name || 'User'}</p>
              <p className="text-[10px] text-gray-500">
                {currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : '-'}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-900">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.email || '-'}</p>
              </div>
              <Link 
                href="/profile" 
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
