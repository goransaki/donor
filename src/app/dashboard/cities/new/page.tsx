import { getCurrentUser } from '@/lib/auth'
import { requireSuperadmin } from '@/lib/auth'
import CityForm from '@/components/cities/CityForm'
import { redirect } from 'next/navigation'

export default async function NewCityPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  try {
    await requireSuperadmin()
  } catch {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Додај нови град</h1>
      <CityForm />
    </div>
  )
}
