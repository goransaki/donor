'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Donor, City } from '@/types/database'

interface DonorsTableProps {
  donors: Donor[]
  currentPage: number
  totalPages: number
  total: number
  cities: City[]
  userRole: 'superadmin' | 'admin'
  userCityId: number | null
}

export default function DonorsTable({
  donors,
  currentPage,
  totalPages,
  total,
  cities,
  userRole,
  userCityId,
}: DonorsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [cityFilter, setCityFilter] = useState(searchParams.get('city') || '')
  const [bloodTypeFilter, setBloodTypeFilter] = useState(searchParams.get('bloodType') || '')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [donorToDelete, setDonorToDelete] = useState<Donor | null>(null)

  const handleDeleteClick = (donor: Donor) => {
    setDonorToDelete(donor)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!donorToDelete) return

    setDeletingId(donorToDelete.id)
    try {
      const response = await fetch(`/api/donors/${donorToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Грешка при брисању')
      }
    } catch (error) {
      alert('Грешка при брисању')
    } finally {
      setDeletingId(null)
      setShowDeleteModal(false)
      setDonorToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setDonorToDelete(null)
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (cityFilter) params.set('city', cityFilter)
    if (bloodTypeFilter) params.set('bloodType', bloodTypeFilter)
    params.set('page', '1')
    router.push(`/dashboard/donors?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/dashboard/donors?${params.toString()}`)
  }

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Претражи по имену или телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900"
          />
          {userRole === 'superadmin' && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 bg-white"
            >
              <option value="">Сви градови</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={bloodTypeFilter}
            onChange={(e) => setBloodTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 bg-white"
          >
            <option value="">Све крвне групе</option>
            {bloodTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Претражи
          </button>
        </div>
      </div>

      {/* Table */}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Број даривања
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Последње даривање
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Телефон
              </th>
              {userRole === 'superadmin' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Град
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Акције
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {donors.length === 0 ? (
              <tr>
                <td colSpan={userRole === 'superadmin' ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                  Нема донора за приказ
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donor.number_of_blood_donations ?? '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donor.date_of_last_donation || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donor.phone_number}
                    </td>
                    {userRole === 'superadmin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {donor.city?.name || '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/dashboard/donors/${donor.id}`}
                        className="text-red-600 hover:text-red-900 mr-3"
                      >
                        Погледај
                      </Link>
                      <Link
                        href={`/dashboard/donors/${donor.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Измени
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(donor)}
                        disabled={deletingId === donor.id}
                        className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingId === donor.id ? 'Бришем...' : 'Обриши'}
                      </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Приказано {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, total)} од {total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Претходна
            </button>
            <span className="px-4 py-2 bg-red-600 text-white rounded-lg">
              {currentPage} од {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Следећа
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && donorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Потврда брисања
            </h3>
            <p className="text-gray-600 mb-6">
              Да ли сте сигурни да желите да обришете донора{' '}
              <span className="font-medium text-gray-900">{donorToDelete.name}</span>?
              Ова акција се не може поништити.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Откажи
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingId !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {deletingId !== null ? 'Бришем...' : 'Обриши'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
