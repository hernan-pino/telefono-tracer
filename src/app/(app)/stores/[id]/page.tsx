import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'

export default async function StoreDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  const user = session!.user as any
  if (user.role !== 'SUPERVISOR') redirect('/dashboard')

  const store = await prisma.store.findUnique({
    where: { id: params.id },
    include: {
      users: { where: { role: 'MERCHANDISER' }, select: { id: true, name: true, email: true } },
      samplesHere: {
        orderBy: { createdAt: 'desc' },
      },
      transfersFrom: {
        where: { status: 'PENDING' },
        include: { sample: true, toStore: true },
      },
      transfersTo: {
        where: { status: 'APPROVED' },
        include: { sample: true, fromStore: true },
      },
    },
  })
  if (!store) notFound()

  const active = store.samplesHere.filter(s => s.status === 'ACTIVE')
  const inTransit = store.samplesHere.filter(s => s.status === 'IN_TRANSIT')
  const lost = store.samplesHere.filter(s => s.status === 'LOST')
  const retired = store.samplesHere.filter(s => s.status === 'RETIRED')

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-blue-700 text-sm">← Inicio</Link>
        <h1 className="text-xl font-bold flex-1">🏪 {store.name}</h1>
      </div>

      {store.address && (
        <p className="text-sm text-gray-500">{store.address}{store.city ? `, ${store.city}` : ''}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <StatChip label="Activos" value={active.length} color="text-green-700" bg="bg-green-50" />
        <StatChip label="Tránsito" value={inTransit.length} color="text-blue-600" bg="bg-blue-50" />
        <StatChip label="Perdidos" value={lost.length} color="text-red-600" bg="bg-red-50" />
        <StatChip label="Bajas" value={retired.length} color="text-gray-500" bg="bg-gray-50" />
      </div>

      {/* Merchandisers */}
      {store.users.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Merchandisers</h2>
          <ul className="space-y-1">
            {store.users.map(u => (
              <li key={u.id} className="text-sm text-gray-700 bg-white rounded-lg border border-gray-100 px-3 py-2">
                👤 {u.name} <span className="text-gray-400">· {u.email}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pending transfers out */}
      {store.transfersFrom.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-2">
            Traslados pendientes de aprobación ({store.transfersFrom.length})
          </h2>
          <ul className="space-y-2">
            {store.transfersFrom.map(t => (
              <li key={t.id}>
                <Link href={`/transfers/${t.id}`} className="block bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-sm hover:shadow-sm transition-shadow">
                  <span className="font-medium">{t.sample.brand} {t.sample.model}</span>
                  <span className="text-gray-500"> → {t.toStore.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Incoming approved */}
      {store.transfersTo.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
            En camino a esta tienda ({store.transfersTo.length})
          </h2>
          <ul className="space-y-2">
            {store.transfersTo.map(t => (
              <li key={t.id}>
                <Link href={`/transfers/${t.id}`} className="block bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm hover:shadow-sm transition-shadow">
                  <span className="font-medium">{t.sample.brand} {t.sample.model}</span>
                  <span className="text-gray-500"> desde {t.fromStore.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* All samples */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Todos los samples ({store.samplesHere.length})
        </h2>
        {store.samplesHere.length === 0 ? (
          <p className="text-sm text-gray-400">Sin samples en esta tienda</p>
        ) : (
          <ul className="space-y-2">
            {store.samplesHere.map(s => (
              <li key={s.id}>
                <Link href={`/samples/${s.id}`} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-medium text-sm">{s.brand} {s.model}</p>
                    <p className="text-xs text-gray-400">
                      {s.color ? `${s.color} · ` : ''}
                      {s.imei ? `IMEI: ${s.imei}` : s.serialNumber ? `Serie: ${s.serialNumber}` : 'Sin ID'}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatChip({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl py-2 text-center`}>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
