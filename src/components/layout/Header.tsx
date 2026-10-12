'use client'

import { useSession, signOut } from 'next-auth/react'
import { Bell, LogOut, User, Download } from 'lucide-react'
import { useState } from 'react'

export function Header({ title }: { title?: string }) {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const user = session?.user as any

  const handleExport = async () => {
    const res = await fetch('/api/export/excel')
    if (!res.ok) return alert('Export failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BurlesonGP-CRM-${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div>
        {title && <h1 className="text-lg font-semibold text-gray-800">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
          title="Export Excel Workbook"
        >
          <Download className="w-3.5 h-3.5" />
          Export Excel
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition"
          >
            <div className="w-7 h-7 bg-brand-700 rounded-full flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-brand-100 text-brand-700 text-xs rounded-full capitalize font-medium">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
