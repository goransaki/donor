'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { City } from '@/types/database'

interface CityFormProps {
  city?: City
}

export default function CityForm({ city }: CityFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState(city?.name || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = city ? `/api/cities/${city.id}` : '/api/cities'
      const method = city ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Грешка приликом чувања града')
      }

      router.push('/dashboard/cities')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Грешка приликом чувања града')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="max-w-md">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Назив града <span className="text-red-600">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 bg-white"
            placeholder="нпр. Бања Лука"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Чување...' : city ? 'Сачувај измене' : 'Креирај град'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-900"
        >
          Откажи
        </button>
      </div>
    </form>
  )
}
