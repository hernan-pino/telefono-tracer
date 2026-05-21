import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { NewTransferForm } from './NewTransferForm'

export default async function NewTransferPage({ searchParams }: { searchParams: { sampleId?: string } }) {
  const session = await getSession()
  const user = session!.user as any
  if (user.role !== 'MERCHANDISER') redirect('/transfers')

  const sampleId = searchParams.sampleId
  const sample = sampleId
    ? await prisma.sample.findUnique({ where: { id: sampleId }, include: { currentStore: true } })
    : null

  const mySamples = await prisma.sample.findMany({
    where: { currentStoreId: user.storeId, status: 'ACTIVE' },
    orderBy: { model: 'asc' },
  })

  const otherStores = await prisma.store.findMany({
    where: { id: { not: user.storeId } },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <a href="/transfers" className="text-blue-700 text-sm">← Volver</a>
        <h1 className="text-xl font-bold">Solicitar Traslado</h1>
      </div>
      <NewTransferForm
        preselectedSample={sample as any}
        mySamples={mySamples as any}
        otherStores={otherStores}
      />
    </div>
  )
}
