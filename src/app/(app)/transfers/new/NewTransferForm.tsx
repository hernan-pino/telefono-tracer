'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Sample { id: string; brand: string; model: string; color?: string | null; imei?: string | null; serialNumber?: string | null }
interface Store { id: string; name: string }

interface Props {
  preselectedSample: Sample | null
  mySamples: Sample[]
  otherStores: Store[]
}

export function NewTransferForm({ preselectedSample, mySamples, otherStores }: Props) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(preselectedSample ? [preselectedSample.id] : [])
  )
  const [toStoreId, setToStoreId] = useState(otherStores[0]?.id ?? '')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggle(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === mySamples.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(mySamples.map(s => s.id)))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedIds.size === 0) { setError('Selecciona al menos un equipo'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleIds: Array.from(selectedIds), toStoreId, notes }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/transfers')
    } else {
      setError((await res.json()).error ?? 'Error al solicitar traslado')
    }
  }

  const allSelected = mySamples.length > 0 && selectedIds.size === mySamples.length

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Destination store */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tienda destino <span className="text-red-500">*</span></label>
          <select
            value={toStoreId}
            onChange={e => setToStoreId(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {otherStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Motivo del traslado..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Sample selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">
            Equipos a trasladar
            {selectedIds.size > 0 && <span className="ml-2 text-blue-700">({selectedIds.size} seleccionados)</span>}
          </p>
          {mySamples.length > 1 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-blue-600 hover:underline"
            >
              {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          )}
        </div>

        {mySamples.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No hay samples activos en tu tienda</p>
        ) : (
          <ul className="space-y-2">
            {mySamples.map(s => {
              const checked = selectedIds.has(s.id)
              return (
                <li key={s.id}>
                  <label className={`flex items-center gap-3 bg-white rounded-xl border px-4 py-3 cursor-pointer transition-colors ${checked ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(s.id)}
                      className="w-4 h-4 rounded accent-blue-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{s.brand} {s.model}{s.color ? ` · ${s.color}` : ''}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {s.imei ? `IMEI: ${s.imei}` : s.serialNumber ? `Serie: ${s.serialNumber}` : 'Sin ID'}
                      </p>
                    </div>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={loading || selectedIds.size === 0 || !toStoreId}
        className="w-full bg-blue-700 text-white rounded-lg py-2.5 font-semibold text-sm disabled:opacity-60 hover:bg-blue-800 transition-colors"
      >
        {loading
          ? 'Enviando...'
          : selectedIds.size > 1
          ? `Solicitar traslado de ${selectedIds.size} equipos`
          : 'Solicitar traslado'}
      </button>
    </form>
  )
}
