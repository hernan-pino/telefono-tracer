import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: any = {}
  if (status) where.status = status
  if (user.role === 'MERCHANDISER') {
    where.OR = [{ fromStoreId: user.storeId }, { toStoreId: user.storeId }]
  }

  const transfers = await prisma.transferRequest.findMany({
    where,
    include: { sample: true, fromStore: true, toStore: true, requestedBy: true, resolvedBy: true },
    orderBy: { requestedAt: 'desc' },
  })
  return NextResponse.json(transfers)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'MERCHANDISER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { toStoreId, notes } = body

  // Accept single sampleId or array of sampleIds
  const sampleIds: string[] = Array.isArray(body.sampleIds)
    ? body.sampleIds
    : body.sampleId
    ? [body.sampleId]
    : []

  if (sampleIds.length === 0 || !toStoreId) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const samples = await prisma.sample.findMany({
    where: { id: { in: sampleIds } },
  })

  const errors: string[] = []
  for (const sample of samples) {
    if (sample.status !== 'ACTIVE') errors.push(`${sample.brand} ${sample.model}: no está activo`)
    if (sample.currentStoreId !== user.storeId) errors.push(`${sample.brand} ${sample.model}: no está en tu tienda`)
    const pending = await prisma.transferRequest.findFirst({ where: { sampleId: sample.id, status: 'PENDING' } })
    if (pending) errors.push(`${sample.brand} ${sample.model}: ya tiene un traslado pendiente`)
  }
  if (errors.length > 0) return NextResponse.json({ error: errors.join(' | ') }, { status: 400 })

  const transfers = await prisma.$transaction(
    samples.map(sample =>
      prisma.transferRequest.create({
        data: {
          sampleId: sample.id,
          fromStoreId: sample.currentStoreId,
          toStoreId,
          requestedById: user.id,
          status: 'PENDING',
          notes: notes || null,
        },
      })
    )
  )

  await prisma.$transaction(
    samples.map(sample =>
      prisma.auditEvent.create({
        data: {
          sampleId: sample.id,
          userId: user.id,
          eventType: 'TRANSFER_REQUESTED',
          fromStoreId: sample.currentStoreId,
          toStoreId,
          notes: notes || null,
        },
      })
    )
  )

  return NextResponse.json(transfers, { status: 201 })
}
