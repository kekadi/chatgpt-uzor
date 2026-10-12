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
      { orderNumber: { contains: search } },
      { equipment: { contains: search } },
      { patient: { lastName: { contains: search } } },
      { patient: { mrn: { contains: search } } }
    ]
  }

  const orders = await prisma.dMEOrder.findMany({
    where,
    include: { patient: true, assignedTo: true },
    orderBy: { dateOrdered: 'desc' }
  })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const orderNumber = generateRefNumber('DME')

  const order = await prisma.dMEOrder.create({
    data: {
      orderNumber,
      patientId: body.patientId,
      assignedToId: body.assignedToId || (session.user as any).id,
      equipment: body.equipment,
      vendor: body.vendor || '',
      urgency: body.urgency || 'Routine',
      status: 'Pending',
      diagnosis: body.diagnosis || '',
      icdCode: body.icdCode || '',
      payer: body.payer || '',
      authRequired: body.authRequired !== false,
      quantity: body.quantity || 1,
      notes: body.notes || '',
      dateOrdered: new Date()
    },
    include: { patient: true, assignedTo: true }
  })

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'CREATE',
      resource: 'dme',
      resourceId: order.id,
      details: `Created DME order ${orderNumber}`
    }
  })

  return NextResponse.json(order, { status: 201 })
}
