import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import DashboardClient from '@/components/layout/DashboardClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return <DashboardClient user={user}>{children}</DashboardClient>
}
