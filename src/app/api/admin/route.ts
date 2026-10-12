import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['admin', 'supervisor'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const resource = searchParams.get('resource')

  if (resource === 'users') {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, title: true, active: true, createdAt: true },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(users)
  }

  if (resource === 'audit') {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { timestamp: 'desc' },
      take: 100
    })
    return NextResponse.json(logs)
  }

  return NextResponse.json({ error: 'Unknown resource' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { action } = body

  if (action === 'createUser') {
    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 })

    const password = await bcrypt.hash(body.password, 12)
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password,
        name: body.name,
        role: body.role || 'staff',
        title: body.title || ''
      },
      select: { id: true, email: true, name: true, role: true, title: true }
    })

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'CREATE_USER',
        resource: 'user',
        resourceId: user.id,
        details: `Created user ${user.email}`
      }
    })

    return NextResponse.json(user, { status: 201 })
  }

  if (action === 'updateUser') {
    const updateData: any = {}
    if (body.name) updateData.name = body.name
    if (body.role) updateData.role = body.role
    if (body.title !== undefined) updateData.title = body.title
    if (body.active !== undefined) updateData.active = body.active
    if (body.password) updateData.password = await bcrypt.hash(body.password, 12)

    const user = await prisma.user.update({
      where: { id: body.userId },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, title: true, active: true }
    })
    return NextResponse.json(user)
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
