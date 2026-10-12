'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Search, RefreshCw, Plus, Users } from 'lucide-react'

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ mrn: '', firstName: '', lastName: '', dob: '', phone: '', address: '', city: 'Burleson', state: 'TX', zip: '76028', primaryIns: 'Medicare', insId: '', provider: 'Dr. Robert Chen' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const res = await fetch(`/api/patients?${params}`)
    setPatients(await res.json())
    setLoading(false)
  }, [search])

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      setShowNew(false)
      setForm({ mrn: '', firstName: '', lastName: '', dob: '', phone: '', address: '', city: 'Burleson', state: 'TX', zip: '76028', primaryIns: 'Medicare', insId: '', provider: 'Dr. Robert Chen' })
      load()
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to create patient')
    }
    setSaving(false)
  }

  const set = (f: string) => (e: any) => setForm(p => ({ ...p, [f]: e.target.value }))

  return (
    <div>
      <Header title="Patient Registry" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, MRN, phone..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64" />
            </div>
            <button onClick={load} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm">
            <Plus className="w-4 h-4" /> Add Patient
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['MRN','Patient Name','DOB','Phone','Primary Insurance','Ins ID','Provider','City','Referrals','DME','PA'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={11} className="text-center py-12 text-gray-400">Loading...</td></tr>
                ) : patients.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-12 text-gray-400">No patients found.</td></tr>
                ) : patients.map((p, i) => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs font-medium text-brand-600">{p.mrn}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 whitespace-nowrap">{p.lastName}, {p.firstName}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{p.dob}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{p.phone || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{p.primaryIns || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.insId || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{p.provider || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.city}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{p.referrals?.length || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{p.dmeOrders?.length || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{p.priorAuths?.length || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">{patients.length} patient{patients.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-brand-600" /> Add New Patient</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">MRN *</label>
                  <input value={form.mrn} onChange={set('mrn')} required placeholder="BGP-XXXXXX" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Provider</label>
                  <input value={form.provider} onChange={set('provider')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                  <input value={form.firstName} onChange={set('firstName')} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
                  <input value={form.lastName} onChange={set('lastName')} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth *</label>
                  <input type="date" value={form.dob} onChange={set('dob')} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input value={form.phone} onChange={set('phone')} placeholder="817-555-0100" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                  <input value={form.address} onChange={set('address')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Primary Insurance *</label>
                  <input value={form.primaryIns} onChange={set('primaryIns')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Insurance ID</label>
                  <input value={form.insId} onChange={set('insId')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm">
                  {saving ? 'Saving...' : 'Add Patient'}
                </button>
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
