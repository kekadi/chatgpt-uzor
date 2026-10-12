import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'specialists'
  const specialty = searchParams.get('specialty')
  const search = searchParams.get('search')

  if (type === 'vendors') {
    const where: any = { active: true }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { category: { contains: search } },
        { city: { contains: search } }
      ]
    }
    const vendors = await prisma.vendor.findMany({ where, orderBy: { name: 'asc' } })
    return NextResponse.json(vendors)
  }

  const where: any = { active: true }
  if (specialty) where.specialty = specialty
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { specialty: { contains: search } },
      { practice: { contains: search } },
      { city: { contains: search } }
    ]
  }
  const specialists = await prisma.specialist.findMany({ where, orderBy: [{ specialty: 'asc' }, { name: 'asc' }] })
  return NextResponse.json(specialists)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role === 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'specialist'
  const body = await req.json()

  if (type === 'vendor') {
    const vendor = await prisma.vendor.create({ data: body })
    return NextResponse.json(vendor, { status: 201 })
  }

  const specialist = await prisma.specialist.create({ data: body })
  return NextResponse.json(specialist, { status: 201 })
}
