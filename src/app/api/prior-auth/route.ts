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
  const search = searchParams.get('search')

  const where: any = {}
  if (status && status !== 'all') where.status = status
  if (search) {
    where.OR = [
      { paNumber: { contains: search } },
      { service: { contains: search } },
      { patient: { lastName: { contains: search } } },
      { patient: { mrn: { contains: search } } }
    ]
  }

  const pas = await prisma.priorAuth.findMany({
    where,
    include: { patient: true, assignedTo: true, appeals: true },
    orderBy: { dateRequested: 'desc' }
  })
  return NextResponse.json(pas)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const paNumber = generateRefNumber('PA')

  const pa = await prisma.priorAuth.create({
    data: {
      paNumber,
      patientId: body.patientId,
      assignedToId: body.assignedToId || (session.user as any).id,
      serviceType: body.serviceType,
      service: body.service,
      provider: body.provider || '',
      payer: body.payer || '',
      urgency: body.urgency || 'Routine',
      status: 'Pending',
      diagnosis: body.diagnosis || '',
      icdCode: body.icdCode || '',
      cptCode: body.cptCode || '',
      notes: body.notes || '',
      dateRequested: new Date()
    },
    include: { patient: true, assignedTo: true }
  })

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'CREATE',
      resource: 'prior-auth',
      resourceId: pa.id,
      details: `Created PA ${paNumber}`
    }
  })

  return NextResponse.json(pa, { status: 201 })
}
