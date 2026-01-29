import { getCurrentUser } from '@/lib/auth'
import { getCities } from '@/lib/cities'
import { requireSuperadmin } from '@/lib/auth'
import UserForm from '@/components/users/UserForm'
import { redirect } from 'next/navigation'

export default async function NewUserPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  try {
    await requireSuperadmin()
  } catch {
    redirect('/dashboard')
  }

  const cities = await getCities()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Додај новог корисника</h1>
      <UserForm cities={cities} />
    </div>
  )
}
