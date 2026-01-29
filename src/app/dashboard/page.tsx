import { getCurrentUser } from '@/lib/auth'
import { getDonors } from '@/lib/donors'
import { getCities } from '@/lib/cities'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { donors, total } = await getDonors({ limit: 5 })
  const cities = user.role === 'superadmin' ? await getCities() : []

  const stats = {
    totalDonors: total,
    totalCities: user.role === 'superadmin' ? cities.length : 1,
    recentDonors: donors.length,
    userCity: user.city?.name || null,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Контролна табла</h1>
          {user.role === 'admin' && stats.userCity && (
            <p className="text-sm text-gray-500 mt-1">Град: {stats.userCity}</p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 ${user.role === 'superadmin' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {user.role === 'admin' ? 'Укупно донора у мом граду' : 'Укупно донора'}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDonors}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">❤️</span>
            </div>
          </div>
        </div>

        {user.role === 'superadmin' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Градова</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCities}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏙️</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Недавни донори</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.recentDonors}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Donors */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {user.role === 'admin' ? `Недавни донори - ${stats.userCity || 'Мој град'}` : 'Недавни донори'}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Име
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Крвна група
                </th>
                {user.role === 'superadmin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Град
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Телефон
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {user.role === 'admin' 
                      ? `Нема донора у вашем граду${stats.userCity ? ` (${stats.userCity})` : ''}`
                      : 'Нема донора'}
                  </td>
                </tr>
              ) : (
                donors.map((donor) => (
                  <tr key={donor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-red-600 text-sm font-semibold">
                            {donor.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{donor.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donor.blood_type_and_rh_factor || '-'}
                    </td>
                    {user.role === 'superadmin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {donor.city?.name || '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donor.phone_number}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
