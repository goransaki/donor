import { getCurrentUser } from '@/lib/auth'
import { getCities } from '@/lib/cities'
import { requireSuperadmin } from '@/lib/auth'
import CitiesTable from '@/components/cities/CitiesTable'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function CitiesPage() {
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Градови</h1>
        <Link
          href="/dashboard/cities/new"
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          + Додај град
        </Link>
      </div>

      <CitiesTable cities={cities} />
    </div>
  )
}
