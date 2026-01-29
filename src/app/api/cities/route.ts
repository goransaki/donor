import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/auth'
import { createCity } from '@/lib/cities'

export async function POST(request: NextRequest) {
  try {
    await requireSuperadmin()
    const body = await request.json()
    const city = await createCity(body.name)
    return NextResponse.json(city)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
