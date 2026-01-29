import { getCurrentUser } from '@/lib/auth'
import { getUsers } from '@/lib/users'
import { requireSuperadmin } from '@/lib/auth'
import UsersTable from '@/components/users/UsersTable'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  try {
    await requireSuperadmin()
  } catch {
    redirect('/dashboard')
  }

  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Корисници</h1>
        <Link
          href="/dashboard/users/new"
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          + Додај корисника
        </Link>
      </div>

      <UsersTable users={users} />
    </div>
  )
}
