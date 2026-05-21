import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function StoresPage() {
  const session = await getSession()
  const user = session!.user as any
  if (user.role !== 'SUPERVISOR') redirect('/dashboard')

  const stores = await prisma.store.findMany({
    include: {
      samplesHere: { select: { status: true } },
      users: { select: { id: true, name: true, role: true } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-5">Tiendas</h1>
      <ul className="space-y-3">
        {stores.map(store => {
          const active = store.samplesHere.filter(s => s.status === 'ACTIVE').length
          const merch = store.users.filter(u => u.role === 'MERCHANDISER')
          return (
            <li key={store.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-4">
              <p className="font-semibold">🏪 {store.name}</p>
              {store.city && <p className="text-xs text-gray-400">{store.city}</p>}
              <div className="flex gap-4 mt-2 text-xs text-gray-600">
                <span>📱 {active} samples activos</span>
                <span>👤 {merch.length} merchandiser{merch.length !== 1 ? 's' : ''}</span>
              </div>
              {merch.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">{merch.map(m => m.name).join(', ')}</p>
              )}
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-gray-400 text-center mt-6">Para agregar tiendas, usa el seed o contacta al administrador</p>
    </div>
  )
}
