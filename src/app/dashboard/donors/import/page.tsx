import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getCities } from '@/lib/cities'
import DonorImport from '@/components/donors/DonorImport'

export default async function DonorsImportPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const cities = await getCities()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Увоз донора</h1>
          <p className="text-gray-600 mt-1">
            Увезите донore из Excel фајла
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/dashboard/donors"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Назад на листу
          </Link>
        </div>
      </div>

      {/* Import component */}
      <DonorImport
        cities={cities}
        userRole={user.role}
        userCityId={user.city_id}
      />
    </div>
  )
}
