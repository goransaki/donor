import { getCurrentUser } from '@/lib/auth'
import { getCities } from '@/lib/cities'
import DonorForm from '@/components/donors/DonorForm'
import { redirect } from 'next/navigation'

export default async function NewDonorPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const cities = user.role === 'superadmin' ? await getCities() : []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Додај новог донора</h1>
      <DonorForm cities={cities} userRole={user.role} userCityId={user.city_id} />
    </div>
  )
}
