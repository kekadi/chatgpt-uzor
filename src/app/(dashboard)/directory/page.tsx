'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Search, MapPin, Phone, Printer, Star } from 'lucide-react'

export default function DirectoryPage() {
  const [specialists, setSpecialists] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [tab, setTab] = useState<'specialists' | 'vendors'>('specialists')
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [loading, setLoading] = useState(true)
  const [specialties, setSpecialties] = useState<string[]>([])

  const load = async () => {
    setLoading(true)
    const [sRes, vRes] = await Promise.all([
      fetch(`/api/directory?type=specialists${search ? '&search=' + search : ''}${specialty ? '&specialty=' + specialty : ''}`),
      fetch(`/api/directory?type=vendors${search ? '&search=' + search : ''}`)
    ])
    const [s, v] = await Promise.all([sRes.json(), vRes.json()])
    setSpecialists(s)
    setVendors(v)
    const uniqueSpecialties = [...new Set(s.map((x: any) => x.specialty))] as string[]
    setSpecialties(uniqueSpecialties.sort())
    setLoading(false)
  }

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [search, specialty])

  return (
    <div>
      <Header title="Burleson Area Directory" />
      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
          <button onClick={() => setTab('specialists')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'specialists' ? 'bg-white shadow-sm text-brand-700' : 'text-gray-600 hover:text-gray-900'}`}>
            Specialists ({specialists.length})
          </button>
          <button onClick={() => setTab('vendors')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'vendors' ? 'bg-white shadow-sm text-brand-700' : 'text-gray-600 hover:text-gray-900'}`}>
            Vendors / Suppliers ({vendors.length})
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'specialists' ? 'Search name, specialty, city...' : 'Search vendor, category...'}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-72" />
          </div>
          {tab === 'specialists' && (
            <select value={specialty} onChange={e => setSpecialty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">All Specialties</option>
              {specialties.map(s => <option key={s}>{s}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading directory...</div>
        ) : tab === 'specialists' ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {specialists.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.name}</h3>
                    <span className="inline-block mt-0.5 text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{s.specialty}</span>
                  </div>
                  <div className="flex gap-1">
                    {s.acceptMedicare && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Medicare</span>}
                    {s.acceptMedicaid && <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">Medicaid</span>}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-2">{s.practice}</p>

                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{s.address}, {s.city}, {s.state} {s.zip}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <a href={`tel:${s.phone}`} className="text-brand-600 hover:underline">{s.phone}</a>
                    {s.fax && <span className="ml-2 flex items-center gap-1"><Printer className="w-3.5 h-3.5" />Fax: {s.fax}</span>}
                  </div>
                  {s.waitTime && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>Avg wait: {s.waitTime}</span>
                    </div>
                  )}
                </div>

                {s.network && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500"><span className="font-medium">Network:</span> {s.network}</p>
                  </div>
                )}

                {s.notes && (
                  <p className="mt-2 text-xs text-gray-500 italic">{s.notes}</p>
                )}
              </div>
            ))}
            {specialists.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No specialists found.</div>}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vendors.map(v => (
              <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{v.name}</h3>
                  <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{v.category}</span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{v.city}, {v.state}</div>
                  <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />
                    <a href={`tel:${v.phone}`} className="text-brand-600 hover:underline">{v.phone}</a>
                  </div>
                  {v.contact && <div className="text-gray-600">Contact: {v.contact}</div>}
                  {v.acceptMedicare && <span className="inline-block bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-xs font-medium">Accepts Medicare</span>}
                </div>

                {v.notes && <p className="mt-3 text-xs text-gray-500 italic border-t border-gray-100 pt-2">{v.notes}</p>}
              </div>
            ))}
            {vendors.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No vendors found.</div>}
          </div>
        )}
      </div>
    </div>
  )
}
