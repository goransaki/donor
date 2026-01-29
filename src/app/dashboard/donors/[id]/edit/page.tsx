import { getCurrentUser } from '@/lib/auth'
import { getDonor } from '@/lib/donors'
import { getCities } from '@/lib/cities'
import DonorForm from '@/components/donors/DonorForm'
import { notFound, redirect } from 'next/navigation'

export default async function EditDonorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  try {
    const { id } = await params
    const donor = await getDonor(parseInt(id))
    if (!donor) {
      notFound()
    }

    const cities = user.role === 'superadmin' ? await getCities() : []

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Измени донора</h1>
        <DonorForm donor={donor} cities={cities} userRole={user.role} userCityId={user.city_id} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
