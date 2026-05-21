import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function UsersPage() {
  const session = await getSession()
  const user = session!.user as any
  if (user.role !== 'SUPERVISOR') redirect('/dashboard')

  const users = await prisma.user.findMany({
    include: { store: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-5">Usuarios</h1>
      <ul className="space-y-3">
        {users.map(u => (
          <li key={u.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{u.name}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
                {u.store && <p className="text-xs text-blue-600 mt-0.5">🏪 {u.store.name}</p>}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.role === 'SUPERVISOR' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {u.role === 'SUPERVISOR' ? 'Supervisor' : 'Merchandiser'}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-400 text-center mt-6">Para agregar usuarios, usa el seed o contacta al administrador</p>
    </div>
  )
}
