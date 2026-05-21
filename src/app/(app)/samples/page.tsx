import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'
import { ScanToFind } from '@/components/ScanToFind'

export default async function SamplesPage() {
  const session = await getSession()
  const user = session!.user as any

  const where: any = {}
  if (user.role === 'MERCHANDISER') where.currentStoreId = user.storeId

  const samples = await prisma.sample.findMany({
    where,
    include: { currentStore: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Samples</h1>
        {user.role === 'SUPERVISOR' && (
          <Link
            href="/samples/new"
            className="bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            + Nuevo
          </Link>
        )}
      </div>

      {/* Scan to find button */}
      <div className="mb-5">
        <ScanToFind />
      </div>

      {samples.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No hay samples registrados</p>
      ) : (
        <ul className="space-y-3">
          {samples.map(s => (
            <li key={s.id}>
              <Link href={`/samples/${s.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{s.brand} {s.model}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.color && `${s.color} · `}
                      {s.imei ? `IMEI: ${s.imei}` : s.serialNumber ? `Serie: ${s.serialNumber}` : 'Sin ID'}
                    </p>
                    {user.role === 'SUPERVISOR' && (
                      <p className="text-xs text-blue-600 mt-0.5">🏪 {s.currentStore.name}</p>
                    )}
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
