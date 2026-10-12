'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'
import { PAYERS, DME_EQUIPMENT } from '@/lib/utils'

export default function NewDMEPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    patientId: '', equipment: '', vendor: '', urgency: 'Routine',
    diagnosis: '', icdCode: '', payer: '', authRequired: true,
    quantity: 1, notes: '', assignedToId: ''
  })

  useEffect(() => {
    fetch('/api/patients').then(r => r.json()).then(setPatients)
    fetch('/api/directory?type=vendors').then(r => r.json()).then(setVendors)
  }, [])

  const set = (field: string) => (e: any) => setForm(p => ({ ...p, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    let payer = form.payer
    if (!payer && form.patientId) {
      const p = patients.find(pt => pt.id === form.patientId)
      if (p) payer = p.primaryIns
    }
    const res = await fetch('/api/dme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, payer })
    })
    if (res.ok) {
      const order = await res.json()
      router.push(`/dme/${order.id}`)
    } else {
      alert('Failed to create DME order')
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Header title="New DME Order" />
      <div className="p-6 max-w-3xl">
        <Link href="/dme" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to DME Orders
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-500" /> New DME Order
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                <select value={form.patientId} onChange={set('patientId')} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} — MRN: {p.mrn}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment *</label>
                <select value={form.equipment} onChange={set('equipment')} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select equipment...</option>
                  {DME_EQUIPMENT.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Vendor</label>
                <select value={form.vendor} onChange={set('vendor')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select vendor...</option>
                  {vendors.map((v: any) => <option key={v.id} value={v.name}>{v.name} — {v.city}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                <select value={form.urgency} onChange={set('urgency')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option>Routine</option><option>Urgent</option><option>STAT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payer</label>
                <select value={form.payer} onChange={set('payer')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Auto from patient</option>
                  {PAYERS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                <input value={form.diagnosis} onChange={set('diagnosis')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ICD-10 Code</label>
                <input value={form.icdCode} onChange={set('icdCode')} placeholder="e.g. G47.33"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" min="1" value={form.quantity} onChange={set('quantity')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="authReq" checked={form.authRequired} onChange={set('authRequired')} className="w-4 h-4" />
                <label htmlFor="authReq" className="text-sm font-medium text-gray-700">Prior Authorization Required</label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes / Medical Necessity</label>
                <textarea value={form.notes} onChange={set('notes')} rows={3}
                  placeholder="Document medical necessity, failed conservative treatment, clinical justification..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">
                <Package className="w-4 h-4" />{submitting ? 'Creating...' : 'Create DME Order'}
              </button>
              <Link href="/dme" className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
