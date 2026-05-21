const config: Record<string, { label: string; classes: string }> = {
  ACTIVE:     { label: 'Activo',      classes: 'bg-green-100 text-green-700' },
  IN_TRANSIT: { label: 'En tránsito', classes: 'bg-blue-100 text-blue-700' },
  LOST:       { label: 'Perdido',     classes: 'bg-red-100 text-red-700' },
  RETIRED:    { label: 'Dado de baja',classes: 'bg-gray-100 text-gray-500' },
  PENDING:    { label: 'Pendiente',   classes: 'bg-yellow-100 text-yellow-700' },
  APPROVED:   { label: 'Aprobado',    classes: 'bg-green-100 text-green-700' },
  REJECTED:   { label: 'Rechazado',   classes: 'bg-red-100 text-red-700' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = config[status] ?? { label: status, classes: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${s.classes}`}>
      {s.label}
    </span>
  )
}
