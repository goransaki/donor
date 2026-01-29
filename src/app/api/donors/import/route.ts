import { NextRequest, NextResponse } from 'next/server'
import { importDonorsFromExcel, previewDonorsImport, sanitizeParsedDonors } from '@/lib/donor-import-server'

/**
 * POST /api/donors/import
 * 
 * Importuje donore iz Excel fajla
 * 
 * Body: FormData sa poljem 'file' (Excel fajl) i opcionalno 'cityId' (za superadmin)
 * Query param: ?preview=true za validaciju bez importa
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const cityIdStr = formData.get('cityId') as string | null
    const preview = request.nextUrl.searchParams.get('preview') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: 'Фајл није послат' },
        { status: 400 }
      )
    }

    // Provjeri tip fajla
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Фајл мора бити Excel формат (.xlsx или .xls)' },
        { status: 400 }
      )
    }

    // Konvertuj u ArrayBuffer
    const buffer = await file.arrayBuffer()

    // Preview mode - samo validacija
    if (preview) {
      const result = await previewDonorsImport(buffer)
      
      return NextResponse.json({
        success: result.canImport,
        totalRows: result.parseResult.totalRows,
        validCount: result.parseResult.validDonors.length,
        invalidCount: result.parseResult.invalidDonors.length,
        validDonors: sanitizeParsedDonors(result.parseResult.validDonors.slice(0, 10)), // Prvih 10 za preview
        invalidDonors: sanitizeParsedDonors(result.parseResult.invalidDonors),
        errors: result.parseResult.errors,
        warnings: result.parseResult.warnings,
        user: result.user,
      })
    }

    // Import mode
    const cityId = cityIdStr ? parseInt(cityIdStr, 10) : undefined
    const result = await importDonorsFromExcel(buffer, cityId)

    if (!result.success && result.imported === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Импорт није успио',
          details: result,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: result.success,
      message: `Успешно увезено ${result.imported} донора`,
      details: result,
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Грешка при импорту: ' + (error instanceof Error ? error.message : 'Непозната грешка') },
      { status: 500 }
    )
  }
}
