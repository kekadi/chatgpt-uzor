import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const order = await prisma.dMEOrder.findUnique({
    where: { id: params.id },
    include: { patient: true, assignedTo: true }
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(order)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updateData: any = { ...body, updatedAt: new Date() }

  if (body.status === 'Delivered' && !body.dateDelivered) updateData.dateDelivered = new Date()
  if (body.status === 'Ordered' && !body.dateSubmitted) updateData.dateSubmitted = new Date()
  if (body.dateSubmitted) updateData.dateSubmitted = new Date(body.dateSubmitted)
  if (body.dateDelivered) updateData.dateDelivered = new Date(body.dateDelivered)

  delete updateData.patient
  delete updateData.assignedTo
  delete updateData.id

  const order = await prisma.dMEOrder.update({
    where: { id: params.id },
    data: updateData,
    include: { patient: true, assignedTo: true }
  })

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'UPDATE',
      resource: 'dme',
      resourceId: params.id,
      details: `Updated DME order: ${JSON.stringify(body)}`
    }
  })

  return NextResponse.json(order)
}
