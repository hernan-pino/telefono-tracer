'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarcodeScanner } from '@/components/BarcodeScanner'

interface Store { id: string; name: string }

interface Row {
  model: string
  color: string
  serialNumber: string
  imei: string
  scanningImei: boolean
}

function emptyRow(): Row {
  return { model: '', color: '', serialNumber: '', imei: '', scanningImei: false }
}

export function NewSampleForm({ stores }: { stores: Store[] }) {
  const router = useRouter()
  const [bulk, setBulk] = useState(false)

  // Single mode state
  const [single, setSingle] = useState({ brand: 'Vivo', model: '', color: '', serialNumber: '', imei: '', storeId: stores[0]?.id ?? '' })
  const [scanSingle, setScanSingle] = useState(false)

  // Bulk mode state
  const [brand, setBrand] = useState('Vivo')
  const [storeId, setStoreId] = useState(stores[0]?.id ?? '')
  const [rows, setRows] = useState<Row[]>([emptyRow()])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // --- Single mode ---
  function setSingleField(field: string, value: string) {
    setSingle(f => ({ ...f, [field]: value }))
  }

  async function submitSingle(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/samples', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(single),
    })
    setLoading(false)
    if (res.ok) {
      const s = await res.json()
      router.push(`/samples/${s.id}`)
    } else {
      setError((await res.json()).error ?? 'Error')
    }
  }

  // --- Bulk mode ---
  function updateRow(i: number, field: keyof Row, value: string | boolean) {
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  function addRow() { setRows(rs => [...rs, emptyRow()]) }
  function removeRow(i: number) { setRows(rs => rs.filter((_, idx) => idx !== i)) }

  function handleBulkScan(i: number, value: string) {
    const digits = value.replace(/\D/g, '')
    const imei = digits.length >= 15 ? digits.slice(-15) : digits
    updateRow(i, 'imei', imei)
    updateRow(i, 'scanningImei', false)
  }

  async function submitBulk(e: React.FormEvent) {
    e.preventDefault()
    const validRows = rows.filter(r => r.model.trim())
    if (validRows.length === 0) { setError('Agrega al menos un modelo'); return }
    setLoading(true); setError('')
    const payload = validRows.map(r => ({
      brand,
      model: r.model,
      color: r.color || undefined,
      serialNumber: r.serialNumber || undefined,
      imei: r.imei || undefined,
      storeId,
    }))
    const res = await fetch('/api/samples', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/samples')
    } else {
      setError((await res.json()).error ?? 'Error')
    }
  }

  const scanningRowIndex = rows.findIndex(r => r.scanningImei)

  return (
    <>
      {/* Barcode scanner overlay */}
      {scanSingle && (
        <BarcodeScanner
          onScan={v => { const d = v.replace(/\D/g, ''); setSingleField('imei', d.length >= 15 ? d.slice(-15) : d); setScanSingle(false) }}
          onClose={() => setScanSingle(false)}
        />
      )}
      {scanningRowIndex >= 0 && (
        <BarcodeScanner
          onScan={v => handleBulkScan(scanningRowIndex, v)}
          onClose={() => updateRow(scanningRowIndex, 'scanningImei', false)}
        />
      )}

      {/* Mode toggle */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-5">
        <button
          type="button"
          onClick={() => setBulk(false)}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${!bulk ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          Individual
        </button>
        <button
          type="button"
          onClick={() => setBulk(true)}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${bulk ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          Múltiple
        </button>
      </div>

      {/* ── SINGLE MODE ── */}
      {!bulk && (
        <form onSubmit={submitSingle} className="space-y-4 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <Field label="Marca" required><input value={single.brand} onChange={e => setSingleField('brand', e.target.value)} required /></Field>
          <Field label="Modelo" required><input value={single.model} onChange={e => setSingleField('model', e.target.value)} placeholder="ej. Y17s" required /></Field>
          <Field label="Color"><input value={single.color} onChange={e => setSingleField('color', e.target.value)} placeholder="ej. Negro" /></Field>
          <Field label="Número de serie"><input value={single.serialNumber} onChange={e => setSingleField('serialNumber', e.target.value)} placeholder="SN-VV-001" /></Field>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IMEI</label>
            <div className="flex gap-2">
              <input
                value={single.imei}
                onChange={e => setSingleField('imei', e.target.value)}
                placeholder="15 dígitos o escanea"
                inputMode="numeric"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={() => setScanSingle(true)} className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-lg hover:bg-gray-200">📷</button>
            </div>
            {single.imei && <p className="text-xs text-green-600 mt-1">✓ {single.imei}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tienda inicial <span className="text-red-500">*</span></label>
            <select value={single.storeId} onChange={e => setSingleField('storeId', e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-700 text-white rounded-lg py-2.5 font-semibold text-sm disabled:opacity-60 hover:bg-blue-800">
            {loading ? 'Guardando...' : 'Registrar Sample'}
          </button>
        </form>
      )}

      {/* ── BULK MODE ── */}
      {bulk && (
        <form onSubmit={submitBulk} className="space-y-4">
          {/* Shared fields */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aplica a todos</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Marca <span className="text-red-500">*</span></label>
                <input value={brand} onChange={e => setBrand(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tienda <span className="text-red-500">*</span></label>
                <select value={storeId} onChange={e => setStoreId(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-3">
            {rows.map((row, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500">Equipo {i + 1}</p>
                  {rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-sm">✕ Eliminar</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Modelo <span className="text-red-500">*</span></label>
                    <input value={row.model} onChange={e => updateRow(i, 'model', e.target.value)} placeholder="ej. Y17s" required className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                    <input value={row.color} onChange={e => updateRow(i, 'color', e.target.value)} placeholder="ej. Negro" className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">IMEI</label>
                  <div className="flex gap-2">
                    <input
                      value={row.imei}
                      onChange={e => updateRow(i, 'imei', e.target.value)}
                      placeholder="Escanea o escribe"
                      inputMode="numeric"
                      className="flex-1 border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="button" onClick={() => updateRow(i, 'scanningImei', true)} className="bg-gray-100 border border-gray-300 rounded-lg px-2.5 py-2 text-base hover:bg-gray-200">📷</button>
                  </div>
                  {row.imei && <p className="text-xs text-green-600 mt-1">✓ {row.imei}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Número de serie</label>
                  <input value={row.serialNumber} onChange={e => updateRow(i, 'serialNumber', e.target.value)} placeholder="SN-VV-001" className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addRow} className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
            + Agregar equipo
          </button>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-blue-700 text-white rounded-lg py-2.5 font-semibold text-sm disabled:opacity-60 hover:bg-blue-800">
            {loading ? 'Guardando...' : `Registrar ${rows.filter(r => r.model).length || ''} sample${rows.filter(r => r.model).length !== 1 ? 's' : ''}`}
          </button>
        </form>
      )}
    </>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactElement }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>
      {React.cloneElement(children, {
        className: 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
      })}
    </div>
  )
}

import React from 'react'
