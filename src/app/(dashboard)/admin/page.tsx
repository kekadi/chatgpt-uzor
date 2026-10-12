'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/Header'
import { Settings, Users, Plus, Shield, Activity, Database } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function AdminPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const isAdmin = user?.role === 'admin'

  const [users, setUsers] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [tab, setTab] = useState<'users' | 'audit' | 'ecw'>('users')
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'staff', title: '' })
  const [saving, setSaving] = useState(false)
  const [ecwStatus, setEcwStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadUsers = () => fetch('/api/admin?resource=users').then(r => r.json()).then(setUsers)
  const loadAudit = () => fetch('/api/admin?resource=audit').then(r => r.json()).then(setAuditLogs)

  useEffect(() => {
    loadUsers()
    if (isAdmin) loadAudit()
  }, [isAdmin])

  const checkECW = async () => {
    setLoading(true)
    const res = await fetch('/api/ecw?action=health')
    setEcwStatus(await res.json())
    setLoading(false)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createUser', ...form })
    })
    if (res.ok) {
      setShowNew(false)
      setForm({ email: '', name: '', password: '', role: 'staff', title: '' })
      loadUsers()
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to create user')
    }
    setSaving(false)
  }

  const toggleUser = async (u: any) => {
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateUser', userId: u.id, active: !u.active })
    })
    loadUsers()
  }

  return (
    <div>
      <Header title="Administration" />
      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          {[['users', 'User Management', Users], ['audit', 'Audit Log', Activity], ['ecw', 'eCW Integration', Database]].map(([key, label, Icon]) => (
            <button key={key as string} onClick={() => setTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? 'bg-white shadow-sm text-brand-700' : 'text-gray-600 hover:text-gray-900'}`}>
              {/* @ts-ignore */}
              <Icon className="w-4 h-4" /> {label as string}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Users className="w-4 h-4" /> Staff Accounts</h3>
              {isAdmin && (
                <button onClick={() => setShowNew(true)}
                  className="flex items-center gap-1.5 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
                  <Plus className="w-4 h-4" /> Add User
                </button>
              )}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name','Email','Title','Role','Status','Created','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{u.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'supervisor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {isAdmin && u.id !== user?.id && (
                        <button onClick={() => toggleUser(u)}
                          className={`text-xs px-2 py-1 rounded font-medium transition ${u.active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'audit' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Shield className="w-4 h-4 text-green-500" /> HIPAA Audit Trail (Last 100 Events)</h3>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                  <tr>
                    {['Timestamp','User','Action','Resource','Resource ID','Details'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                      <td className="px-4 py-2 text-xs font-medium text-gray-700">{log.user?.name || 'System'}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${log.action === 'LOGIN' ? 'bg-blue-50 text-blue-700' : log.action.includes('CREATE') ? 'bg-green-50 text-green-700' : log.action === 'UPDATE' ? 'bg-yellow-50 text-yellow-700' : log.action === 'EXPORT' ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-600'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">{log.resource}</td>
                      <td className="px-4 py-2 text-xs font-mono text-gray-500 truncate max-w-[100px]">{log.resourceId || '—'}</td>
                      <td className="px-4 py-2 text-xs text-gray-500 max-w-xs truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'ecw' && (
          <div className="max-w-2xl space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-600" /> eClinicalWorks FHIR R4 Integration
              </h3>
              <p className="text-sm text-gray-500 mb-4">Standard: SMART on FHIR / OAuth 2.0 · FHIR Version: R4</p>

              <div className="space-y-3 mb-5">
                {[
                  ['Base URL', process.env.NEXT_PUBLIC_ECW_CONFIGURED === '1' ? 'Configured' : 'Not configured (set ECW_FHIR_BASE_URL)'],
                  ['Auth Method', 'OAuth 2.0 Client Credentials'],
                  ['Supported Resources', 'Patient, Encounter, Condition, MedicationRequest, Observation, Coverage, ServiceRequest'],
                  ['Registration', 'https://fhir.eclinicalworks.com/ecwopenapi/']
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <dt className="text-xs font-medium text-gray-500 w-36 shrink-0">{k}</dt>
                    <dd className="text-xs text-gray-700">{v}</dd>
                  </div>
                ))}
              </div>

              <button onClick={checkECW} disabled={loading}
                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
                <Database className="w-4 h-4" />
                {loading ? 'Testing...' : 'Test eCW Connection'}
              </button>

              {ecwStatus && (
                <div className={`mt-4 p-4 rounded-lg border text-sm ${ecwStatus.connected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <strong>{ecwStatus.connected ? '✅ Connected' : '❌ Connection Failed'}:</strong> {ecwStatus.message}
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
              <h4 className="font-semibold text-blue-800 mb-2">eCW API Approval Checklist</h4>
              <ul className="space-y-1.5 text-sm text-blue-700">
                {[
                  'Register at eCW Open API portal (fhir.eclinicalworks.com/ecwopenapi/)',
                  'Complete eCW API Partner Application form',
                  'Provide HIPAA Business Associate Agreement (BAA)',
                  'Complete security & compliance questionnaire',
                  'Test integration in eCW sandbox environment',
                  'Submit for production approval (2-4 weeks)',
                  'Configure .env.local with production credentials',
                  'Test patient sync and data flows'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-blue-200 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-semibold text-gray-800 mb-4">Add New Staff Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              {[
                { l: 'Full Name *', f: 'name', t: 'text', ph: 'Jane Smith' },
                { l: 'Email *', f: 'email', t: 'email', ph: 'jane@burlesongp.com' },
                { l: 'Job Title', f: 'title', t: 'text', ph: 'Referral Coordinator' },
                { l: 'Password *', f: 'password', t: 'password', ph: 'Min 8 characters' }
              ].map(fi => (
                <div key={fi.f}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{fi.l}</label>
                  <input type={fi.t} value={(form as any)[fi.f]} onChange={e => setForm(p => ({...p, [fi.f]: e.target.value}))} required={fi.l.includes('*')} placeholder={fi.ph}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="staff">Staff</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm">
                  {saving ? 'Creating...' : 'Create Account'}
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
