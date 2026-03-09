'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bell, Search, Menu, User, LogOut, ChevronDown } from 'lucide-react'
import { useSidebar } from './SidebarContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function Header() {
  const { toggleSidebar } = useSidebar()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

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
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex flex-col">
          <span className="font-bold text-lg text-indigo-900 leading-tight">
            Inventory
          </span>
          <span className="text-xs text-gray-500 font-medium">
            Perkasa Networks
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center bg-gray-50 rounded-lg px-3 py-2 w-48 md:w-80">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search here..." 
            className="bg-transparent border-none outline-none text-sm w-full text-gray-600 placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 inline-flex h-2 w-2 rounded-full bg-rose-600 ring-2 ring-white"></span>
          </button>

          <div className="relative pl-2 border-l border-gray-200 ml-2" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1.5 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                D
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-gray-700">Developer</p>
                <p className="text-[10px] text-gray-500">Admin</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-sm font-semibold text-gray-900">Developer</p>
                  <p className="text-xs text-gray-500 truncate">developer@perkasa.net.id</p>
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
      </div>
    </header>
  )
}
