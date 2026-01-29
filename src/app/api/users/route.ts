import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/auth'
import { createUser } from '@/lib/users'

export async function POST(request: NextRequest) {
  try {
    await requireSuperadmin()
    const body = await request.json()
    const user = await createUser(body)
    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
