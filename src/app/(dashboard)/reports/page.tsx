'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Download, RefreshCw } from 'lucide-react'

const COLORS = ['#1d4ed8', '#059669', '#9333ea', '#d97706', '#dc2626', '#0891b2']

export default function ReportsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/reports')
    setData(await res.json())
    setLoading(false)
  }

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

  useEffect(() => { load() }, [])

  if (loading) return (
    <div>
      <Header title="Reports & KPI Dashboard" />
      <div className="flex items-center justify-center h-64 text-gray-400">Loading reports...</div>
    </div>
  )

  const s = data?.summary

  return (
    <div>
      <Header title="Reports & KPI Dashboard" />
      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-600" /> Practice Performance Overview
          </h2>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
            <button onClick={handleExport}
              className="flex items-center gap-1.5 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
              <Download className="w-4 h-4" /> Export Full Workbook
            </button>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Referrals', value: s?.totalReferrals, sub: `${s?.openReferrals} open`, color: 'border-blue-400' },
            { label: 'Overdue Referrals 🔴', value: s?.overdueReferrals, sub: `${s?.agingReferrals} aging 🟡`, color: 'border-red-400' },
            { label: 'PA Approval Rate', value: `${s?.approvalRate}%`, sub: `${s?.approvedPA} approved / ${s?.deniedPA} denied`, color: 'border-green-400' },
            { label: 'DME Orders Open', value: s?.openDME, sub: `${s?.overdueDME} overdue`, color: 'border-amber-400' },
            { label: 'Total Prior Auths', value: s?.totalPA, sub: `${s?.openPA} pending`, color: 'border-purple-400' },
            { label: 'Completed Referrals', value: s?.completedReferrals, sub: 'All time', color: 'border-green-400' },
            { label: 'DME Delivered', value: s?.deliveredDME, sub: 'Successfully closed', color: 'border-green-400' },
            { label: 'Appeals Won', value: s?.wonAppeals, sub: `${s?.totalAppeals} total · ${s?.pendingAppeals} pending`, color: 'border-orange-400' }
          ].map(k => (
            <div key={k.label} className={`bg-white rounded-xl border border-l-4 ${k.color} p-4 shadow-sm`}>
              <div className="text-2xl font-bold text-gray-900">{k.value}</div>
              <div className="text-sm font-medium text-gray-700 mt-0.5">{k.label}</div>
              <div className="text-xs text-gray-400 mt-1">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm">Monthly Volume Trend (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.monthly || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="referrals" fill="#1d4ed8" name="Referrals" radius={[3,3,0,0]} />
                <Bar dataKey="dme" fill="#059669" name="DME Orders" radius={[3,3,0,0]} />
                <Bar dataKey="pa" fill="#9333ea" name="Prior Auths" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm">Top Specialty Referrals</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={(data?.specialtyMap || []).slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="specialty" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#1d4ed8" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm">Referral Volume by Payer</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data?.payerRefMap || []} dataKey="count" nameKey="payer" cx="50%" cy="50%" outerRadius={90} label={({ payer, count }) => `${payer}: ${count}`} labelLine>
                  {(data?.payerRefMap || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm">PA Denial Rate by Payer</h3>
            <div className="space-y-2 overflow-y-auto max-h-52">
              {(data?.payerDenialMap || []).map((p: any) => (
                <div key={p.payer} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700 truncate">{p.payer}</span>
                      <span className="text-gray-500 ml-2">{p.denied}/{p.total} ({p.rate}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-2 rounded-full bg-red-400" style={{ width: `${Math.min(Number(p.rate), 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Staff productivity */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700 text-sm">Staff Productivity Dashboard</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Staff Member','Title','Referrals','Completed','Completion Rate','DME Assigned','DME Delivered','PA Assigned','PA Approved'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.staffStats || []).map((s: any, i: number) => (
                  <tr key={s.id} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.title}</td>
                    <td className="px-4 py-3 text-center font-medium text-blue-600">{s.referrals}</td>
                    <td className="px-4 py-3 text-center font-medium text-green-600">{s.completedReferrals}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.referrals > 0 && (s.completedReferrals/s.referrals)*100 >= 70 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {s.referrals ? `${((s.completedReferrals/s.referrals)*100).toFixed(0)}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-emerald-600">{s.dmeOrders}</td>
                    <td className="px-4 py-3 text-center font-medium text-green-600">{s.deliveredDME}</td>
                    <td className="px-4 py-3 text-center font-medium text-purple-600">{s.priorAuths}</td>
                    <td className="px-4 py-3 text-center font-medium text-green-600">{s.approvedPA}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
