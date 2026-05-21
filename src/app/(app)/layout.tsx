import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { SessionProvider } from '@/components/SessionProvider'
import { BottomNav } from '@/components/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col pb-16">
        <main className="flex-1 overflow-y-auto">{children}</main>
        <BottomNav role={(session.user as any).role} />
      </div>
    </SessionProvider>
  )
}
