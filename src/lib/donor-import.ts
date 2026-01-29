/**
 * Donor Import Utility
 * 
 * Ovaj util omogućava import donora iz Excel fajla (.xlsx)
 * Mapiranje polja je identično kao u staroj DDK aplikaciji (Yii2)
 * 
 * Excel format (kolone A-I):
 * A: Име (очево име) Презиме → name
 * B: Датум рођења → date_of_birth
 * C: Адреса становања → residence_address
 * D: КГ и РХ фактор → blood_type_and_rh_factor
 * E: Број даривања крви → number_of_blood_donations
 * F: Датум задњег даривања → date_of_last_donation
 * G: Признања и одликовања које је ДДК добио → awards_and_honors_received
 * H: ООЦК/ГОЦК у којој је регистрован → registered_in_chapter
 * I: Бр. Телефона → phone_number
 */

import * as XLSX from 'xlsx'
import { DonorFormData } from '@/types/database'

/**
 * Konstante za mapiranje Excel kolona na polja u bazi
 * Koristi se za jasnoću i održavanje
 */
export const EXCEL_COLUMN_MAPPING = {
  A: 'name',
  B: 'date_of_birth',
  C: 'residence_address',
  D: 'blood_type_and_rh_factor',
  E: 'number_of_blood_donations',
  F: 'date_of_last_donation',
  G: 'awards_and_honors_received',
  H: 'registered_in_chapter',
  I: 'phone_number',
} as const

/**
 * Zaglavlja kolona u Excel fajlu (ćirilica)
 * Koriste se za export i validaciju
 */
export const EXCEL_HEADERS = {
  A: 'Име (очево име) Презиме',
  B: 'Датум рођења',
  C: 'Адреса становања',
  D: 'КГ и РХ фактор',
  E: 'Број даривања крви',
  F: 'Датум задњег даривања',
  G: 'Признања и одликовања које је ДДК добио',
  H: 'ООЦК/ГОЦК у којој је регистрован',
  I: 'Бр. Телефона',
} as const

/**
 * Tipovi za rezultat parsiranja
 */
export interface ParsedDonor extends DonorFormData {
  _rowNumber: number // Broj reda u Excel fajlu (za error reporting)
  _errors: string[] // Lista grešaka za ovaj red
  _warnings: string[] // Lista upozorenja za ovaj red
}

export interface ImportResult {
  success: boolean
  totalRows: number
  validDonors: ParsedDonor[]
  invalidDonors: ParsedDonor[]
  errors: string[]
  warnings: string[]
}

export interface ImportSummary {
  success: boolean
  imported: number
  failed: number
  skipped: number
  errors: { row: number; message: string }[]
}

/**
 * Validira krvnu grupu i RH faktor
 * Prihvatljivi formati: A+, A-, B+, B-, AB+, AB-, O+, O-, 0+, 0-
 */
export function validateBloodType(value: string | null | undefined): boolean {
  if (!value) return false
  
  // Normalizuj vrijednost (ukloni razmake, uppercase)
  const normalized = value.toString().trim().toUpperCase()
  
  // Prihvatljive krvne grupe
  const validBloodTypes = [
    'A+', 'A-', 'A POS', 'A NEG', 'A POZITIVAN', 'A NEGATIVAN',
    'B+', 'B-', 'B POS', 'B NEG', 'B POZITIVAN', 'B NEGATIVAN',
    'AB+', 'AB-', 'AB POS', 'AB NEG', 'AB POZITIVAN', 'AB NEGATIVAN',
    'O+', 'O-', 'O POS', 'O NEG', 'O POZITIVAN', 'O NEGATIVAN',
    '0+', '0-', '0 POS', '0 NEG', '0 POZITIVAN', '0 NEGATIVAN',
  ]
  
  return validBloodTypes.some(bt => normalized.includes(bt.replace(' ', '')))
}

/**
 * Validira broj telefona
 * Prihvata različite formate sa ili bez pozivnog broja
 */
export function validatePhoneNumber(value: string | null | undefined): boolean {
  if (!value) return false
  
  // Ukloni sve osim brojeva i + znaka
  const cleaned = value.toString().replace(/[^\d+]/g, '')
  
  // Minimalno 6 cifara
  return cleaned.replace('+', '').length >= 6
}

/**
 * Normalizuje broj telefona - uklanja nepotrebne karaktere
 */
export function normalizePhoneNumber(value: string | null | undefined): string {
  if (!value) return ''
  
  // Zadrži samo brojeve, + i razmake za čitljivost
  return value.toString().trim()
}

/**
 * Parsira datum iz različitih formata
 * Vraća string u formatu koji je kompatibilan sa bazom
 */
export function parseDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  // Ako je već string, vrati ga
  if (typeof value === 'string') {
    return value.trim() || null
  }

  // Ako je broj (Excel serial date)
  if (typeof value === 'number') {
    try {
      // Excel datumi su broj dana od 1.1.1900
      const date = XLSX.SSF.parse_date_code(value)
      if (date) {
        const day = String(date.d).padStart(2, '0')
        const month = String(date.m).padStart(2, '0')
        const year = date.y
        return `${day}.${month}.${year}`
      }
    } catch {
      return String(value)
    }
  }

  // Ako je Date objekat
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, '0')
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const year = value.getFullYear()
    return `${day}.${month}.${year}`
  }

  return String(value).trim() || null
}

/**
 * Parsira broj donacija iz različitih formata
 */
export function parseNumberOfDonations(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    // Pokušaj parsirati kao broj
    const parsed = parseFloat(value.replace(',', '.'))
    return isNaN(parsed) ? null : parsed
  }

  return null
}

/**
 * Čisti i normalizuje string vrijednost
 */
export function cleanString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const str = String(value).trim()
  return str === '' ? null : str
}

/**
 * Mapira jedan red iz Excel fajla na ParsedDonor objekat
 */
export function mapExcelRowToDonor(
  row: Record<string, unknown>,
  rowNumber: number
): ParsedDonor {
  const errors: string[] = []
  const warnings: string[] = []

  // Izvlači vrijednosti iz reda
  const name = cleanString(row['A'])
  const dateOfBirth = parseDate(row['B'])
  const residenceAddress = cleanString(row['C'])
  const bloodType = cleanString(row['D'])
  const numberOfDonations = parseNumberOfDonations(row['E'])
  const dateOfLastDonation = parseDate(row['F'])
  const awards = cleanString(row['G'])
  const registeredInChapter = cleanString(row['H'])
  const phoneNumber = cleanString(row['I'])

  // Validacija obaveznih polja
  if (!name) {
    errors.push('Ime je obavezno polje')
  }

  if (!phoneNumber) {
    errors.push('Broj telefona je obavezno polje')
  } else if (!validatePhoneNumber(phoneNumber)) {
    warnings.push('Broj telefona ima neobičan format')
  }

  if (!bloodType) {
    errors.push('Krvna grupa je obavezno polje')
  } else if (!validateBloodType(bloodType)) {
    warnings.push('Krvna grupa ima neobičan format')
  }

  return {
    name: name,
    date_of_birth: dateOfBirth,
    residence_address: residenceAddress,
    blood_type_and_rh_factor: bloodType,
    number_of_blood_donations: numberOfDonations,
    date_of_last_donation: dateOfLastDonation,
    awards_and_honors_received: awards,
    registered_in_chapter: registeredInChapter,
    phone_number: normalizePhoneNumber(phoneNumber) || '',
    _rowNumber: rowNumber,
    _errors: errors,
    _warnings: warnings,
  }
}

/**
 * Parsira Excel fajl i vraća listu donora
 * 
 * @param buffer - Buffer sa sadržajem Excel fajla
 * @param skipFirstRow - Da li preskočiti prvi red (zaglavlje) - default: true
 * @returns ImportResult sa validnim i nevalidnim donorima
 */
export function parseExcelFile(
  buffer: ArrayBuffer,
  skipFirstRow: boolean = true
): ImportResult {
  const errors: string[] = []
  const warnings: string[] = []
  const validDonors: ParsedDonor[] = []
  const invalidDonors: ParsedDonor[] = []

  try {
    // Učitaj workbook
    const workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: false, // Zadrži datume kao Excel serial numbers za bolju kontrolu
      cellNF: true, // Zadrži format brojeva
      cellText: true, // Zadrži tekst
    })

    // Uzmi prvi sheet
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return {
        success: false,
        totalRows: 0,
        validDonors: [],
        invalidDonors: [],
        errors: ['Excel fajl ne sadrži nijedan sheet'],
        warnings: [],
      }
    }

    const sheet = workbook.Sheets[sheetName]

    // Konvertuj u array of arrays
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      header: 'A', // Koristi slova kolona kao ključeve
      defval: null, // Default vrijednost za prazne ćelije
      raw: true, // Zadrži originalne vrijednosti
    })

    if (data.length === 0) {
      return {
        success: false,
        totalRows: 0,
        validDonors: [],
        invalidDonors: [],
        errors: ['Excel fajl je prazan'],
        warnings: [],
      }
    }

    // Procesiraj redove
    const startIndex = skipFirstRow ? 1 : 0
    let totalRows = 0

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i]
      totalRows++

      // Preskoči potpuno prazne redove
      const hasAnyValue = Object.values(row).some(v => v !== null && v !== '' && v !== undefined)
      if (!hasAnyValue) {
        continue
      }

      const donor = mapExcelRowToDonor(row, i + 1) // +1 jer Excel redovi počinju od 1

      if (donor._errors.length > 0) {
        invalidDonors.push(donor)
      } else {
        validDonors.push(donor)
      }

      // Skupi upozorenja
      if (donor._warnings.length > 0) {
        donor._warnings.forEach(w => {
          warnings.push(`Red ${donor._rowNumber}: ${w}`)
        })
      }
    }

    return {
      success: invalidDonors.length === 0,
      totalRows,
      validDonors,
      invalidDonors,
      errors,
      warnings,
    }
  } catch (error) {
    return {
      success: false,
      totalRows: 0,
      validDonors: [],
      invalidDonors: [],
      errors: [`Greška pri čitanju Excel fajla: ${error instanceof Error ? error.message : 'Nepoznata greška'}`],
      warnings: [],
    }
  }
}

/**
 * Konvertuje ParsedDonor u DonorFormData (uklanja meta polja)
 */
export function toFormData(donor: ParsedDonor, cityId: number): DonorFormData {
  return {
    name: donor.name,
    phone_number: donor.phone_number,
    date_of_birth: donor.date_of_birth,
    residence_address: donor.residence_address,
    blood_type_and_rh_factor: donor.blood_type_and_rh_factor,
    number_of_blood_donations: donor.number_of_blood_donations,
    date_of_last_donation: donor.date_of_last_donation,
    awards_and_honors_received: donor.awards_and_honors_received,
    registered_in_chapter: donor.registered_in_chapter,
    city_id: cityId,
  }
}

/**
 * Generiše prazan Excel template za import
 */
export function generateImportTemplate(): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  
  // Kreiraj sheet sa zaglavljem
  const headers = [
    [
      EXCEL_HEADERS.A,
      EXCEL_HEADERS.B,
      EXCEL_HEADERS.C,
      EXCEL_HEADERS.D,
      EXCEL_HEADERS.E,
      EXCEL_HEADERS.F,
      EXCEL_HEADERS.G,
      EXCEL_HEADERS.H,
      EXCEL_HEADERS.I,
    ],
  ]
  
  const sheet = XLSX.utils.aoa_to_sheet(headers)
  
  // Postavi širinu kolona
  sheet['!cols'] = [
    { wch: 30 }, // A - Ime
    { wch: 15 }, // B - Datum rođenja
    { wch: 30 }, // C - Adresa
    { wch: 15 }, // D - KG i RH
    { wch: 10 }, // E - Broj donacija
    { wch: 20 }, // F - Datum zadnjeg darivanja
    { wch: 40 }, // G - Priznanja
    { wch: 30 }, // H - Registrovan u
    { wch: 20 }, // I - Telefon
  ]
  
  XLSX.utils.book_append_sheet(workbook, sheet, 'Донори')
  
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
}

/**
 * Generiše Excel fajl od liste donora (export)
 */
export function generateDonorsExport(donors: DonorFormData[]): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  
  // Kreiraj podatke sa zaglavljem
  const data = [
    [
      EXCEL_HEADERS.A,
      EXCEL_HEADERS.B,
      EXCEL_HEADERS.C,
      EXCEL_HEADERS.D,
      EXCEL_HEADERS.E,
      EXCEL_HEADERS.F,
      EXCEL_HEADERS.G,
      EXCEL_HEADERS.H,
      EXCEL_HEADERS.I,
    ],
    ...donors.map(donor => [
      donor.name || '',
      donor.date_of_birth || '',
      donor.residence_address || '',
      donor.blood_type_and_rh_factor || '',
      donor.number_of_blood_donations ?? '',
      donor.date_of_last_donation || '',
      donor.awards_and_honors_received || '',
      donor.registered_in_chapter || '',
      donor.phone_number || '',
    ]),
  ]
  
  const sheet = XLSX.utils.aoa_to_sheet(data)
  
  // Postavi širinu kolona
  sheet['!cols'] = [
    { wch: 30 }, // A - Ime
    { wch: 15 }, // B - Datum rođenja
    { wch: 30 }, // C - Adresa
    { wch: 15 }, // D - KG i RH
    { wch: 10 }, // E - Broj donacija
    { wch: 20 }, // F - Datum zadnjeg darivanja
    { wch: 40 }, // G - Priznanja
    { wch: 30 }, // H - Registrovan u
    { wch: 20 }, // I - Telefon
  ]
  
  XLSX.utils.book_append_sheet(workbook, sheet, 'Донори')
  
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
}
