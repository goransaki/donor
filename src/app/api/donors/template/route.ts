import { NextResponse } from 'next/server'
import { generateImportTemplate } from '@/lib/donor-import'

/**
 * GET /api/donors/template
 * 
 * Preuzima prazan Excel template za import donora
 */
export async function GET() {
  try {
    const buffer = generateImportTemplate()
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="donori-template.xlsx"',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Template generation error:', error)
    return NextResponse.json(
      { error: 'Грешка при генерисању шаблона' },
      { status: 500 }
    )
  }
}
