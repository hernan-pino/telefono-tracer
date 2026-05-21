import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sample = await prisma.sample.findUnique({
    where: { id: params.id },
    include: {
      currentStore: true,
      transfers: {
        include: { fromStore: true, toStore: true, requestedBy: true, resolvedBy: true },
        orderBy: { requestedAt: 'desc' },
      },
      auditEvents: {
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!sample) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(sample)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'SUPERVISOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { status } = await req.json()
  if (!['LOST', 'RETIRED'].includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const sample = await prisma.sample.update({
    where: { id: params.id },
    data: { status },
  })

  await prisma.auditEvent.create({
    data: {
      sampleId: sample.id,
      userId: user.id,
      eventType: status === 'LOST' ? 'MARKED_LOST' : 'RETIRED',
    },
  })

  return NextResponse.json(sample)
}
