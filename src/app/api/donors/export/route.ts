import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { generateDonorsExport } from '@/lib/donor-import'
import { DonorFormData } from '@/types/database'

/**
 * GET /api/donors/export
 * 
 * Exportuje donore u Excel fajl
 * 
 * Query params:
 * - cityId: ID grada (opciono, za superadmin)
 * - search: Pretraga po imenu/telefonu
 * - bloodType: Filter po krvnoj grupi
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Неовлашћен приступ' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const { searchParams } = request.nextUrl
    const cityIdParam = searchParams.get('cityId')
    const search = searchParams.get('search')
    const bloodType = searchParams.get('bloodType')

    // Gradi query
    let query = supabase
      .from('donor')
      .select('*')

    // Primijeni filter grada
    if (user.role === 'admin' && user.city_id) {
      query = query.eq('city_id', user.city_id)
    } else if (cityIdParam) {
      query = query.eq('city_id', parseInt(cityIdParam, 10))
    }

    // Primijeni pretragu
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone_number.ilike.%${search}%`)
    }

    // Primijeni filter krvne grupe
    if (bloodType) {
      query = query.eq('blood_type_and_rh_factor', bloodType)
    }

    // Sortiraj
    query = query.order('name', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('Export query error:', error)
      return NextResponse.json(
        { error: 'Грешка при дохватању података' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Нема података за експорт' },
        { status: 404 }
      )
    }

    // Konvertuj u format za export
    const donorsForExport: DonorFormData[] = data.map(d => ({
      name: d.name,
      phone_number: d.phone_number,
      date_of_birth: d.date_of_birth,
      residence_address: d.residence_address,
      blood_type_and_rh_factor: d.blood_type_and_rh_factor,
      number_of_blood_donations: d.number_of_blood_donations,
      date_of_last_donation: d.date_of_last_donation,
      awards_and_honors_received: d.awards_and_honors_received,
      registered_in_chapter: d.registered_in_chapter,
    }))

    const buffer = generateDonorsExport(donorsForExport)
    
    // Generiši ime fajla sa datumom
    const date = new Date().toISOString().split('T')[0]
    const filename = `donori-${date}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Грешка при експорту: ' + (error instanceof Error ? error.message : 'Непозната грешка') },
      { status: 500 }
    )
  }
}
