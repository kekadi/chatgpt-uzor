'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { formatDate, daysOpen, getAgingFlag, getStatusColor } from '@/lib/utils'
import { Plus, Search, RefreshCw, Clock } from 'lucide-react'

const STATUSES = ['all', 'Pending', 'Submitted', 'Approved', 'Denied', 'P2P', 'Appealed', 'Expired']

export default function PriorAuthPage() {
  const [pas, setPas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (search) params.set('search', search)
    const res = await fetch(`/api/prior-auth?${params}`)
    const data = await res.json()
    setPas(data)
    setLoading(false)
  }, [statusFilter, search])

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  return (
    <div>
      <Header title="Prior Authorization Management" />
      <div className="p-6">
        <div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient, service, PA #..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
            </select>
            <button onClick={load} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
          </div>
          <Link href="/prior-auth/new"
            className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm">
            <Plus className="w-4 h-4" /> New Prior Auth
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Pending', count: pas.filter(p => p.status === 'Pending').length, color: 'bg-gray-100 text-gray-700' },
            { label: 'Approved', count: pas.filter(p => p.status === 'Approved').length, color: 'bg-green-100 text-green-700' },
            { label: 'Denied', count: pas.filter(p => p.status === 'Denied').length, color: 'bg-red-100 text-red-700' },
            { label: 'In Appeal', count: pas.filter(p => ['P2P','Appealed'].includes(p.status)).length, color: 'bg-orange-100 text-orange-700' }
          ].map(s => (
            <div key={s.label} className={`rounded-lg px-4 py-3 ${s.color}`}>
              <div className="text-xl font-bold">{s.count}</div>
              <div className="text-xs font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['PA #','Patient','Type','Service','Payer','Urgency','Status','Auth #','Requested','Days Open','Denial Code','Assigned',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={13} className="text-center py-12 text-gray-400">Loading...</td></tr>
                ) : pas.length === 0 ? (
                  <tr><td colSpan={13} className="text-center py-12 text-gray-400">No prior authorizations found.</td></tr>
                ) : pas.map(p => {
                  const days = daysOpen(p.dateRequested)
                  const flag = getAgingFlag(p.dateRequested, p.urgency, p.status)
                  const isTerminal = ['Approved','Denied','Expired'].includes(p.status)
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 transition ${flag === 'red' && !isTerminal ? 'bg-red-50' : flag === 'yellow' && !isTerminal ? 'bg-yellow-50' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.paNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 whitespace-nowrap">{p.patient?.lastName}, {p.patient?.firstName}</div>
                        <div className="text-xs text-gray-500">{p.patient?.mrn}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{p.serviceType}</td>
                      <td className="px-4 py-3 text-xs text-gray-700 max-w-[160px] truncate">{p.service}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{p.payer || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{p.urgency}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">{p.authNumber || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(p.dateRequested)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {!isTerminal ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${flag === 'red' ? 'bg-red-100 text-red-700' : flag === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            <Clock className="w-3 h-3" />{days}d
                          </span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-red-600 font-mono">{p.denialCode || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{p.assignedTo?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <Link href={`/prior-auth/${p.id}`} className="text-purple-600 hover:text-purple-800 text-xs font-medium underline whitespace-nowrap">Edit</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            {pas.length} record{pas.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  )
}
