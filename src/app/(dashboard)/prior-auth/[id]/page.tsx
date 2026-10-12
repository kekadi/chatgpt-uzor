'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { ArrowLeft, Save, Clock, Plus } from 'lucide-react'
import { formatDate, daysOpen, getAgingFlag, getStatusColor, DENIAL_REASONS } from '@/lib/utils'

const STATUSES = ['Pending', 'Submitted', 'Approved', 'Denied', 'P2P', 'Appealed', 'Expired']

export default function PriorAuthDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [pa, setPa] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<any>({})
  const [showAppeal, setShowAppeal] = useState(false)
  const [appealForm, setAppealForm] = useState({ appealType: 'P2P', p2pPhysician: 'Dr. Robert Chen', notes: '', payer: '' })

  useEffect(() => {
    fetch(`/api/prior-auth/${id}`).then(r => r.json()).then(data => {
      setPa(data)
      setForm({
        status: data.status, authNumber: data.authNumber, denialReason: data.denialReason,
        denialCode: data.denialCode, notes: data.notes
      })
      setAppealForm(prev => ({ ...prev, payer: data.payer || '' }))
      setLoading(false)
    })
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/prior-auth/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      const updated = await res.json()
      setPa(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const handleCreateAppeal = async () => {
    const res = await fetch('/api/appeals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...appealForm,
        priorAuthId: id,
        referenceId: pa.paNumber,
        service: pa.service,
        payer: pa.payer
      })
    })
    if (res.ok) {
      await fetch(`/api/prior-auth/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'P2P' })
      })
      router.push('/appeals')
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full"></div></div>
  if (!pa) return <div>Not found</div>

  const flag = getAgingFlag(pa.dateRequested, pa.urgency, pa.status)
  const days = daysOpen(pa.dateRequested)

  return (
    <div>
      <Header title="Prior Auth Detail" />
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/prior-auth" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft className="w-4 h-4" /> Back</Link>
          <div className="h-4 border-l border-gray-300" />
          <h2 className="font-semibold text-gray-800">{pa.paNumber}</h2>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(pa.status)}`}>{pa.status}</span>
          {!['Approved','Denied','Expired'].includes(pa.status) && (
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${flag === 'red' ? 'bg-red-100 text-red-700' : flag === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
              <Clock className="w-3 h-3" /> {days}d
            </span>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Patient</h3>
            <dl className="space-y-2">
              {[['Name',`${pa.patient.lastName}, ${pa.patient.firstName}`],['MRN',pa.patient.mrn],['DOB',pa.patient.dob],['Insurance',pa.patient.primaryIns]].map(([l,v]) => (
                <div key={l} className="flex gap-2"><dt className="text-xs text-gray-500 w-20 shrink-0">{l}</dt><dd className="text-xs font-medium text-gray-800">{v||'—'}</dd></div>
              ))}
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Authorization Details</h3>
            <dl className="space-y-2">
              {[['Type',pa.serviceType],['Service',pa.service],['Provider',pa.provider],['Payer',pa.payer],['Urgency',pa.urgency],['ICD-10',pa.icdCode],['CPT',pa.cptCode],['Requested',formatDate(pa.dateRequested)],['Submitted',formatDate(pa.dateSubmitted)],['Decision',formatDate(pa.dateDecision)],['Expires',formatDate(pa.expirationDate)]].map(([l,v]) => (
                <div key={l} className="flex gap-2"><dt className="text-xs text-gray-500 w-24 shrink-0">{l}</dt><dd className="text-xs font-medium text-gray-800">{v||'—'}</dd></div>
              ))}
            </dl>
            {pa.status === 'Denied' && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => setShowAppeal(true)}
                  className="w-full flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold py-2 rounded-lg transition">
                  <Plus className="w-3.5 h-3.5" /> Initiate P2P / Appeal
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Update PA</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm((p: any) => ({...p, status: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Auth Number</label>
              <input value={form.authNumber || ''} onChange={e => setForm((p: any) => ({...p, authNumber: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            {['Denied','P2P'].includes(form.status) && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Denial Code</label>
                  <input value={form.denialCode || ''} onChange={e => setForm((p: any) => ({...p, denialCode: e.target.value}))} placeholder="CO-50, PR-96, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Denial Reason</label>
                  <select value={form.denialReason || ''} onChange={e => setForm((p: any) => ({...p, denialReason: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Select...</option>
                    {DENIAL_REASONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea value={form.notes || ''} onChange={e => setForm((p: any) => ({...p, notes: e.target.value}))} rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            </div>
            <button onClick={handleSave} disabled={saving}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${saved ? 'bg-green-600 text-white' : 'bg-purple-700 hover:bg-purple-800 text-white'}`}>
              <Save className="w-4 h-4" />{saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Appeals */}
        {pa.appeals?.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Appeals on this PA</h3>
            <div className="space-y-2">
              {pa.appeals.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                  <span className="font-mono text-xs text-gray-500">{a.appealNumber}</span>
                  <span className="text-gray-700">{a.appealType}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(a.status)}`}>{a.status}</span>
                  <span className="text-xs text-gray-500">{formatDate(a.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appeal modal */}
        {showAppeal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="font-semibold text-gray-800 mb-4">Initiate Appeal / P2P</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Appeal Type</label>
                  <select value={appealForm.appealType} onChange={e => setAppealForm(p => ({...p, appealType: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>P2P</option><option>Written</option><option>External</option><option>IRO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Requesting Physician</label>
                  <input value={appealForm.p2pPhysician} onChange={e => setAppealForm(p => ({...p, p2pPhysician: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea value={appealForm.notes} onChange={e => setAppealForm(p => ({...p, notes: e.target.value}))} rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleCreateAppeal}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 rounded-lg text-sm">
                  Create Appeal
                </button>
                <button onClick={() => setShowAppeal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
