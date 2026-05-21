'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import clsx from 'clsx'

interface Props {
  role: string
}

const supervisorLinks = [
  { href: '/dashboard', label: 'Inicio', icon: '🏠' },
  { href: '/samples', label: 'Samples', icon: '📱' },
  { href: '/transfers', label: 'Traslados', icon: '🔄' },
  { href: '/historial', label: 'Historial', icon: '📋' },
]

const merchandiserLinks = [
  { href: '/dashboard', label: 'Inicio', icon: '🏠' },
  { href: '/samples', label: 'Mis Samples', icon: '📱' },
  { href: '/transfers', label: 'Traslados', icon: '🔄' },
]

export function BottomNav({ role }: Props) {
  const pathname = usePathname()
  const links = role === 'SUPERVISOR' ? supervisorLinks : merchandiserLinks

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-stretch z-50">
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={clsx(
            'flex-1 flex flex-col items-center justify-center py-2 text-xs gap-0.5 transition-colors',
            pathname.startsWith(link.href) && link.href !== '/dashboard'
              ? 'text-blue-700 font-semibold'
              : pathname === link.href
              ? 'text-blue-700 font-semibold'
              : 'text-gray-500'
          )}
        >
          <span className="text-lg leading-none">{link.icon}</span>
          {link.label}
        </Link>
      ))}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex-1 flex flex-col items-center justify-center py-2 text-xs gap-0.5 text-gray-500 hover:text-red-500 transition-colors"
      >
        <span className="text-lg leading-none">🚪</span>
        Salir
      </button>
    </nav>
  )
}
