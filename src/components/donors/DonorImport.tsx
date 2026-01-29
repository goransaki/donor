'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { City } from '@/types/database'

interface PreviewDonor {
  rowNumber: number
  errors: string[]
  warnings: string[]
  data: {
    name?: string | null
    phone_number?: string
    date_of_birth?: string | null
    residence_address?: string | null
    blood_type_and_rh_factor?: string | null
    number_of_blood_donations?: number | null
    date_of_last_donation?: string | null
    awards_and_honors_received?: string | null
    registered_in_chapter?: string | null
  }
}

interface PreviewResult {
  success: boolean
  totalRows: number
  validCount: number
  invalidCount: number
  validDonors: PreviewDonor[]
  invalidDonors: PreviewDonor[]
  errors: string[]
  warnings: string[]
  user: {
    role: string
    city_id: number | null
  } | null
}

interface ImportResult {
  success: boolean
  message?: string
  error?: string
  details: {
    imported: number
    failed: number
    skipped: number
    errors: { row: number; message: string }[]
  }
}

interface DonorImportProps {
  cities: City[]
  userRole: 'superadmin' | 'admin'
  userCityId: number | null
}

export default function DonorImport({ cities, userRole, userCityId }: DonorImportProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCityId, setSelectedCityId] = useState<string>(userCityId?.toString() || '')
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreview(null)
      setImportResult(null)
      setError(null)
    }
  }

  const handlePreview = async () => {
    if (!selectedFile) {
      setError('Молимо изаберите фајл')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/donors/import?preview=true', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Грешка при валидацији фајла')
        return
      }

      setPreview(result)
    } catch (err) {
      setError('Грешка при комуникацији са сервером')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Молимо изаберите фајл')
      return
    }

    if (userRole === 'superadmin' && !selectedCityId) {
      setError('Молимо изаберите град за импорт')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (selectedCityId) {
        formData.append('cityId', selectedCityId)
      }

      const response = await fetch('/api/donors/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setImportResult(result.details ? result : null)
        setError(result.error || 'Грешка при импорту')
        return
      }

      setImportResult(result.details)
      
      // Ako je sve uspješno, osveži listu donora nakon 2 sekunde
      if (result.details?.imported > 0) {
        setTimeout(() => {
          router.push('/dashboard/donors')
          router.refresh()
        }, 2000)
      }
    } catch (err) {
      setError('Грешка при комуникацији са сервером')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreview(null)
    setImportResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownloadTemplate = () => {
    window.location.href = '/api/donors/template'
  }

  return (
    <div className="space-y-6">
      {/* Instrukcije */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Упутство за импорт</h3>
        <p className="text-blue-800 text-sm mb-3">
          Excel фајл треба да има следеће колоне у редоследу A-I:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-blue-700">
          <div><span className="font-medium">A:</span> Име (очево име) Презиме</div>
          <div><span className="font-medium">B:</span> Датум рођења</div>
          <div><span className="font-medium">C:</span> Адреса становања</div>
          <div><span className="font-medium">D:</span> КГ и РХ фактор *</div>
          <div><span className="font-medium">E:</span> Број даривања крви</div>
          <div><span className="font-medium">F:</span> Датум задњег даривања</div>
          <div><span className="font-medium">G:</span> Признања и одликовања</div>
          <div><span className="font-medium">H:</span> ООЦК/ГОЦК</div>
          <div><span className="font-medium">I:</span> Број телефона *</div>
        </div>
        <p className="text-blue-600 text-xs mt-2">* Обавезна поља</p>
        <button
          onClick={handleDownloadTemplate}
          className="mt-3 text-blue-700 hover:text-blue-900 text-sm font-medium underline"
        >
          Преузми празан шаблон
        </button>
      </div>

      {/* File upload */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {/* City selector for superadmin */}
          {userRole === 'superadmin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Град за импорт *
              </label>
              <select
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 bg-white"
              >
                <option value="">Изаберите град</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* File input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excel фајл (.xlsx)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
            />
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Изабран фајл: {selectedFile.name}</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePreview}
              disabled={!selectedFile || isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Учитавање...' : 'Валидирај'}
            </button>
            {preview && preview.validCount > 0 && (
              <button
                onClick={handleImport}
                disabled={isLoading || (userRole === 'superadmin' && !selectedCityId)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Увозим...' : `Увези ${preview.validCount} донора`}
              </button>
            )}
            {(preview || importResult) && (
              <button
                onClick={handleReset}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Поништи
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview results */}
      {preview && !importResult && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4">Резултат валидације</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{preview.totalRows}</div>
              <div className="text-sm text-gray-600">Укупно редова</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{preview.validCount}</div>
              <div className="text-sm text-gray-600">Валидних</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{preview.invalidCount}</div>
              <div className="text-sm text-gray-600">Са грешкама</div>
            </div>
          </div>

          {/* Invalid donors */}
          {preview.invalidDonors.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-red-700 mb-2">Редови са грешкама:</h4>
              <div className="max-h-64 overflow-y-auto border border-red-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-red-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-red-800">Ред</th>
                      <th className="px-4 py-2 text-left text-red-800">Име</th>
                      <th className="px-4 py-2 text-left text-red-800">Телефон</th>
                      <th className="px-4 py-2 text-left text-red-800">Грешке</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {preview.invalidDonors.map((donor) => (
                      <tr key={donor.rowNumber} className="text-gray-700">
                        <td className="px-4 py-2">{donor.rowNumber}</td>
                        <td className="px-4 py-2">{donor.data.name || '-'}</td>
                        <td className="px-4 py-2">{donor.data.phone_number || '-'}</td>
                        <td className="px-4 py-2 text-red-600">{donor.errors.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Valid donors preview */}
          {preview.validDonors.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 mb-2">
                Преглед валидних записа (приказано првих {preview.validDonors.length}):
              </h4>
              <div className="max-h-64 overflow-y-auto border border-green-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-green-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-green-800">Ред</th>
                      <th className="px-4 py-2 text-left text-green-800">Име</th>
                      <th className="px-4 py-2 text-left text-green-800">КГ</th>
                      <th className="px-4 py-2 text-left text-green-800">Телефон</th>
                      <th className="px-4 py-2 text-left text-green-800">Број даривања</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-100">
                    {preview.validDonors.map((donor) => (
                      <tr key={donor.rowNumber} className="text-gray-700">
                        <td className="px-4 py-2">{donor.rowNumber}</td>
                        <td className="px-4 py-2">{donor.data.name || '-'}</td>
                        <td className="px-4 py-2">{donor.data.blood_type_and_rh_factor || '-'}</td>
                        <td className="px-4 py-2">{donor.data.phone_number || '-'}</td>
                        <td className="px-4 py-2">{donor.data.number_of_blood_donations ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Warnings */}
          {preview.warnings.length > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Упозорења:</h4>
              <ul className="list-disc list-inside text-sm text-yellow-700">
                {preview.warnings.slice(0, 10).map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
                {preview.warnings.length > 10 && (
                  <li className="text-yellow-600">...и још {preview.warnings.length - 10} упозорења</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Import results */}
      {importResult && importResult.details && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4">Резултат импорта</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{importResult.details.imported}</div>
              <div className="text-sm text-gray-600">Успешно увезено</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{importResult.details.failed}</div>
              <div className="text-sm text-gray-600">Неуспешно</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{importResult.details.skipped}</div>
              <div className="text-sm text-gray-600">Прескочено</div>
            </div>
          </div>

          {importResult.details.imported > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-center">
              Успешно увезено {importResult.details.imported} донора! Преусмеравам на листу донора...
            </div>
          )}

          {importResult.details.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-700 mb-2">Грешке при импорту:</h4>
              <div className="max-h-48 overflow-y-auto border border-red-200 rounded-lg p-4 bg-red-50">
                <ul className="list-disc list-inside text-sm text-red-600">
                  {importResult.details.errors.map((err, idx) => (
                    <li key={idx}>Ред {err.row}: {err.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
