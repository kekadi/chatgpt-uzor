'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { formatDate, daysOpen, getStatusColor } from '@/lib/utils'
import { Plus, RefreshCw, MessageSquareWarning } from 'lucide-react'

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ appealType: 'P2P', payer: '', service: '', p2pPhysician: '', referenceId: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/appeals')
    setAppeals(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateAppeal = async (id: string, updates: any) => {
    const params = new URLSearchParams({ id })
    await fetch(`/api/appeals?${params}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    load()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/appeals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setSaving(false)
    setShowNew(false)
    setForm({ appealType: 'P2P', payer: '', service: '', p2pPhysician: '', referenceId: '', notes: '' })
    load()
  }

  return (
    <div>
      <Header title="P2P & Appeal Log" />
      <div className="p-6">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { l: 'Total Appeals', v: appeals.length, c: 'bg-gray-100 text-gray-700' },
            { l: 'Pending / Scheduled', v: appeals.filter(a => ['Pending','Scheduled'].includes(a.status)).length, c: 'bg-orange-100 text-orange-700' },
            { l: 'Won', v: appeals.filter(a => a.status === 'Won').length, c: 'bg-green-100 text-green-700' },
            { l: 'Lost', v: appeals.filter(a => a.status === 'Lost').length, c: 'bg-red-100 text-red-700' }
          ].map(s => (
            <div key={s.l} className={`rounded-lg px-4 py-3 ${s.c}`}>
              <div className="text-xl font-bold">{s.v}</div>
              <div className="text-xs font-medium">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <MessageSquareWarning className="w-4 h-4 text-orange-500" /> All P2P / Appeal Records
          </h2>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
              <Plus className="w-4 h-4" /> New Appeal
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Appeal #','Reference','Type','Payer','Service','Status','P2P Physician','Scheduled','Completed','Days Open','Outcome','Assigned To','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={13} className="text-center py-12 text-gray-400">Loading...</td></tr>
                ) : appeals.length === 0 ? (
                  <tr><td colSpan={13} className="text-center py-12 text-gray-400">No appeals on record.</td></tr>
                ) : appeals.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{a.appealNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.referenceId || '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">{a.appealType}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{a.payer || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 max-w-[140px] truncate">{a.service || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(a.status)}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{a.p2pPhysician || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(a.scheduledDate)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(a.completedDate)}</td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700">{daysOpen(a.createdAt)}d</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{a.outcome || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{a.assignedTo?.name || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {['Pending','Scheduled'].includes(a.status) && (
                        <div className="flex gap-1">
                          <button onClick={() => updateAppeal(a.id, { status: 'Won', outcome: 'Approved after P2P' })}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Won</button>
                          <button onClick={() => updateAppeal(a.id, { status: 'Lost', outcome: 'Upheld' })}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Lost</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New appeal modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="font-semibold text-gray-800 mb-4">New Appeal / P2P Record</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Appeal Type</label>
                  <select value={form.appealType} onChange={e => setForm(p => ({...p, appealType: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>P2P</option><option>Written</option><option>External</option><option>IRO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PA / Ref Number</label>
                  <input value={form.referenceId} onChange={e => setForm(p => ({...p, referenceId: e.target.value}))} placeholder="PA-YYYY-XXXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payer *</label>
                  <input value={form.payer} onChange={e => setForm(p => ({...p, payer: e.target.value}))} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Service</label>
                  <input value={form.service} onChange={e => setForm(p => ({...p, service: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">P2P Physician</label>
                  <input value={form.p2pPhysician} onChange={e => setForm(p => ({...p, p2pPhysician: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 rounded-lg text-sm">
                  {saving ? 'Creating...' : 'Create Appeal'}
                </button>
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
