'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { ArrowLeft, Save, Clock } from 'lucide-react'
import { formatDate, daysOpen, getAgingFlag, getStatusColor, DENIAL_REASONS } from '@/lib/utils'

const STATUSES = ['Pending', 'Ordered', 'Delivered', 'Denied', 'Cancelled']

export default function DMEDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    fetch(`/api/dme/${id}`).then(r => r.json()).then(data => {
      setOrder(data)
      setForm({ status: data.status, vendor: data.vendor, authNumber: data.authNumber, notes: data.notes, denialReason: data.denialReason })
      setLoading(false)
    })
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/dme/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      const updated = await res.json()
      setOrder(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full"></div></div>
  if (!order) return <div>Not found</div>

  const flag = getAgingFlag(order.dateOrdered, order.urgency, order.status)
  const days = daysOpen(order.dateOrdered)

  return (
    <div>
      <Header title="DME Order Detail" />
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dme" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft className="w-4 h-4" /> Back</Link>
          <div className="h-4 border-l border-gray-300" />
          <h2 className="font-semibold text-gray-800">{order.orderNumber}</h2>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>{order.status}</span>
          {!['Delivered','Cancelled'].includes(order.status) && (
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${flag === 'red' ? 'bg-red-100 text-red-700' : flag === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
              <Clock className="w-3 h-3" /> {days}d
            </span>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Patient</h3>
            <dl className="space-y-2">
              {[['Name', `${order.patient.lastName}, ${order.patient.firstName}`], ['MRN', order.patient.mrn], ['DOB', order.patient.dob], ['Phone', order.patient.phone], ['Insurance', order.patient.primaryIns]].map(([l,v]) => (
                <div key={l} className="flex gap-2"><dt className="text-xs text-gray-500 w-20 shrink-0">{l}</dt><dd className="text-xs font-medium text-gray-800">{v || '—'}</dd></div>
              ))}
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Order Details</h3>
            <dl className="space-y-2">
              {[['Equipment', order.equipment], ['Urgency', order.urgency], ['Qty', order.quantity], ['Payer', order.payer], ['Auth Req', order.authRequired ? 'Yes' : 'No'], ['ICD-10', order.icdCode], ['Ordered', formatDate(order.dateOrdered)], ['Submitted', formatDate(order.dateSubmitted)], ['Delivered', formatDate(order.dateDelivered)]].map(([l,v]) => (
                <div key={l} className="flex gap-2"><dt className="text-xs text-gray-500 w-24 shrink-0">{l}</dt><dd className="text-xs font-medium text-gray-800">{v || '—'}</dd></div>
              ))}
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Update Order</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm((p: any) => ({...p, status: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vendor</label>
              <input value={form.vendor || ''} onChange={e => setForm((p: any) => ({...p, vendor: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Auth Number</label>
              <input value={form.authNumber || ''} onChange={e => setForm((p: any) => ({...p, authNumber: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            {form.status === 'Denied' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Denial Reason</label>
                <select value={form.denialReason || ''} onChange={e => setForm((p: any) => ({...p, denialReason: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select...</option>
                  {DENIAL_REASONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea value={form.notes || ''} onChange={e => setForm((p: any) => ({...p, notes: e.target.value}))} rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            </div>
            <button onClick={handleSave} disabled={saving}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${saved ? 'bg-green-600 text-white' : 'bg-emerald-700 hover:bg-emerald-800 text-white'}`}>
              <Save className="w-4 h-4" />{saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
