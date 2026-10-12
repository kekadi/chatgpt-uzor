import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const pa = await prisma.priorAuth.findUnique({
    where: { id: params.id },
    include: { patient: true, assignedTo: true, appeals: { include: { assignedTo: true } } }
  })
  if (!pa) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(pa)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updateData: any = { ...body, updatedAt: new Date() }

  if (body.status === 'Submitted' && !body.dateSubmitted) updateData.dateSubmitted = new Date()
  if (['Approved', 'Denied'].includes(body.status) && !body.dateDecision) updateData.dateDecision = new Date()
  if (body.dateSubmitted) updateData.dateSubmitted = new Date(body.dateSubmitted)
  if (body.dateDecision) updateData.dateDecision = new Date(body.dateDecision)
  if (body.expirationDate) updateData.expirationDate = new Date(body.expirationDate)

  delete updateData.patient
  delete updateData.assignedTo
  delete updateData.appeals
  delete updateData.id

  const pa = await prisma.priorAuth.update({
    where: { id: params.id },
    data: updateData,
    include: { patient: true, assignedTo: true, appeals: true }
  })

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'UPDATE',
      resource: 'prior-auth',
      resourceId: params.id,
      details: `Updated PA: ${JSON.stringify(body)}`
    }
  })

  return NextResponse.json(pa)
}
