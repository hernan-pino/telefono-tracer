import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any

  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  const status = searchParams.get('status')

  const where: any = {}
  if (user.role === 'MERCHANDISER') {
    where.currentStoreId = user.storeId
  } else if (storeId) {
    where.currentStoreId = storeId
  }
  if (status) where.status = status

  const samples = await prisma.sample.findMany({
    where,
    include: { currentStore: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(samples)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'SUPERVISOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  // Bulk registration: accept array or single object
  const items: any[] = Array.isArray(body) ? body : [body]

  for (const item of items) {
    if (!item.brand || !item.model || !item.storeId) {
      return NextResponse.json({ error: 'Faltan campos requeridos (brand, model, storeId)' }, { status: 400 })
    }
  }

  const created = await prisma.$transaction(
    items.map(item =>
      prisma.sample.create({
        data: {
          brand: item.brand,
          model: item.model,
          color: item.color || null,
          serialNumber: item.serialNumber || null,
          imei: item.imei || null,
          status: 'ACTIVE',
          currentStoreId: item.storeId,
        },
      })
    )
  )

  await prisma.$transaction(
    created.map((sample, i) =>
      prisma.auditEvent.create({
        data: {
          sampleId: sample.id,
          userId: user.id,
          eventType: 'REGISTERED',
          toStoreId: items[i].storeId,
        },
      })
    )
  )

  return NextResponse.json(Array.isArray(body) ? created : created[0], { status: 201 })
}
