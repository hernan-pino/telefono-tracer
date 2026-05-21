import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'

export default async function DashboardPage() {
  const session = await getSession()
  const user = session!.user as any

  if (user.role === 'SUPERVISOR') return <SupervisorDashboard userId={user.id} />
  return <MerchandiserDashboard storeId={user.storeId} storeName={user.storeName} userId={user.id} />
}

async function SupervisorDashboard({ userId }: { userId: string }) {
  const [stores, pendingTransfers] = await Promise.all([
    prisma.store.findMany({
      include: {
        samplesHere: { select: { status: true } },
        users: { select: { name: true, role: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.transferRequest.findMany({
      where: { status: 'PENDING' },
      include: { sample: true, fromStore: true, toStore: true, requestedBy: true },
      orderBy: { requestedAt: 'asc' },
    }),
  ])

  const totalSamples = stores.reduce((acc, s) => acc + s.samplesHere.length, 0)
  const activeSamples = stores.reduce((acc, s) => acc + s.samplesHere.filter(x => x.status === 'ACTIVE').length, 0)
  const lostSamples = stores.reduce((acc, s) => acc + s.samplesHere.filter(x => x.status === 'LOST').length, 0)

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold">Panel Supervisor</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total samples" value={totalSamples} color="text-gray-900" />
        <StatCard label="Activos" value={activeSamples} color="text-green-700" />
        <StatCard label="Perdidos" value={lostSamples} color="text-red-600" />
      </div>

      {/* Pending approvals */}
      {pendingTransfers.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Traslados pendientes</h2>
            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingTransfers.length}
            </span>
          </div>
          <ul className="space-y-2">
            {pendingTransfers.slice(0, 5).map(t => (
              <li key={t.id}>
                <Link href={`/transfers/${t.id}`} className="block bg-white rounded-xl border border-yellow-200 px-4 py-3 hover:shadow-md transition-shadow">
                  <p className="font-medium text-sm">{t.sample.brand} {t.sample.model}</p>
                  <p className="text-xs text-gray-500">{t.fromStore.name} → {t.toStore.name}</p>
                  <p className="text-xs text-gray-400">Solicitado por {t.requestedBy.name}</p>
                </Link>
              </li>
            ))}
          </ul>
          {pendingTransfers.length > 5 && (
            <Link href="/transfers" className="block text-center text-sm text-blue-700 mt-2">Ver todos →</Link>
          )}
        </section>
      )}

      {/* Stores summary */}
      <section>
        <h2 className="font-semibold text-gray-800 mb-3">Tiendas</h2>
        <ul className="space-y-2">
          {stores.map(store => {
            const active = store.samplesHere.filter(s => s.status === 'ACTIVE').length
            const inTransit = store.samplesHere.filter(s => s.status === 'IN_TRANSIT').length
            const lost = store.samplesHere.filter(s => s.status === 'LOST').length
            const merch = store.users.filter((u: any) => u.role === 'MERCHANDISER')
            return (
              <li key={store.id}>
                <Link href={`/stores/${store.id}`} className="block bg-white rounded-xl border border-gray-100 px-4 py-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">🏪 {store.name}</p>
                    <span className="text-xs text-blue-600 font-medium">Ver detalle →</span>
                  </div>
                  {store.city && <p className="text-xs text-gray-400 mt-0.5">{store.city}</p>}
                  <div className="flex gap-3 mt-2">
                    <span className="text-xs text-green-700 font-medium">{active} activos</span>
                    {inTransit > 0 && <span className="text-xs text-blue-600">{inTransit} en tránsito</span>}
                    {lost > 0 && <span className="text-xs text-red-600">{lost} perdidos</span>}
                    {store.samplesHere.length === 0 && <span className="text-xs text-gray-400">Sin samples</span>}
                  </div>
                  {merch.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      👤 {merch.map((m: any) => m.name).join(', ')}
                    </p>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

async function MerchandiserDashboard({ storeId, storeName, userId }: { storeId: string; storeName: string; userId: string }) {
  const [mySamples, incomingTransfers] = await Promise.all([
    prisma.sample.findMany({
      where: { currentStoreId: storeId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transferRequest.findMany({
      where: { toStoreId: storeId, status: 'APPROVED' },
      include: { sample: true, fromStore: true },
      orderBy: { requestedAt: 'desc' },
    }),
  ])

  const active = mySamples.filter(s => s.status === 'ACTIVE')
  const inTransit = mySamples.filter(s => s.status === 'IN_TRANSIT')

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <p className="text-sm text-gray-500">Tu tienda</p>
        <h1 className="text-xl font-bold">🏪 {storeName}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Samples activos" value={active.length} color="text-green-700" />
        <StatCard label="En tránsito (salida)" value={inTransit.length} color="text-blue-600" />
      </div>

      {/* Incoming */}
      {incomingTransfers.length > 0 && (
        <section>
          <h2 className="font-semibold text-gray-800 mb-3">
            📥 En camino a tu tienda ({incomingTransfers.length})
          </h2>
          <ul className="space-y-2">
            {incomingTransfers.map(t => (
              <li key={t.id}>
                <Link href={`/transfers/${t.id}`} className="block bg-green-50 rounded-xl border border-green-200 px-4 py-3 hover:shadow-md transition-shadow">
                  <p className="font-medium text-sm">{t.sample.brand} {t.sample.model}</p>
                  <p className="text-xs text-gray-500">Desde {t.fromStore.name}</p>
                  <p className="text-xs text-green-700 font-medium mt-1">Toca para confirmar recepción →</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* My samples */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Mis samples activos</h2>
          <Link href="/samples" className="text-sm text-blue-700">Ver todos</Link>
        </div>
        {active.length === 0 ? (
          <p className="text-sm text-gray-400">No hay samples activos en tu tienda</p>
        ) : (
          <ul className="space-y-2">
            {active.slice(0, 6).map(s => (
              <li key={s.id}>
                <Link href={`/samples/${s.id}`} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-medium text-sm">{s.brand} {s.model}</p>
                    <p className="text-xs text-gray-400">{s.color ?? ''}{s.imei ? ` · ${s.imei}` : ''}</p>
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

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
