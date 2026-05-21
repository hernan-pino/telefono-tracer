import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'
import { TransferActions } from './TransferActions'

export default async function TransferDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  const user = session!.user as any

  const transfer = await prisma.transferRequest.findUnique({
    where: { id: params.id },
    include: {
      sample: { include: { currentStore: true } },
      fromStore: true,
      toStore: true,
      requestedBy: true,
      resolvedBy: true,
    },
  })
  if (!transfer) notFound()

  const canReceive = user.role === 'MERCHANDISER'
    && transfer.status === 'APPROVED'
    && transfer.toStoreId === user.storeId

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/transfers" className="text-blue-700 text-sm">← Volver</Link>
        <h1 className="text-xl font-bold flex-1">Traslado</h1>
        <StatusBadge status={transfer.status} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
        <Row label="Sample" value={`${transfer.sample.brand} ${transfer.sample.model}`} />
        {transfer.sample.imei && <Row label="IMEI" value={transfer.sample.imei} />}
        {transfer.sample.serialNumber && <Row label="Serie" value={transfer.sample.serialNumber} />}
        <Row label="Origen" value={transfer.fromStore.name} />
        <Row label="Destino" value={transfer.toStore.name} />
        <Row label="Solicitado por" value={transfer.requestedBy.name} />
        <Row label="Fecha solicitud" value={new Date(transfer.requestedAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })} />
        {transfer.notes && <Row label="Notas" value={transfer.notes} />}
        {transfer.rejectionReason && (
          <Row label="Motivo rechazo" value={<span className="text-red-600">{transfer.rejectionReason}</span>} />
        )}
        {transfer.resolvedBy && (
          <Row label="Resuelto por" value={transfer.resolvedBy.name} />
        )}
      </div>

      <TransferActions
        transferId={transfer.id}
        status={transfer.status}
        role={user.role}
        canReceive={canReceive}
      />
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
