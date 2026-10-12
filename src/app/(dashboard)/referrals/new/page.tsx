'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { SPECIALTIES, PAYERS } from '@/lib/utils'

export default function NewReferralPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    patientId: '', referringProvider: 'Dr. Robert Chen', specialty: '',
    specialist: '', urgency: 'Routine', diagnosis: '', icdCode: '',
    payer: '', authRequired: false, notes: '', assignedToId: ''
  })

  useEffect(() => {
    fetch('/api/patients').then(r => r.json()).then(setPatients)
    fetch('/api/admin?resource=users').then(r => r.json()).then(setUsers)
  }, [])

  const set = (field: string) => (e: any) => setForm(p => ({ ...p, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patientId) return alert('Please select a patient')
    if (!form.specialty) return alert('Please select a specialty')
    setSubmitting(true)

    // Auto-fill payer from patient
    let payer = form.payer
    if (!payer && form.patientId) {
      const p = patients.find(pt => pt.id === form.patientId)
      if (p) payer = p.primaryIns
    }

    const res = await fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, payer })
    })
    if (res.ok) {
      const referral = await res.json()
      router.push(`/referrals/${referral.id}`)
    } else {
      alert('Failed to create referral')
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Header title="New Referral" />
      <div className="p-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/referrals" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Referrals
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-500" /> Create New Referral
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                <select value={form.patientId} onChange={set('patientId')} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select patient...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} — MRN: {p.mrn} ({p.primaryIns})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referring Provider *</label>
                <input value={form.referringProvider} onChange={set('referringProvider')} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty *</label>
                <select value={form.specialty} onChange={set('specialty')} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select specialty...</option>
                  {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialist Name / Practice</label>
                <input value={form.specialist} onChange={set('specialist')} placeholder="Dr. Name — Practice (if known)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency *</label>
                <select value={form.urgency} onChange={set('urgency')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option>Routine</option>
                  <option>Urgent</option>
                  <option>STAT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payer</label>
                <select value={form.payer} onChange={set('payer')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Auto from patient insurance</option>
                  {PAYERS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                <input value={form.diagnosis} onChange={set('diagnosis')} placeholder="Primary diagnosis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ICD-10 Code</label>
                <input value={form.icdCode} onChange={set('icdCode')} placeholder="e.g. I50.20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select value={form.assignedToId} onChange={set('assignedToId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Self (current user)</option>
                  {users.filter((u: any) => u.role !== 'admin').map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} — {u.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="authRequired" checked={form.authRequired} onChange={set('authRequired')} className="w-4 h-4" />
                <label htmlFor="authRequired" className="text-sm font-medium text-gray-700">Prior Authorization Required</label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
                <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Clinical reason, relevant history, specific requests..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">
                <Send className="w-4 h-4" />
                {submitting ? 'Creating...' : 'Create Referral'}
              </button>
              <Link href="/referrals"
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
