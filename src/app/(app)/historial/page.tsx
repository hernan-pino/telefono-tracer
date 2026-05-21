import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const eventLabels: Record<string, { label: string; icon: string; color: string }> = {
  REGISTERED:          { label: 'Registrado',           icon: '✅', color: 'bg-green-100 text-green-700' },
  TRANSFER_REQUESTED:  { label: 'Traslado solicitado',  icon: '📤', color: 'bg-blue-100 text-blue-700' },
  TRANSFER_APPROVED:   { label: 'Traslado aprobado',    icon: '✔️', color: 'bg-blue-100 text-blue-800' },
  TRANSFER_REJECTED:   { label: 'Traslado rechazado',   icon: '❌', color: 'bg-red-100 text-red-700' },
  RECEIVED:            { label: 'Recibido en tienda',   icon: '📥', color: 'bg-green-100 text-green-800' },
  MARKED_LOST:         { label: 'Marcado como perdido', icon: '⚠️', color: 'bg-yellow-100 text-yellow-700' },
  RETIRED:             { label: 'Dado de baja',         icon: '🗄️', color: 'bg-gray-100 text-gray-600' },
}

interface Props {
  searchParams: { store?: string; tipo?: string }
}

export default async function HistorialPage({ searchParams }: Props) {
  const session = await getSession()
  const user = session!.user as any
  if (user.role !== 'SUPERVISOR') redirect('/dashboard')

  const [stores, events] = await Promise.all([
    prisma.store.findMany({ orderBy: { name: 'asc' } }),
    prisma.auditEvent.findMany({
      where: {
        ...(searchParams.store ? {
          OR: [
            { fromStoreId: searchParams.store },
            { toStoreId: searchParams.store },
            { sample: { currentStoreId: searchParams.store } },
          ],
        } : {}),
        ...(searchParams.tipo ? { eventType: searchParams.tipo } : {}),
      },
      include: {
        sample: { include: { currentStore: true } },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ])

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <h1 className="text-xl font-bold">Historial de movimientos</h1>

      {/* Filters */}
      <form method="GET" className="flex gap-2">
        <select
          name="store"
          defaultValue={searchParams.store ?? ''}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las tiendas</option>
          {stores.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          name="tipo"
          defaultValue={searchParams.tipo ?? ''}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los eventos</option>
          {Object.entries(eventLabels).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          Filtrar
        </button>
      </form>

      {(searchParams.store || searchParams.tipo) && (
        <Link href="/historial" className="text-xs text-blue-600 hover:underline">
          × Limpiar filtros
        </Link>
      )}

      <p className="text-xs text-gray-400">
        {events.length === 200 ? 'Mostrando los últimos 200 registros' : `${events.length} registros`}
      </p>

      {events.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No hay registros con estos filtros</p>
      ) : (
        <ol className="space-y-2">
          {events.map(ev => {
            const meta = eventLabels[ev.eventType] ?? { label: ev.eventType, icon: '•', color: 'bg-gray-100 text-gray-600' }
            return (
              <li key={ev.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(ev.createdAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <Link href={`/samples/${ev.sampleId}`} className="block mt-1 font-medium text-sm text-blue-700 hover:underline truncate">
                      {ev.sample.brand} {ev.sample.model}
                      {ev.sample.imei && <span className="text-gray-400 font-normal"> · {ev.sample.imei}</span>}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Por {ev.user.name}
                      {ev.fromStoreId && ev.toStoreId && (
                        <StoreRoute fromId={ev.fromStoreId} toId={ev.toStoreId} stores={stores} />
                      )}
                      {!ev.fromStoreId && ev.toStoreId && (
                        <> · en <StoreLink id={ev.toStoreId} stores={stores} /></>
                      )}
                    </p>
                    {ev.notes && (
                      <p className="text-xs text-gray-400 mt-0.5 italic">"{ev.notes}"</p>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function StoreRoute({ fromId, toId, stores }: { fromId: string; toId: string; stores: { id: string; name: string }[] }) {
  const from = stores.find(s => s.id === fromId)?.name ?? fromId
  const to = stores.find(s => s.id === toId)?.name ?? toId
  return <> · {from} → {to}</>
}

function StoreLink({ id, stores }: { id: string; stores: { id: string; name: string }[] }) {
  const name = stores.find(s => s.id === id)?.name ?? id
  return <>{name}</>
}
