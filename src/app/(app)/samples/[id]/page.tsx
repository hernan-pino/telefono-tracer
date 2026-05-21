import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'
import { AuditTimeline } from '@/components/AuditTimeline'
import { SampleActions } from './SampleActions'

export default async function SampleDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  const user = session!.user as any

  const sample = await prisma.sample.findUnique({
    where: { id: params.id },
    include: {
      currentStore: true,
      auditEvents: {
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      },
      transfers: {
        where: { status: 'PENDING' },
        include: { toStore: true },
      },
    },
  })
  if (!sample) notFound()

  const hasPendingTransfer = sample.transfers.length > 0

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/samples" className="text-blue-700 text-sm">← Volver</Link>
        <h1 className="text-xl font-bold flex-1">{sample.brand} {sample.model}</h1>
        <StatusBadge status={sample.status} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
        <Row label="Marca / Modelo" value={`${sample.brand} ${sample.model}`} />
        {sample.color && <Row label="Color" value={sample.color} />}
        {sample.imei && <Row label="IMEI" value={sample.imei} />}
        {sample.serialNumber && <Row label="Serie" value={sample.serialNumber} />}
        <Row label="Tienda actual" value={`🏪 ${sample.currentStore.name}`} />
        <Row label="Estado" value={<StatusBadge status={sample.status} />} />
        {hasPendingTransfer && (
          <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
            ⏳ Traslado pendiente de aprobación hacia {sample.transfers[0].toStore.name}
          </p>
        )}
      </div>

      <SampleActions
        sample={{ id: sample.id, status: sample.status, currentStoreId: sample.currentStoreId }}
        role={user.role}
        hasPendingTransfer={hasPendingTransfer}
      />

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Historial</h2>
        <AuditTimeline events={sample.auditEvents as any} />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}
