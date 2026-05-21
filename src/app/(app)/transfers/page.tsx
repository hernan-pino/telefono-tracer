import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'

export default async function TransfersPage() {
  const session = await getSession()
  const user = session!.user as any

  const where: any = {}
  if (user.role === 'MERCHANDISER') {
    where.OR = [{ fromStoreId: user.storeId }, { toStoreId: user.storeId }]
  }

  const transfers = await prisma.transferRequest.findMany({
    where,
    include: { sample: true, fromStore: true, toStore: true, requestedBy: true },
    orderBy: { requestedAt: 'desc' },
  })

  const pending = transfers.filter(t => t.status === 'PENDING')
  const rest = transfers.filter(t => t.status !== 'PENDING')

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Traslados</h1>
        {user.role === 'MERCHANDISER' && (
          <Link
            href="/transfers/new"
            className="bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            + Solicitar
          </Link>
        )}
      </div>

      {pending.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-2">
            Pendientes ({pending.length})
          </h2>
          <ul className="space-y-3">
            {pending.map(t => <TransferCard key={t.id} t={t} role={user.role} storeId={user.storeId} />)}
          </ul>
        </section>
      )}

      {rest.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Historial</h2>
          <ul className="space-y-3">
            {rest.map(t => <TransferCard key={t.id} t={t} role={user.role} storeId={user.storeId} />)}
          </ul>
        </section>
      )}

      {transfers.length === 0 && (
        <p className="text-center text-gray-400 py-12">No hay traslados registrados</p>
      )}
    </div>
  )
}

function TransferCard({ t, role, storeId }: { t: any; role: string; storeId?: string }) {
  const isIncoming = t.toStoreId === storeId && t.status === 'APPROVED'
  return (
    <li>
      <Link href={`/transfers/${t.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{t.sample.brand} {t.sample.model}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t.fromStore.name} → {t.toStore.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Solicitado por {t.requestedBy.name} · {new Date(t.requestedAt).toLocaleDateString('es-MX')}
            </p>
            {isIncoming && (
              <p className="text-xs text-green-700 font-medium mt-1">📥 En camino a tu tienda</p>
            )}
          </div>
          <StatusBadge status={t.status} />
        </div>
      </Link>
    </li>
  )
}
