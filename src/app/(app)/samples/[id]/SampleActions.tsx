'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

interface Props {
  sample: { id: string; status: string; currentStoreId: string }
  role: string
  hasPendingTransfer: boolean
}

export function SampleActions({ sample, role, hasPendingTransfer }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function markStatus(status: 'LOST' | 'RETIRED') {
    if (!confirm(`¿Confirmar marcar como ${status === 'LOST' ? 'perdido' : 'dado de baja'}?`)) return
    setLoading(true)
    await fetch(`/api/samples/${sample.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    router.refresh()
  }

  if (sample.status !== 'ACTIVE') return null

  return (
    <div className="space-y-2">
      {role === 'MERCHANDISER' && !hasPendingTransfer && (
        <Link
          href={`/transfers/new?sampleId=${sample.id}`}
          className="block w-full text-center bg-blue-700 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-blue-800 transition-colors"
        >
          Solicitar traslado
        </Link>
      )}
      {role === 'SUPERVISOR' && (
        <div className="flex gap-2">
          <button
            onClick={() => markStatus('LOST')}
            disabled={loading}
            className="flex-1 border border-yellow-400 text-yellow-700 rounded-lg py-2 text-sm font-medium hover:bg-yellow-50 transition-colors disabled:opacity-60"
          >
            Marcar perdido
          </button>
          <button
            onClick={() => markStatus('RETIRED')}
            disabled={loading}
            className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Dar de baja
          </button>
        </div>
      )}
    </div>
  )
}
