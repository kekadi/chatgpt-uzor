'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { formatDate, daysOpen, getAgingFlag, getStatusColor, getUrgencyColor } from '@/lib/utils'
import { Plus, Search, Filter, RefreshCw, Clock, ChevronDown } from 'lucide-react'

const STATUSES = ['all', 'Pending', 'Sent', 'Scheduled', 'Completed', 'Denied', 'Cancelled']

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (search) params.set('search', search)
    const res = await fetch(`/api/referrals?${params}`)
    const data = await res.json()
    setReferrals(data)
    setLoading(false)
  }, [statusFilter, search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const overdueCount = referrals.filter(r => !['Completed','Cancelled'].includes(r.status) && getAgingFlag(r.dateOrdered, r.urgency, r.status) === 'red').length

  return (
    <div>
      <Header title="Referral Management" />
      <div className="p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, MRN, specialty..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
            </select>

            <button onClick={load} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {overdueCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                <Clock className="w-3.5 h-3.5" /> {overdueCount} Overdue
              </span>
            )}
            <Link
              href="/referrals/new"
              className="flex items-center gap-1.5 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Referral
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Ref #','Patient','Specialty','Specialist','Urgency','Status','Payer','Ordered','Days Open','Assigned To','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={11} className="text-center py-12 text-gray-400">Loading...</td></tr>
                ) : referrals.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-12 text-gray-400">No referrals found.</td></tr>
                ) : referrals.map((r, i) => {
                  const days = daysOpen(r.dateOrdered)
                  const flag = getAgingFlag(r.dateOrdered, r.urgency, r.status)
                  const isTerminal = ['Completed','Cancelled'].includes(r.status)
                  return (
                    <tr key={r.id}
                      className={`hover:bg-gray-50 transition ${flag === 'red' && !isTerminal ? 'bg-red-50 hover:bg-red-100' : flag === 'yellow' && !isTerminal ? 'bg-yellow-50 hover:bg-yellow-100' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{r.refNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 whitespace-nowrap">{r.patient?.lastName}, {r.patient?.firstName}</div>
                        <div className="text-xs text-gray-500">{r.patient?.mrn}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.specialty}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap max-w-[140px] truncate">{r.specialist || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(r.urgency)}`}>{r.urgency}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{r.payer || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(r.dateOrdered)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {!isTerminal ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${flag === 'red' ? 'bg-red-100 text-red-700' : flag === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            <Clock className="w-3 h-3" />{days}d
                          </span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{r.assignedTo?.name || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/referrals/${r.id}`} className="text-brand-600 hover:text-brand-800 text-xs font-medium underline">
                          View / Edit
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
            <span>Showing {referrals.length} record{referrals.length !== 1 ? 's' : ''}</span>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-200 inline-block"></span>Overdue</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-200 inline-block"></span>Aging</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
