import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const transfer = await prisma.transferRequest.findUnique({
    where: { id: params.id },
    include: {
      sample: { include: { currentStore: true } },
      fromStore: true,
      toStore: true,
      requestedBy: true,
      resolvedBy: true,
    },
  })
  if (!transfer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(transfer)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any

  const { action, rejectionReason } = await req.json()

  const transfer = await prisma.transferRequest.findUnique({
    where: { id: params.id },
    include: { sample: true },
  })
  if (!transfer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // RECEIVE requires APPROVED status — handle before the PENDING guard
  if (action === 'RECEIVE') {
    if (user.role !== 'MERCHANDISER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (user.storeId !== transfer.toStoreId) return NextResponse.json({ error: 'No eres de la tienda destino' }, { status: 403 })
    if (transfer.status !== 'APPROVED') return NextResponse.json({ error: 'El traslado no está aprobado' }, { status: 400 })

    await prisma.$transaction([
      prisma.sample.update({
        where: { id: transfer.sampleId },
        data: { status: 'ACTIVE', currentStoreId: transfer.toStoreId },
      }),
      prisma.auditEvent.create({
        data: {
          sampleId: transfer.sampleId,
          userId: user.id,
          eventType: 'RECEIVED',
          fromStoreId: transfer.fromStoreId,
          toStoreId: transfer.toStoreId,
        },
      }),
    ])
    return NextResponse.json({ ok: true })
  }

  if (transfer.status !== 'PENDING') return NextResponse.json({ error: 'El traslado ya fue resuelto' }, { status: 400 })

  if (action === 'APPROVE') {
    if (user.role !== 'SUPERVISOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.$transaction([
      prisma.transferRequest.update({
        where: { id: params.id },
        data: { status: 'APPROVED', resolvedById: user.id, resolvedAt: new Date() },
      }),
      prisma.sample.update({
        where: { id: transfer.sampleId },
        data: { status: 'IN_TRANSIT' },
      }),
      prisma.auditEvent.create({
        data: {
          sampleId: transfer.sampleId,
          userId: user.id,
          eventType: 'TRANSFER_APPROVED',
          fromStoreId: transfer.fromStoreId,
          toStoreId: transfer.toStoreId,
        },
      }),
    ])
    return NextResponse.json({ ok: true })
  }

  if (action === 'REJECT') {
    if (user.role !== 'SUPERVISOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.$transaction([
      prisma.transferRequest.update({
        where: { id: params.id },
        data: { status: 'REJECTED', resolvedById: user.id, resolvedAt: new Date(), rejectionReason: rejectionReason || null },
      }),
      prisma.auditEvent.create({
        data: {
          sampleId: transfer.sampleId,
          userId: user.id,
          eventType: 'TRANSFER_REJECTED',
          fromStoreId: transfer.fromStoreId,
          toStoreId: transfer.toStoreId,
          notes: rejectionReason || null,
        },
      }),
    ])
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
