import { getCurrentUser } from '@/lib/auth'
import { getDonors } from '@/lib/donors'
import { getCities } from '@/lib/cities'
import DonorsTable from '@/components/donors/DonorsTable'
import Link from 'next/link'

export default async function DonorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; city?: string; bloodType?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) return null

  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1')
  const { donors, total } = await getDonors({
    page,
    limit: 10,
    search: resolvedSearchParams.search,
    cityId: resolvedSearchParams.city ? parseInt(resolvedSearchParams.city) : undefined,
    bloodType: resolvedSearchParams.bloodType,
  })

  const cities = user.role === 'superadmin' ? await getCities() : []

  const totalPages = Math.ceil(total / 10)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-red-600">Донори</h1>
        <div className="flex gap-3">
          <a
            href="/api/donors/export"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Извези
          </a>
          <Link
            href="/dashboard/donors/import"
            className="border border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            Увези из Excel
          </Link>
          <Link
            href="/dashboard/donors/new"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            + Додај донора
          </Link>
        </div>
      </div>

      <DonorsTable
        donors={donors}
        currentPage={page}
        totalPages={totalPages}
        total={total}
        cities={cities}
        userRole={user.role}
        userCityId={user.city_id}
      />
    </div>
  )
}
