import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')

  const where: any = {}
  if (search) {
    where.OR = [
      { lastName: { contains: search } },
      { firstName: { contains: search } },
      { mrn: { contains: search } },
      { phone: { contains: search } }
    ]
  }

  const patients = await prisma.patient.findMany({
    where,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      referrals: { select: { id: true, status: true } },
      dmeOrders: { select: { id: true, status: true } },
      priorAuths: { select: { id: true, status: true } }
    }
  })
  return NextResponse.json(patients)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const patient = await prisma.patient.create({ data: body })

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'CREATE',
      resource: 'patient',
      resourceId: patient.id,
      details: `Created patient MRN: ${patient.mrn}`
    }
  })

  return NextResponse.json(patient, { status: 201 })
}
