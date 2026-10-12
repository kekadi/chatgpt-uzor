'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { PAYERS } from '@/lib/utils'

const SERVICE_TYPES = ['Referral', 'DME', 'Procedure', 'Medication', 'Lab', 'Imaging', 'Other']

export default function NewPriorAuthPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    patientId: '', serviceType: 'Referral', service: '', provider: '',
    payer: '', urgency: 'Routine', diagnosis: '', icdCode: '',
    cptCode: '', notes: ''
  })

  useEffect(() => {
    fetch('/api/patients').then(r => r.json()).then(setPatients)
  }, [])

  const set = (field: string) => (e: any) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    let payer = form.payer
    if (!payer && form.patientId) {
      const p = patients.find(pt => pt.id === form.patientId)
      if (p) payer = p.primaryIns
    }
    const res = await fetch('/api/prior-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, payer })
    })
    if (res.ok) {
      const pa = await res.json()
      router.push(`/prior-auth/${pa.id}`)
    } else {
      alert('Failed to create prior auth')
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Header title="New Prior Authorization" />
      <div className="p-6 max-w-3xl">
        <Link href="/prior-auth" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-500" /> New Prior Authorization Request
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                <select value={form.patientId} onChange={set('patientId')} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} — {p.mrn}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
                <select value={form.serviceType} onChange={set('serviceType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Description *</label>
                <input value={form.service} onChange={set('service')} required placeholder="e.g. Cardiology Consultation, CPAP Machine"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider / Facility</label>
                <input value={form.provider} onChange={set('provider')} placeholder="Rendering provider or facility"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                <select value={form.urgency} onChange={set('urgency')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option>Routine</option><option>Urgent</option><option>STAT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ICD-10 Code</label>
                <input value={form.icdCode} onChange={set('icdCode')} placeholder="e.g. I50.20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPT Code</label>
                <input value={form.cptCode} onChange={set('cptCode')} placeholder="e.g. 99243"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                <input value={form.diagnosis} onChange={set('diagnosis')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes / Medical Necessity</label>
                <textarea value={form.notes} onChange={set('notes')} rows={3}
                  placeholder="Document clinical justification, supporting criteria, failed alternatives..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">
                <ShieldCheck className="w-4 h-4" />{submitting ? 'Creating...' : 'Create Prior Auth'}
              </button>
              <Link href="/prior-auth" className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
