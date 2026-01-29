/**
 * Server-side funkcije za import donora
 * Ove funkcije koriste Supabase server client i autentifikaciju
 */

import { createClient } from './supabase/server'
import { getCurrentUser } from './auth'
import { parseExcelFile, toFormData, ImportResult, ImportSummary, ParsedDonor } from './donor-import'
import { DonorFormData } from '@/types/database'

/**
 * Importuje donore iz Excel fajla u bazu
 * 
 * @param buffer - ArrayBuffer sa sadržajem Excel fajla
 * @param cityId - ID grada za koji se importuju donori (opcionalno za superadmin)
 * @returns ImportSummary sa statistikama importa
 */
export async function importDonorsFromExcel(
  buffer: ArrayBuffer,
  cityId?: number
): Promise<ImportSummary> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [{ row: 0, message: 'Неовлашћен приступ' }],
    }
  }

  // Odredi city_id
  let targetCityId: number
  
  if (user.role === 'admin') {
    // Admin može importovati samo za svoj grad
    if (!user.city_id) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        skipped: 0,
        errors: [{ row: 0, message: 'Админ нема додељен град' }],
      }
    }
    targetCityId = user.city_id
  } else if (user.role === 'superadmin') {
    // Superadmin mora navesti grad ili se koristi proslijeđeni
    if (!cityId) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        skipped: 0,
        errors: [{ row: 0, message: 'Суперадмин мора одабрати град за импорт' }],
      }
    }
    targetCityId = cityId
  } else {
    return {
      success: false,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [{ row: 0, message: 'Непозната корисничка улога' }],
    }
  }

  // Parsiraj Excel fajl
  const parseResult: ImportResult = parseExcelFile(buffer, true)

  if (parseResult.errors.length > 0 && parseResult.validDonors.length === 0) {
    return {
      success: false,
      imported: 0,
      failed: parseResult.invalidDonors.length,
      skipped: 0,
      errors: parseResult.errors.map((msg, idx) => ({ row: idx, message: msg })),
    }
  }

  const supabase = await createClient()
  const errors: { row: number; message: string }[] = []
  let imported = 0
  let failed = 0

  // Dodaj greške iz parsiranja
  parseResult.invalidDonors.forEach(donor => {
    donor._errors.forEach(err => {
      errors.push({ row: donor._rowNumber, message: err })
    })
    failed++
  })

  // Batch insert za bolje performanse
  const BATCH_SIZE = 50
  const validDonors = parseResult.validDonors
  
  for (let i = 0; i < validDonors.length; i += BATCH_SIZE) {
    const batch = validDonors.slice(i, i + BATCH_SIZE)
    const donorsToInsert: DonorFormData[] = batch.map(d => toFormData(d, targetCityId))

    const { data, error } = await supabase
      .from('donor')
      .insert(donorsToInsert)
      .select('id')

    if (error) {
      // Ako batch insert ne uspije, pokušaj jedan po jedan
      for (const donor of batch) {
        const { error: singleError } = await supabase
          .from('donor')
          .insert(toFormData(donor, targetCityId))

        if (singleError) {
          errors.push({
            row: donor._rowNumber,
            message: `Грешка при уносу: ${singleError.message}`,
          })
          failed++
        } else {
          imported++
        }
      }
    } else {
      imported += data?.length || batch.length
    }
  }

  return {
    success: errors.length === 0,
    imported,
    failed,
    skipped: parseResult.invalidDonors.length,
    errors,
  }
}

/**
 * Validira Excel fajl bez importa - vraća preview podataka
 */
export async function previewDonorsImport(
  buffer: ArrayBuffer
): Promise<{
  parseResult: ImportResult
  canImport: boolean
  user: { role: string; city_id: number | null } | null
}> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      parseResult: {
        success: false,
        totalRows: 0,
        validDonors: [],
        invalidDonors: [],
        errors: ['Неовлашћен приступ'],
        warnings: [],
      },
      canImport: false,
      user: null,
    }
  }

  const parseResult = parseExcelFile(buffer, true)

  return {
    parseResult,
    canImport: parseResult.validDonors.length > 0,
    user: {
      role: user.role,
      city_id: user.city_id,
    },
  }
}

/**
 * Uklanja meta polja iz ParsedDonor za slanje klijentu
 */
export function sanitizeParsedDonors(donors: ParsedDonor[]): Array<{
  rowNumber: number
  errors: string[]
  warnings: string[]
  data: Partial<DonorFormData>
}> {
  return donors.map(d => ({
    rowNumber: d._rowNumber,
    errors: d._errors,
    warnings: d._warnings,
    data: {
      name: d.name,
      phone_number: d.phone_number,
      date_of_birth: d.date_of_birth,
      residence_address: d.residence_address,
      blood_type_and_rh_factor: d.blood_type_and_rh_factor,
      number_of_blood_donations: d.number_of_blood_donations,
      date_of_last_donation: d.date_of_last_donation,
      awards_and_honors_received: d.awards_and_honors_received,
      registered_in_chapter: d.registered_in_chapter,
    },
  }))
}
