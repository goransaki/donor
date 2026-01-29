import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createDonor } from '@/lib/donors'

export async function POST(request: NextRequest) {
  try {
    await getCurrentUser()
    const body = await request.json()
    
    // Clean numeric fields to prevent NaN from reaching database
    const cleanDecimalField = (value: any): number | null => {
      if (value === null || value === undefined || value === '') {
        return null
      }
      if (value === 'NaN' || String(value).toUpperCase() === 'NAN') {
        return null
      }
      const num = Number(value)
      if (isNaN(num) || !isFinite(num)) {
        return null
      }
      return Math.round(num * 100) / 100
    }
    
    const cleanIntegerField = (value: any): number | null => {
      if (value === null || value === undefined || value === '') {
        return null
      }
      if (value === 'NaN' || String(value).toUpperCase() === 'NAN') {
        return null
      }
      const num = Number(value)
      if (isNaN(num) || !isFinite(num)) {
        return null
      }
      return Math.floor(num)
    }
    
    // Helper to clean string fields (convert empty strings to null)
    const cleanStringField = (value: any): string | null => {
      if (value === null || value === undefined) {
        return null
      }
      const str = String(value).trim()
      return str === '' ? null : str
    }
    
    // Prepare clean payload
    const cleanPayload: any = {
      name: cleanStringField(body.name),
      phone_number: body.phone_number, // Required field
      date_of_birth: cleanStringField(body.date_of_birth),
      residence_address: cleanStringField(body.residence_address),
      blood_type_and_rh_factor: cleanStringField(body.blood_type_and_rh_factor),
      date_of_last_donation: cleanStringField(body.date_of_last_donation),
      awards_and_honors_received: cleanStringField(body.awards_and_honors_received),
      registered_in_chapter: cleanStringField(body.registered_in_chapter),
      number_of_blood_donations: cleanDecimalField(body.number_of_blood_donations),
      serial_number: cleanDecimalField(body.serial_number),
      city_id: cleanIntegerField(body.city_id),
    }
    
    const donor = await createDonor(cleanPayload)
    return NextResponse.json(donor)
  } catch (error: any) {
    console.error('Error creating donor:', error)
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
