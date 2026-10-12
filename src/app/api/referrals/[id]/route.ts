import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const referral = await prisma.referral.findUnique({
    where: { id: params.id },
    include: { patient: true, assignedTo: true }
  })
  if (!referral) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(referral)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updateData: any = { ...body, updatedAt: new Date() }

  if (body.status === 'Completed' && !body.dateCompleted) updateData.dateCompleted = new Date()
  if (body.status === 'Sent' && !body.dateSent) updateData.dateSent = new Date()
  if (body.status === 'Scheduled' && !body.dateScheduled) updateData.dateScheduled = new Date()
  if (body.dueDate) updateData.dueDate = new Date(body.dueDate)
  if (body.dateSent) updateData.dateSent = new Date(body.dateSent)
  if (body.dateScheduled) updateData.dateScheduled = new Date(body.dateScheduled)
  if (body.dateCompleted) updateData.dateCompleted = new Date(body.dateCompleted)

  delete updateData.patient
  delete updateData.assignedTo
  delete updateData.id

  const referral = await prisma.referral.update({
    where: { id: params.id },
    data: updateData,
    include: { patient: true, assignedTo: true }
  })

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'UPDATE',
      resource: 'referral',
      resourceId: params.id,
      details: `Updated referral ${referral.refNumber}: ${JSON.stringify(body)}`
    }
  })

  return NextResponse.json(referral)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role === 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.referral.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
