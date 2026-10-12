import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getAgingFlag, formatDate, daysOpen } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import {
  Send, Package, ShieldCheck, MessageSquareWarning,
  AlertTriangle, CheckCircle2, Clock, TrendingUp,
  Users, ArrowRight
} from 'lucide-react'

async function getDashboardData() {
  const [referrals, dmeOrders, priorAuths, appeals] = await Promise.all([
    prisma.referral.findMany({ include: { patient: true, assignedTo: true }, orderBy: { dateOrdered: 'desc' } }),
    prisma.dMEOrder.findMany({ include: { patient: true, assignedTo: true }, orderBy: { dateOrdered: 'desc' } }),
    prisma.priorAuth.findMany({ include: { patient: true, assignedTo: true }, orderBy: { dateRequested: 'desc' } }),
    prisma.appeal.findMany({ include: { assignedTo: true }, orderBy: { createdAt: 'desc' } })
  ])
  return { referrals, dmeOrders, priorAuths, appeals }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const { referrals, dmeOrders, priorAuths, appeals } = await getDashboardData()

  const openRef = referrals.filter(r => !['Completed', 'Cancelled'].includes(r.status))
  const overdueRef = openRef.filter(r => getAgingFlag(r.dateOrdered, r.urgency, r.status) === 'red')
  const agingRef = openRef.filter(r => getAgingFlag(r.dateOrdered, r.urgency, r.status) === 'yellow')

  const openDME = dmeOrders.filter(d => !['Delivered', 'Cancelled'].includes(d.status))
  const overdueDME = openDME.filter(d => getAgingFlag(d.dateOrdered, d.urgency, d.status) === 'red')

  const openPA = priorAuths.filter(p => !['Approved', 'Denied', 'Expired'].includes(p.status))
  const pendingAppeals = appeals.filter(a => ['Pending', 'Scheduled'].includes(a.status))

  const urgentItems = [
    ...overdueRef.map(r => ({ type: 'Referral', id: r.id, refId: r.refNumber, patient: `${r.patient.lastName}, ${r.patient.firstName}`, detail: r.specialty, days: daysOpen(r.dateOrdered), href: `/referrals/${r.id}`, flag: 'red' })),
    ...overdueDME.map(d => ({ type: 'DME', id: d.id, refId: d.orderNumber, patient: `${d.patient.lastName}, ${d.patient.firstName}`, detail: d.equipment, days: daysOpen(d.dateOrdered), href: `/dme/${d.id}`, flag: 'red' })),
    ...agingRef.slice(0, 3).map(r => ({ type: 'Referral', id: r.id, refId: r.refNumber, patient: `${r.patient.lastName}, ${r.patient.firstName}`, detail: r.specialty, days: daysOpen(r.dateOrdered), href: `/referrals/${r.id}`, flag: 'yellow' }))
  ].sort((a, b) => b.days - a.days).slice(0, 10)

  const kpiCards = [
    {
      title: 'Open Referrals',
      value: openRef.length,
      sub: `${overdueRef.length} overdue · ${agingRef.length} aging`,
      icon: Send,
      color: 'bg-blue-500',
      href: '/referrals'
    },
    {
      title: 'Open DME Orders',
      value: openDME.length,
      sub: `${overdueDME.length} overdue`,
      icon: Package,
      color: 'bg-emerald-500',
      href: '/dme'
    },
    {
      title: 'Pending Prior Auths',
      value: openPA.length,
      sub: `${priorAuths.filter(p => p.status === 'Denied').length} denied · needs action`,
      icon: ShieldCheck,
      color: 'bg-purple-500',
      href: '/prior-auth'
    },
    {
      title: 'Active Appeals',
      value: pendingAppeals.length,
      sub: `${appeals.filter(a => a.status === 'Scheduled').length} P2P scheduled`,
      icon: MessageSquareWarning,
      color: 'bg-orange-500',
      href: '/appeals'
    }
  ]

  return (
    <div>
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              {(session?.user as any)?.name?.split(' ')[0]}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Here is your care coordination overview for today,{' '}
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Link href="/reports" className="text-sm text-brand-700 hover:underline font-medium flex items-center gap-1">
            Full Reports <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map(card => (
            <Link key={card.title} href={card.href}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.color} bg-opacity-10 flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color.replace('bg-', 'text-')}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{card.value}</div>
              <div className="text-sm font-medium text-gray-600 mt-0.5">{card.title}</div>
              <div className="text-xs text-gray-400 mt-1">{card.sub}</div>
            </Link>
          ))}
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Referrals Completed', value: referrals.filter(r => r.status === 'Completed').length, icon: CheckCircle2, color: 'text-green-600' },
            { label: 'Auth Approvals', value: priorAuths.filter(p => p.status === 'Approved').length, icon: CheckCircle2, color: 'text-green-600' },
            { label: 'PA Approval Rate', value: priorAuths.length ? `${((priorAuths.filter(p => p.status === 'Approved').length / priorAuths.length) * 100).toFixed(0)}%` : 'N/A', icon: TrendingUp, color: 'text-brand-600' },
            { label: 'Appeals Won', value: appeals.filter(a => a.status === 'Won').length, icon: CheckCircle2, color: 'text-green-600' }
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <div className="text-xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Alert / aging table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-gray-800">Items Needing Attention</h3>
              {urgentItems.filter(i => i.flag === 'red').length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {urgentItems.filter(i => i.flag === 'red').length} Overdue
                </span>
              )}
            </div>
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>Overdue</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>Aging</span>
            </div>
          </div>

          {urgentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <CheckCircle2 className="w-10 h-10 mb-2 text-green-400" />
              <p className="font-medium">All caught up! No aging items.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {urgentItems.map(item => (
                <Link key={`${item.type}-${item.id}`} href={item.href}
                  className={`flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition ${item.flag === 'red' ? 'border-l-4 border-red-400' : 'border-l-4 border-yellow-400'}`}>
                  <div className={`px-2 py-0.5 rounded text-xs font-semibold ${item.type === 'Referral' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {item.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-800">{item.patient}</span>
                    <span className="text-sm text-gray-500 ml-2">{item.detail}</span>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">{item.refId}</div>
                  <div className={`flex items-center gap-1 text-xs font-bold ${item.flag === 'red' ? 'text-red-600' : 'text-yellow-600'}`}>
                    <Clock className="w-3 h-3" />
                    {item.days}d
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent referrals */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-500" /> Recent Referrals
              </h3>
              <Link href="/referrals" className="text-xs text-brand-700 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {referrals.slice(0, 5).map(r => {
                const flag = getAgingFlag(r.dateOrdered, r.urgency, r.status)
                return (
                  <Link key={r.id} href={`/referrals/${r.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${flag === 'red' ? 'bg-red-400' : flag === 'yellow' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.patient.lastName}, {r.patient.firstName}</p>
                      <p className="text-xs text-gray-500 truncate">{r.specialty}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'Completed' ? 'bg-green-100 text-green-700' : r.status === 'Denied' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {r.status}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Recent DME */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-500" /> Recent DME Orders
              </h3>
              <Link href="/dme" className="text-xs text-brand-700 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {dmeOrders.slice(0, 5).map(d => {
                const flag = getAgingFlag(d.dateOrdered, d.urgency, d.status)
                return (
                  <Link key={d.id} href={`/dme/${d.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${flag === 'red' ? 'bg-red-400' : flag === 'yellow' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{d.patient.lastName}, {d.patient.firstName}</p>
                      <p className="text-xs text-gray-500 truncate">{d.equipment}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status === 'Delivered' ? 'bg-green-100 text-green-700' : d.status === 'Denied' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {d.status}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
