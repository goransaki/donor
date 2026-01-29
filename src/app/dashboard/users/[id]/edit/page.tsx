import { getCurrentUser } from '@/lib/auth'
import { getUsers } from '@/lib/users'
import { getCities } from '@/lib/cities'
import { requireSuperadmin } from '@/lib/auth'
import UserForm from '@/components/users/UserForm'
import { notFound, redirect } from 'next/navigation'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  try {
    await requireSuperadmin()
  } catch {
    redirect('/dashboard')
  }

  const { id } = await params
  const users = await getUsers()
  const userToEdit = users.find((u) => u.id === id)

  if (!userToEdit) {
    notFound()
  }

  const cities = await getCities()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Измени корисника</h1>
      <UserForm user={userToEdit} cities={cities} />
    </div>
  )
}
