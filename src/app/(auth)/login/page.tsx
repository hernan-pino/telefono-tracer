'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const DEV_USERS = [
  { label: 'Supervisor (todas las tiendas)', email: 'supervisor@vivo.com', password: 'supervisor123', role: 'SUPERVISOR' },
  { label: 'Merchandiser · Tienda Centro', email: 'merch.centro@vivo.com', password: 'merchandiser123', role: 'MERCHANDISER' },
  { label: 'Merchandiser · Tienda Norte', email: 'merch.norte@vivo.com', password: 'merchandiser123', role: 'MERCHANDISER' },
  { label: 'Merchandiser · Tienda Sur', email: 'merch.sur@vivo.com', password: 'merchandiser123', role: 'MERCHANDISER' },
]

// Visible cuando NODE_ENV !== 'production' (dev local) o cuando NEXT_PUBLIC_SHOW_DEMO_USERS === 'true'
// (en Vercel, se controla con la env var, así se puede apagar sin redeploy).
const SHOW_DEV_CREDENTIALS =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_SHOW_DEMO_USERS === 'true'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.ok) {
      router.push('/dashboard')
    } else {
      setError('Email o contraseña incorrectos')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-700 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📱</div>
          <h1 className="text-2xl font-bold text-gray-900">Trazabilidad</h1>
          <p className="text-sm text-gray-500 mt-1">Control de samples de exhibición</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white rounded-lg py-2.5 font-semibold text-sm disabled:opacity-60 hover:bg-blue-800 transition-colors"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {SHOW_DEV_CREDENTIALS && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuarios de prueba (dev)</p>
              <span className="text-[10px] bg-amber-100 text-amber-800 rounded px-1.5 py-0.5">DEV</span>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">Click para autocompletar. Contraseña común: <code className="bg-gray-100 px-1 rounded">supervisor123</code> / <code className="bg-gray-100 px-1 rounded">merchandiser123</code>.</p>
            <ul className="space-y-1.5">
              {DEV_USERS.map(u => (
                <li key={u.email}>
                  <button
                    type="button"
                    onClick={() => { setEmail(u.email); setPassword(u.password); setError('') }}
                    className="w-full text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-2 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-800">{u.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${u.role === 'SUPERVISOR' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{u.role}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 font-mono">{u.email} · {u.password}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
