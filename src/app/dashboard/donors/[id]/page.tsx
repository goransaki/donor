import { getCurrentUser } from '@/lib/auth'
import { getDonor } from '@/lib/donors'
import Link from 'next/link'

export default async function DonorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }

  const { id } = await params
  let donor = null
  let errorMessage: string | null = null

  try {
    donor = await getDonor(Number(id))
  } catch (error: any) {
    console.error('Грешка при учитавању донора', error)
    errorMessage = error?.message || 'Грешка при учитавању донора.'
  }

  if (!donor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Детаљи донора</h1>
          <Link
            href="/dashboard/donors"
            className="px-4 py-2 border-2 border-gray-400 rounded-lg hover:bg-gray-100 hover:border-gray-500 transition-colors font-medium text-gray-800 bg-white"
          >
            Назад
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-red-600 mb-2">
            {errorMessage === 'Forbidden'
              ? 'Немате дозволу да видите овог донора.'
              : 'Донор није пронађен или немате дозволу за приступ.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Детаљи донора</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/donors"
            className="px-4 py-2 border-2 border-gray-400 rounded-lg hover:bg-gray-100 hover:border-gray-500 transition-colors font-medium text-gray-800 bg-white"
          >
            Назад
          </Link>
          <Link
            href={`/dashboard/donors/${donor.id}/edit`}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Измени
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Име (очево име) Презиме</label>
            <p className="mt-1 text-lg text-gray-900">{donor.name || '-'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Број телефона</label>
            <p className="mt-1 text-lg text-gray-900">{donor.phone_number}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Датум рођења</label>
            <p className="mt-1 text-lg text-gray-900">{donor.date_of_birth || '-'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Адреса становања</label>
            <p className="mt-1 text-lg text-gray-900">{donor.residence_address || '-'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">КГ и РХ фактор</label>
            <p className="mt-1 text-lg text-gray-900">{donor.blood_type_and_rh_factor || '-'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Број даривања крви</label>
            <p className="mt-1 text-lg text-gray-900">{donor.number_of_blood_donations || '-'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Датум задњег даривања</label>
            <p className="mt-1 text-lg text-gray-900">{donor.date_of_last_donation || '-'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Признања и одликовања</label>
            <p className="mt-1 text-lg text-gray-900">{donor.awards_and_honors_received || '-'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">ООЦК/ГОЦК у којој је регистрован</label>
            <p className="mt-1 text-lg text-gray-900">{donor.registered_in_chapter || '-'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Град</label>
            <p className="mt-1 text-lg text-gray-900">{donor.city?.name || '-'}</p>
          </div>

          {donor.serial_number && (
            <div>
              <label className="text-sm font-medium text-gray-500">Серијски број</label>
              <p className="mt-1 text-lg text-gray-900">{donor.serial_number}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
