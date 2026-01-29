import { createClient } from './supabase/server'
import { Donor, DonorFormData } from '@/types/database'
import { getCurrentUser } from './auth'

export async function getDonors(filters?: {
  cityId?: number
  search?: string
  bloodType?: string
  page?: number
  limit?: number
}): Promise<{ donors: Donor[], total: number }> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  let query = supabase
    .from('donor')
    .select('*, city:city_id(*)', { count: 'exact' })

  // Apply city filter for admin users
  if (user.role === 'admin' && user.city_id) {
    query = query.eq('city_id', user.city_id)
  } else if (filters?.cityId) {
    query = query.eq('city_id', filters.cityId)
  }

  // Apply search filter
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`)
  }

  // Apply blood type filter
  if (filters?.bloodType) {
    query = query.eq('blood_type_and_rh_factor', filters.bloodType)
  }

  // Apply pagination
  const page = filters?.page || 1
  const limit = filters?.limit || 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query.order('created_at', { ascending: false })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  return {
    donors: (data || []) as Donor[],
    total: count || 0
  }
}

export async function getDonor(id: number): Promise<Donor | null> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('donor')
    .select('*, city:city_id(*)')
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  // Check permissions
  if (user.role === 'admin' && user.city_id && data.city_id !== user.city_id) {
    throw new Error('Forbidden')
  }

  return data as Donor
}

export async function createDonor(donorData: DonorFormData): Promise<Donor> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Set city_id for admin users
  if (user.role === 'admin' && user.city_id) {
    donorData.city_id = user.city_id
  }

  const { data, error } = await supabase
    .from('donor')
    .insert(donorData)
    .select('*, city:city_id(*)')
    .single()

  if (error) {
    throw error
  }

  return data as Donor
}

export async function updateDonor(id: number, donorData: Partial<DonorFormData>): Promise<Donor> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check permissions
  if (user.role === 'admin') {
    const existing = await getDonor(id)
    if (existing && existing.city_id !== user.city_id) {
      throw new Error('Forbidden')
    }
    // Prevent admin from changing city_id
    delete donorData.city_id
  }

  // Log the data being sent for debugging
  console.log('Updating donor with data:', JSON.stringify(donorData, null, 2))

  const { data, error } = await supabase
    .from('donor')
    .update(donorData)
    .eq('id', id)
    .select('*, city:city_id(*)')
    .single()

  if (error) {
    console.error('Supabase error:', error)
    throw error
  }

  return data as Donor
}

export async function deleteDonor(id: number): Promise<void> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check permissions
  if (user.role === 'admin') {
    const existing = await getDonor(id)
    if (existing && existing.city_id !== user.city_id) {
      throw new Error('Forbidden')
    }
  }

  const { error } = await supabase
    .from('donor')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}
