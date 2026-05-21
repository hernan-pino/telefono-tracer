const eventLabels: Record<string, { label: string; icon: string; color: string }> = {
  REGISTERED:          { label: 'Registrado', icon: '✅', color: 'text-green-600' },
  TRANSFER_REQUESTED:  { label: 'Traslado solicitado', icon: '📤', color: 'text-blue-600' },
  TRANSFER_APPROVED:   { label: 'Traslado aprobado', icon: '✔️', color: 'text-blue-700' },
  TRANSFER_REJECTED:   { label: 'Traslado rechazado', icon: '❌', color: 'text-red-600' },
  RECEIVED:            { label: 'Recibido en tienda', icon: '📥', color: 'text-green-700' },
  MARKED_LOST:         { label: 'Marcado como perdido', icon: '⚠️', color: 'text-yellow-600' },
  RETIRED:             { label: 'Dado de baja', icon: '🗄️', color: 'text-gray-500' },
}

interface AuditEvent {
  id: string
  eventType: string
  createdAt: string
  notes?: string | null
  fromStoreId?: string | null
  toStoreId?: string | null
  user: { name: string; role: string }
}

interface Props {
  events: AuditEvent[]
}

export function AuditTimeline({ events }: Props) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">Sin historial</p>
  }

  return (
    <ol className="relative border-l border-gray-200 ml-3 space-y-4">
      {events.map(ev => {
        const meta = eventLabels[ev.eventType] ?? { label: ev.eventType, icon: '•', color: 'text-gray-600' }
        return (
          <li key={ev.id} className="ml-4">
            <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-gray-200 text-xs">
              {meta.icon}
            </span>
            <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
            <p className="text-xs text-gray-500">
              {ev.user.name} · {new Date(ev.createdAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
            {ev.notes && <p className="text-xs text-gray-600 mt-0.5">{ev.notes}</p>}
          </li>
        )
      })}
    </ol>
  )
}
