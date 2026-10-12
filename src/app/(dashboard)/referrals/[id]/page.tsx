'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { formatDate, daysOpen, getAgingFlag, getStatusColor, PAYERS, SPECIALTIES, DENIAL_REASONS } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Save, Clock } from 'lucide-react'

const STATUSES = ['Pending', 'Sent', 'Scheduled', 'Completed', 'Denied', 'Cancelled']

export default function ReferralDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [referral, setReferral] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/referrals/${id}`)
      .then(r => r.json())
      .then(data => {
        setReferral(data)
        setFormData({
          status: data.status,
          specialist: data.specialist,
          authNumber: data.authNumber,
          notes: data.notes,
          denialReason: data.denialReason,
          assignedToId: data.assignedToId
        })
        setLoading(false)
      })
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/referrals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    if (res.ok) {
      const updated = await res.json()
      setReferral(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full"></div></div>
  if (!referral) return <div>Not found</div>

  const flag = getAgingFlag(referral.dateOrdered, referral.urgency, referral.status)
  const days = daysOpen(referral.dateOrdered)

  return (
    <div>
      <Header title="Referral Detail" />
      <div className="p-6 max-w-4xl">
        {/* Back + header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/referrals" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="h-4 border-l border-gray-300" />
          <h2 className="font-semibold text-gray-800">{referral.refNumber}</h2>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(referral.status)}`}>{referral.status}</span>
          {!['Completed','Cancelled'].includes(referral.status) && (
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${flag === 'red' ? 'bg-red-100 text-red-700' : flag === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
              <Clock className="w-3 h-3" /> {days} days open
            </span>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Patient info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Patient Information</h3>
            <dl className="space-y-2">
              {[
                ['Name', `${referral.patient.lastName}, ${referral.patient.firstName}`],
                ['MRN', referral.patient.mrn],
                ['DOB', referral.patient.dob],
                ['Phone', referral.patient.phone],
                ['Insurance', referral.patient.primaryIns],
                ['Ins ID', referral.patient.insId],
                ['Provider', referral.patient.provider]
              ].map(([label, val]) => (
                <div key={label} className="flex gap-2">
                  <dt className="text-xs text-gray-500 w-20 shrink-0">{label}</dt>
                  <dd className="text-xs font-medium text-gray-800">{val || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Referral info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Referral Info</h3>
            <dl className="space-y-2">
              {[
                ['Specialty', referral.specialty],
                ['Urgency', referral.urgency],
                ['Provider', referral.referringProvider],
                ['Diagnosis', referral.diagnosis],
                ['ICD-10', referral.icdCode],
                ['Payer', referral.payer],
                ['Auth Req', referral.authRequired ? 'Yes' : 'No'],
                ['Ordered', formatDate(referral.dateOrdered)],
                ['Sent', formatDate(referral.dateSent)],
                ['Scheduled', formatDate(referral.dateScheduled)],
                ['Completed', formatDate(referral.dateCompleted)]
              ].map(([label, val]) => (
                <div key={label} className="flex gap-2">
                  <dt className="text-xs text-gray-500 w-20 shrink-0">{label}</dt>
                  <dd className="text-xs font-medium text-gray-800">{val || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Edit panel */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Update Referral</h3>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData((p: any) => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Specialist Name</label>
              <input value={formData.specialist || ''} onChange={e => setFormData((p: any) => ({ ...p, specialist: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Dr. Name — Practice" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Auth Number</label>
              <input value={formData.authNumber || ''} onChange={e => setFormData((p: any) => ({ ...p, authNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="AUTH-XXXXX" />
            </div>

            {formData.status === 'Denied' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Denial Reason</label>
                <select value={formData.denialReason || ''} onChange={e => setFormData((p: any) => ({ ...p, denialReason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select reason...</option>
                  {DENIAL_REASONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea value={formData.notes || ''} onChange={e => setFormData((p: any) => ({ ...p, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="Add notes..." />
            </div>

            <button onClick={handleSave} disabled={saving}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${saved ? 'bg-green-600 text-white' : 'bg-brand-700 hover:bg-brand-800 text-white'}`}>
              <Save className="w-4 h-4" />
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
