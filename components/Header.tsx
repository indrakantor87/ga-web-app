'use client'

import React from 'react'
import { Bell, Grid, Search, Menu } from 'lucide-react'
import { useSidebar } from './SidebarContext'
import Image from 'next/image'

export function Header() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/logo-perkasa-new.png" 
            alt="Perkasa Networks" 
            className="h-10 w-auto object-contain"
          />
          <span className="font-bold text-lg text-indigo-900 hidden md:block">
            Perkasa Networks
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 w-48 md:w-80">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search here..." 
            className="bg-transparent border-none outline-none text-sm w-full text-gray-600 placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 text-sm font-medium text-gray-600 cursor-pointer">
            <span>English</span>
          </div>

          <button className="text-gray-600 hover:text-gray-900">
            <Grid className="w-5 h-5" />
          </button>

          <button className="relative text-gray-600 hover:text-gray-900" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
              <span className="text-xs font-bold text-indigo-600">A</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
