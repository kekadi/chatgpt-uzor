import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateExcelWorkbook } from '@/lib/excel'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [referrals, dmeOrders, priorAuths, appeals, specialists, vendors, users] = await Promise.all([
    prisma.referral.findMany({ include: { patient: true, assignedTo: true }, orderBy: { dateOrdered: 'desc' } }),
    prisma.dMEOrder.findMany({ include: { patient: true, assignedTo: true }, orderBy: { dateOrdered: 'desc' } }),
    prisma.priorAuth.findMany({ include: { patient: true, assignedTo: true }, orderBy: { dateRequested: 'desc' } }),
    prisma.appeal.findMany({ include: { assignedTo: true }, orderBy: { createdAt: 'desc' } }),
    prisma.specialist.findMany({ where: { active: true }, orderBy: { specialty: 'asc' } }),
    prisma.vendor.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { active: true } })
  ])

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'EXPORT',
      resource: 'excel',
      details: 'Exported full Excel workbook'
    }
  })

  const buffer = await generateExcelWorkbook({ referrals, dmeOrders, priorAuths, appeals, specialists, vendors, users })
  const today = new Date().toISOString().split('T')[0]

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="BurlesonGP-CRM-${today}.xlsx"`,
      'Content-Length': buffer.length.toString()
    }
  })
}
