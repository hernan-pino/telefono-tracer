import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { NewSampleForm } from './NewSampleForm'

export default async function NewSamplePage() {
  const session = await getSession()
  const user = session!.user as any
  if (user.role !== 'SUPERVISOR') redirect('/samples')

  const stores = await prisma.store.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <a href="/samples" className="text-blue-700 text-sm">← Volver</a>
        <h1 className="text-xl font-bold">Nuevo Sample</h1>
      </div>
      <NewSampleForm stores={stores} />
    </div>
  )
}
