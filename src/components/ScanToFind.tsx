'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarcodeScanner } from './BarcodeScanner'

export function ScanToFind() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)

  async function handleScan(value: string) {
    setScanning(false)
    setSearching(true)
    setError('')

    const digits = value.replace(/\D/g, '')
    const imei = digits.length >= 15 ? digits.slice(-15) : digits

    const res = await fetch(`/api/samples/search?imei=${encodeURIComponent(imei)}`)
    setSearching(false)

    if (res.ok) {
      const sample = await res.json()
      router.push(`/samples/${sample.id}`)
    } else {
      setError(`No se encontró ningún sample con IMEI ${imei}`)
    }
  }

  return (
    <>
      {scanning && <BarcodeScanner onScan={handleScan} onClose={() => setScanning(false)} />}

      <button
        onClick={() => { setError(''); setScanning(true) }}
        disabled={searching}
        className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
      >
        <span className="text-base">📷</span>
        {searching ? 'Buscando...' : 'Buscar por IMEI'}
      </button>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">{error}</p>
      )}
    </>
  )
}
