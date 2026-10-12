import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateRefNumber } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appeals = await prisma.appeal.findMany({
    include: { priorAuth: { include: { patient: true } }, assignedTo: true },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(appeals)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const appealNumber = generateRefNumber('APP')

  const appeal = await prisma.appeal.create({
    data: {
      appealNumber,
      priorAuthId: body.priorAuthId || null,
      assignedToId: body.assignedToId || (session.user as any).id,
      appealType: body.appealType || 'P2P',
      referenceId: body.referenceId || '',
      payer: body.payer || '',
      service: body.service || '',
      status: 'Pending',
      p2pPhysician: body.p2pPhysician || '',
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
      notes: body.notes || ''
    },
    include: { assignedTo: true }
  })

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'CREATE',
      resource: 'appeal',
      resourceId: appeal.id,
      details: `Created appeal ${appealNumber}`
    }
  })

  return NextResponse.json(appeal, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const body = await req.json()
  const updateData: any = { ...body, updatedAt: new Date() }
  if (body.scheduledDate) updateData.scheduledDate = new Date(body.scheduledDate)
  if (body.completedDate) updateData.completedDate = new Date(body.completedDate)
  if (['Won', 'Lost', 'Withdrawn'].includes(body.status) && !body.completedDate) {
    updateData.completedDate = new Date()
  }
  delete updateData.id

  const appeal = await prisma.appeal.update({
    where: { id },
    data: updateData,
    include: { assignedTo: true }
  })

  return NextResponse.json(appeal)
}
