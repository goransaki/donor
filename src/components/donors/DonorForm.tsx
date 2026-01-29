'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Donor, City, DonorFormData } from '@/types/database'

interface DonorFormProps {
  donor?: Donor
  cities: City[]
  userRole: 'superadmin' | 'admin'
  userCityId: number | null
}

export default function DonorForm({ donor, cities, userRole, userCityId }: DonorFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Normalize donor data to ensure numeric fields are properly converted
  const normalizeNumericValue = (value: any): number | null => {
    if (value === null || value === undefined || value === '') {
      return null
    }
    const num = typeof value === 'string' ? parseFloat(value) : Number(value)
    if (isNaN(num) || !isFinite(num)) {
      return null
    }
    return Math.floor(num)
  }

  const [formData, setFormData] = useState<DonorFormData>({
    serial_number: normalizeNumericValue(donor?.serial_number),
    name: donor?.name || '',
    phone_number: donor?.phone_number || '',
    date_of_birth: donor?.date_of_birth || '',
    residence_address: donor?.residence_address || '',
    blood_type_and_rh_factor: donor?.blood_type_and_rh_factor || '',
    number_of_blood_donations: normalizeNumericValue(donor?.number_of_blood_donations),
    date_of_last_donation: donor?.date_of_last_donation || '',
    awards_and_honors_received: donor?.awards_and_honors_received || '',
    registered_in_chapter: donor?.registered_in_chapter || '',
    city_id: donor?.city_id !== undefined && donor?.city_id !== null 
      ? normalizeNumericValue(donor.city_id) 
      : (userRole === 'admin' ? userCityId : null),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = donor ? `/api/donors/${donor.id}` : '/api/donors'
      const method = donor ? 'PUT' : 'POST'

      // Očisti numerička polja da ne šaljemo NaN u bazu
      const payload: DonorFormData = { ...formData }
      
      // Clean numeric fields - convert NaN, undefined, or invalid values to null
      if (
        payload.number_of_blood_donations === undefined ||
        payload.number_of_blood_donations === null ||
        Number.isNaN(payload.number_of_blood_donations as any) ||
        (typeof payload.number_of_blood_donations === 'number' && !Number.isFinite(payload.number_of_blood_donations))
      ) {
        payload.number_of_blood_donations = null
      }
      
      if (
        payload.serial_number === undefined ||
        payload.serial_number === null ||
        Number.isNaN(payload.serial_number as any) ||
        (typeof payload.serial_number === 'number' && !Number.isFinite(payload.serial_number))
      ) {
        payload.serial_number = null
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Грешка приликом чувања донора')
      }

      router.push('/dashboard/donors')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Грешка приликом чувања донора')
    } finally {
      setLoading(false)
    }
  }

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Име (очево име) Презиме <span className="text-red-600">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
            Број телефона <span className="text-red-600">*</span>
          </label>
          <input
            id="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="blood_type_and_rh_factor" className="block text-sm font-medium text-gray-700 mb-2">
            КГ и РХ фактор <span className="text-red-600">*</span>
          </label>
          <select
            id="blood_type_and_rh_factor"
            value={formData.blood_type_and_rh_factor || ''}
            onChange={(e) => setFormData({ ...formData, blood_type_and_rh_factor: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 bg-white"
          >
            <option value="">Изабери крвну групу</option>
            {bloodTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {userRole === 'superadmin' && (
          <div>
            <label htmlFor="city_id" className="block text-sm font-medium text-gray-700 mb-2">
              Град
            </label>
            <select
              id="city_id"
              value={formData.city_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, city_id: e.target.value ? parseInt(e.target.value) : null })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 bg-white"
            >
              <option value="">Изабери град</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
            Датум рођења
          </label>
          <input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth || ''}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="residence_address" className="block text-sm font-medium text-gray-700 mb-2">
            Адреса становања
          </label>
          <input
            id="residence_address"
            type="text"
            value={formData.residence_address || ''}
            onChange={(e) => setFormData({ ...formData, residence_address: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="number_of_blood_donations" className="block text-sm font-medium text-gray-700 mb-2">
            Број даривања крви
          </label>
          <input
            id="number_of_blood_donations"
            type="number"
            step="1"
            value={formData.number_of_blood_donations ?? ''}
            onChange={(e) => {
              const value = e.target.value.trim()
              if (value === '') {
                setFormData({ ...formData, number_of_blood_donations: null })
              } else {
                const num = parseInt(value, 10)
                setFormData({
                  ...formData,
                  number_of_blood_donations: !isNaN(num) && isFinite(num) ? num : null,
                })
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="date_of_last_donation" className="block text-sm font-medium text-gray-700 mb-2">
            Датум задњег даривања
          </label>
          <input
            id="date_of_last_donation"
            type="date"
            value={formData.date_of_last_donation || ''}
            onChange={(e) => setFormData({ ...formData, date_of_last_donation: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="awards_and_honors_received" className="block text-sm font-medium text-gray-700 mb-2">
            Признања и одликовања
          </label>
          <input
            id="awards_and_honors_received"
            type="text"
            value={formData.awards_and_honors_received || ''}
            onChange={(e) => setFormData({ ...formData, awards_and_honors_received: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="registered_in_chapter" className="block text-sm font-medium text-gray-700 mb-2">
            ООЦК/ГОЦК у којој је регистрован
          </label>
          <input
            id="registered_in_chapter"
            type="text"
            value={formData.registered_in_chapter || ''}
            onChange={(e) => setFormData({ ...formData, registered_in_chapter: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="serial_number" className="block text-sm font-medium text-gray-700 mb-2">
            Серијски број
          </label>
          <input
            id="serial_number"
            type="number"
            step="1"
            value={formData.serial_number ?? ''}
            onChange={(e) => {
              const value = e.target.value.trim()
              if (value === '') {
                setFormData({ ...formData, serial_number: null })
              } else {
                const num = parseInt(value, 10)
                setFormData({
                  ...formData,
                  serial_number: !isNaN(num) && isFinite(num) ? num : null,
                })
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 bg-white"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Чување...' : donor ? 'Сачувај измене' : 'Креирај донора'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border-2 border-gray-400 rounded-lg hover:bg-gray-100 hover:border-gray-500 transition-colors font-medium text-gray-800 bg-white"
        >
          Откажи
        </button>
      </div>
    </form>
  )
}
