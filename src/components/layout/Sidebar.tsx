'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Send, Package, ShieldCheck, MessageSquareWarning,
  Users, BarChart3, BookOpen, MapPin, Settings, Heart, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/referrals', label: 'Referrals', icon: Send },
  { href: '/dme', label: 'DME Orders', icon: Package },
  { href: '/prior-auth', label: 'Prior Auth', icon: ShieldCheck },
  { href: '/appeals', label: 'P2P / Appeals', icon: MessageSquareWarning },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/reports', label: 'Reports & KPIs', icon: BarChart3 },
  { href: '/directory', label: 'Directory', icon: MapPin },
  { href: '/sop', label: 'SOP & Policies', icon: BookOpen },
  { href: '/admin', label: 'Admin', icon: Settings }
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-brand-900 text-white transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-brand-800">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
          <Heart className="w-5 h-5 text-brand-700" strokeWidth={1.5} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">Burleson Geriatric</p>
            <p className="text-xs text-brand-300 truncate">Primary Care CRM</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <ul className="space-y-0.5 px-2">
          {nav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group',
                    active
                      ? 'bg-white text-brand-900 font-semibold shadow-sm'
                      : 'text-brand-200 hover:bg-brand-800 hover:text-white'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn('w-4.5 h-4.5 shrink-0', active ? 'text-brand-700' : 'text-brand-400 group-hover:text-white')} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-brand-800 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-brand-400 hover:bg-brand-800 hover:text-white transition"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
