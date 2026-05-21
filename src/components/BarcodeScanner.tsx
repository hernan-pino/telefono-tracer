'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library'

interface Props {
  onScan: (value: string) => void
  onClose: () => void
}

const hints = new Map()
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.ITF,
  BarcodeFormat.QR_CODE,
  BarcodeFormat.DATA_MATRIX,
])
hints.set(DecodeHintType.TRY_HARDER, true)

export function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [error, setError] = useState('')
  const [detected, setDetected] = useState<string | null>(null)
  // Hold the latest decoded value while the confirmation modal is open, so
  // the user reviews ONE code instead of seeing it switch as the camera moves.
  const lockedRef = useRef(false)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader(hints)
    readerRef.current = reader

    async function start() {
      try {
        await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          videoRef.current!,
          (result, err) => {
            if (result && !lockedRef.current) {
              lockedRef.current = true
              setDetected(result.getText())
            }
            if (err && !(err instanceof NotFoundException)) {
              // NotFoundException fires continuously while no barcode is visible — ignore it
            }
          },
        )
      } catch (e: any) {
        setError(e?.message ?? 'No se pudo acceder a la cámara')
      }
    }

    start()

    return () => {
      BrowserMultiFormatReader.releaseAllStreams()
    }
  }, [])

  function handleClose() {
    BrowserMultiFormatReader.releaseAllStreams()
    onClose()
  }

  function handleConfirm() {
    if (!detected) return
    BrowserMultiFormatReader.releaseAllStreams()
    onScan(detected)
  }

  function handleRetry() {
    setDetected(null)
    lockedRef.current = false
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <p className="text-white text-sm font-medium">Apuntá al código de barras</p>
        <button
          onClick={handleClose}
          className="text-white text-2xl leading-none px-2"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      {/* Camera */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        {/* Targeting overlay — positioned in the top third so the user can hold the phone
            comfortably without their fingers covering anything important */}
        <div className="absolute inset-x-0 top-[20%] flex items-center justify-center pointer-events-none">
          <div className="w-72 h-24 relative">
            <div className="absolute inset-0 border-2 border-white/30 rounded" />
            {/* Corner marks */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br" />
            {/* Scan line animation — pause when a code is locked for confirmation */}
            {!detected && (
              <div className="absolute left-0 right-0 h-0.5 bg-blue-400 animate-scan" style={{ top: '50%' }} />
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-900 text-red-200 text-sm text-center">
          {error}
          <br />
          <span className="text-xs opacity-75">Verifica que el navegador tenga permiso para acceder a la cámara</span>
        </div>
      )}

      <div className="px-4 py-3 bg-black/80 text-center">
        <p className="text-gray-400 text-xs">
          {detected ? 'Esperando confirmación...' : 'Buscando código...'}
        </p>
      </div>

      {/* ── Confirmation modal (pops up on detection) ── */}
      {detected && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center px-6 z-10">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold text-center">Código detectado</p>
            <p className="mt-3 text-center text-gray-900 font-mono text-lg break-all leading-snug">{detected}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className="border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Reintentar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-500 transition-colors"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
