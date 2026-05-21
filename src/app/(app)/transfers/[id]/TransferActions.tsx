'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  transferId: string
  status: string
  role: string
  canReceive: boolean
}

export function TransferActions({ transferId, status, role, canReceive }: Props) {
  const router = useRouter()
  const [rejectionReason, setRejectionReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [loading, setLoading] = useState(false)

  async function sendAction(action: string, extra?: object) {
    setLoading(true)
    await fetch(`/api/transfers/${transferId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    setLoading(false)
    router.refresh()
    router.push('/transfers')
  }

  if (status !== 'PENDING' && !canReceive) return null

  return (
    <div className="space-y-3">
      {role === 'SUPERVISOR' && status === 'PENDING' && !showReject && (
        <div className="flex gap-2">
          <button
            onClick={() => sendAction('APPROVE')}
            disabled={loading}
            className="flex-1 bg-green-600 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            ✔ Aprobar
          </button>
          <button
            onClick={() => setShowReject(true)}
            disabled={loading}
            className="flex-1 border border-red-400 text-red-600 rounded-lg py-2.5 font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            ✕ Rechazar
          </button>
        </div>
      )}

      {role === 'SUPERVISOR' && showReject && (
        <div className="space-y-2">
          <textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Motivo del rechazo..."
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => sendAction('REJECT', { rejectionReason })}
              disabled={loading}
              className="flex-1 bg-red-600 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-red-700 disabled:opacity-60"
            >
              Confirmar rechazo
            </button>
            <button
              onClick={() => setShowReject(false)}
              className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {canReceive && (
        <button
          onClick={() => sendAction('RECEIVE')}
          disabled={loading}
          className="w-full bg-green-600 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          📥 Confirmar recepción
        </button>
      )}
    </div>
  )
}
