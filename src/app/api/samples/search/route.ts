import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const imei = new URL(req.url).searchParams.get('imei')
  if (!imei) return NextResponse.json({ error: 'IMEI requerido' }, { status: 400 })

  const sample = await prisma.sample.findFirst({
    where: { imei },
    include: { currentStore: true },
  })

  if (!sample) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(sample)
}
