import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getAgingFlag } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [referrals, dmeOrders, priorAuths, appeals, users] = await Promise.all([
    prisma.referral.findMany({ include: { patient: true, assignedTo: true } }),
    prisma.dMEOrder.findMany({ include: { patient: true, assignedTo: true } }),
    prisma.priorAuth.findMany({ include: { patient: true, assignedTo: true } }),
    prisma.appeal.findMany({ include: { assignedTo: true } }),
    prisma.user.findMany({ where: { active: true } })
  ])

  // KPI calculations
  const openRef = referrals.filter(r => !['Completed', 'Cancelled'].includes(r.status))
  const overdueRef = openRef.filter(r => getAgingFlag(r.dateOrdered, r.urgency, r.status) === 'red')
  const agingRef = openRef.filter(r => getAgingFlag(r.dateOrdered, r.urgency, r.status) === 'yellow')

  const openDME = dmeOrders.filter(d => !['Delivered', 'Cancelled'].includes(d.status))
  const overdueDME = openDME.filter(d => getAgingFlag(d.dateOrdered, d.urgency, d.status) === 'red')

  const openPA = priorAuths.filter(p => !['Approved', 'Denied', 'Expired'].includes(p.status))
  const approvedPA = priorAuths.filter(p => p.status === 'Approved')
  const deniedPA = priorAuths.filter(p => p.status === 'Denied')

  // Payer breakdown for referrals
  const payerRefMap: Record<string, number> = {}
  referrals.forEach(r => {
    payerRefMap[r.payer || 'Unknown'] = (payerRefMap[r.payer || 'Unknown'] || 0) + 1
  })

  // Payer denial rate
  const payerDenialMap: Record<string, { total: number; denied: number }> = {}
  priorAuths.forEach(p => {
    const payer = p.payer || 'Unknown'
    if (!payerDenialMap[payer]) payerDenialMap[payer] = { total: 0, denied: 0 }
    payerDenialMap[payer].total++
    if (p.status === 'Denied') payerDenialMap[payer].denied++
  })

  // Specialty breakdown
  const specialtyMap: Record<string, number> = {}
  referrals.forEach(r => {
    specialtyMap[r.specialty] = (specialtyMap[r.specialty] || 0) + 1
  })

  // Monthly trend (last 6 months)
  const monthly = []
  for (let m = 5; m >= 0; m--) {
    const d = new Date()
    d.setMonth(d.getMonth() - m)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const inMonth = (date: any) => {
      if (!date) return false
      const dd = new Date(date)
      return dd >= monthStart && dd <= monthEnd
    }
    monthly.push({
      month: label,
      referrals: referrals.filter(r => inMonth(r.dateOrdered)).length,
      dme: dmeOrders.filter(d => inMonth(d.dateOrdered)).length,
      pa: priorAuths.filter(p => inMonth(p.dateRequested)).length
    })
  }

  // Staff productivity
  const staffStats = users
    .filter(u => u.role !== 'admin')
    .map(u => {
      const refs = referrals.filter(r => r.assignedToId === u.id)
      const dmes = dmeOrders.filter(d => d.assignedToId === u.id)
      const pas = priorAuths.filter(p => p.assignedToId === u.id)
      return {
        id: u.id,
        name: u.name,
        title: u.title,
        referrals: refs.length,
        completedReferrals: refs.filter(r => r.status === 'Completed').length,
        dmeOrders: dmes.length,
        deliveredDME: dmes.filter(d => d.status === 'Delivered').length,
        priorAuths: pas.length,
        approvedPA: pas.filter(p => p.status === 'Approved').length
      }
    })

  return NextResponse.json({
    summary: {
      totalReferrals: referrals.length,
      openReferrals: openRef.length,
      overdueReferrals: overdueRef.length,
      agingReferrals: agingRef.length,
      completedReferrals: referrals.filter(r => r.status === 'Completed').length,
      deniedReferrals: referrals.filter(r => r.status === 'Denied').length,
      totalDME: dmeOrders.length,
      openDME: openDME.length,
      overdueDME: overdueDME.length,
      deliveredDME: dmeOrders.filter(d => d.status === 'Delivered').length,
      totalPA: priorAuths.length,
      openPA: openPA.length,
      approvedPA: approvedPA.length,
      deniedPA: deniedPA.length,
      approvalRate: priorAuths.length ? ((approvedPA.length / priorAuths.length) * 100).toFixed(1) : '0',
      totalAppeals: appeals.length,
      wonAppeals: appeals.filter(a => a.status === 'Won').length,
      pendingAppeals: appeals.filter(a => ['Pending', 'Scheduled'].includes(a.status)).length
    },
    monthly,
    payerRefMap: Object.entries(payerRefMap).map(([payer, count]) => ({ payer, count })),
    payerDenialMap: Object.entries(payerDenialMap).map(([payer, d]) => ({
      payer,
      total: d.total,
      denied: d.denied,
      rate: d.total ? ((d.denied / d.total) * 100).toFixed(0) : '0'
    })),
    specialtyMap: Object.entries(specialtyMap)
      .map(([specialty, count]) => ({ specialty, count }))
      .sort((a, b) => b.count - a.count),
    staffStats
  })
}
