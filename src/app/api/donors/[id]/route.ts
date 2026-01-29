import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { updateDonor, deleteDonor } from '@/lib/donors'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUser()
    const { id } = await params
    const body = await request.json()
    
    // Clean numeric fields to prevent NaN from reaching database
    // DECIMAL fields can have decimal values, INTEGER fields must be whole numbers
    const cleanDecimalField = (value: any): number | null => {
      if (value === null || value === undefined || value === '') {
        return null
      }
      // Check for string "NaN"
      if (value === 'NaN' || String(value).toUpperCase() === 'NAN') {
        return null
      }
      const num = Number(value)
      if (isNaN(num) || !isFinite(num)) {
        return null
      }
      // Keep decimal values for DECIMAL(10,2) fields, round to 2 decimals
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
    
    // Prepare clean payload with only valid fields
    const cleanPayload: any = {}
    
    // String fields - convert empty strings to null
    if ('name' in body && body.name !== undefined) {
      cleanPayload.name = cleanStringField(body.name)
    }
    if ('phone_number' in body) {
      cleanPayload.phone_number = body.phone_number // Required field, keep as is
    }
    if ('date_of_birth' in body && body.date_of_birth !== undefined) {
      cleanPayload.date_of_birth = cleanStringField(body.date_of_birth)
    }
    if ('residence_address' in body && body.residence_address !== undefined) {
      cleanPayload.residence_address = cleanStringField(body.residence_address)
    }
    if ('blood_type_and_rh_factor' in body && body.blood_type_and_rh_factor !== undefined) {
      cleanPayload.blood_type_and_rh_factor = cleanStringField(body.blood_type_and_rh_factor)
    }
    if ('date_of_last_donation' in body && body.date_of_last_donation !== undefined) {
      cleanPayload.date_of_last_donation = cleanStringField(body.date_of_last_donation)
    }
    if ('awards_and_honors_received' in body && body.awards_and_honors_received !== undefined) {
      cleanPayload.awards_and_honors_received = cleanStringField(body.awards_and_honors_received)
    }
    if ('registered_in_chapter' in body && body.registered_in_chapter !== undefined) {
      cleanPayload.registered_in_chapter = cleanStringField(body.registered_in_chapter)
    }
    
    // DECIMAL fields (can have decimals)
    if ('number_of_blood_donations' in body) {
      cleanPayload.number_of_blood_donations = cleanDecimalField(body.number_of_blood_donations)
    }
    if ('serial_number' in body) {
      cleanPayload.serial_number = cleanDecimalField(body.serial_number)
    }
    
    // INTEGER fields (must be whole numbers)
    if ('city_id' in body) {
      cleanPayload.city_id = cleanIntegerField(body.city_id)
    }
    
    const donor = await updateDonor(parseInt(id), cleanPayload)
    return NextResponse.json(donor)
  } catch (error: any) {
    console.error('Error updating donor:', error)
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUser()
    const { id } = await params
    await deleteDonor(parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
