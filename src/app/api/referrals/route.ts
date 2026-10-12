import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateRefNumber } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const assignedTo = searchParams.get('assignedTo')
  const search = searchParams.get('search')

  const where: any = {}
  if (status && status !== 'all') where.status = status
  if (assignedTo) where.assignedToId = assignedTo
  if (search) {
    where.OR = [
      { refNumber: { contains: search } },
      { patient: { lastName: { contains: search } } },
      { patient: { firstName: { contains: search } } },
      { patient: { mrn: { contains: search } } },
      { specialty: { contains: search } }
    ]
  }

  const referrals = await prisma.referral.findMany({
    where,
    include: { patient: true, assignedTo: true },
    orderBy: { dateOrdered: 'desc' }
  })

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'VIEW',
      resource: 'referrals',
      details: 'Viewed referral list'
    }
  })

  return NextResponse.json(referrals)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const refNumber = generateRefNumber('REF')

  const referral = await prisma.referral.create({
    data: {
      refNumber,
      patientId: body.patientId,
      assignedToId: body.assignedToId || (session.user as any).id,
      referringProvider: body.referringProvider,
      specialty: body.specialty,
      specialist: body.specialist || '',
      urgency: body.urgency || 'Routine',
      status: 'Pending',
      diagnosis: body.diagnosis || '',
      icdCode: body.icdCode || '',
      payer: body.payer || '',
      authRequired: body.authRequired || false,
      notes: body.notes || '',
      dateOrdered: new Date(),
      dueDate: body.dueDate ? new Date(body.dueDate) : null
    },
    include: { patient: true, assignedTo: true }
  })

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'CREATE',
      resource: 'referral',
      resourceId: referral.id,
      details: `Created referral ${refNumber}`
    }
  })

  return NextResponse.json(referral, { status: 201 })
}
