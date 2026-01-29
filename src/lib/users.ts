import { createClient, createAdminClient } from './supabase/server'
import { UserProfile } from '@/types/database'
import { requireSuperadmin } from './auth'

export async function getUsers(): Promise<UserProfile[]> {
  await requireSuperadmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_profile')
    .select('*, city:city_id(*)')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data || []) as UserProfile[]
}

export async function createUser(userData: {
  email: string
  username: string
  password: string
  city_id?: number | null
  role?: 'admin' | 'superadmin'
}): Promise<UserProfile> {
  await requireSuperadmin()
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // Create auth user first
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
  })

  if (authError) {
    throw authError
  }

  // Create user profile
  const { data: profileData, error: profileError } = await supabase
    .from('user_profile')
    .insert({
      id: authData.user.id,
      username: userData.username,
      email: userData.email,
      city_id: userData.city_id,
      role: userData.role || 'admin',
      status: 10,
    })
    .select('*, city:city_id(*)')
    .single()

  if (profileError) {
    // Clean up auth user if profile creation fails
    await adminSupabase.auth.admin.deleteUser(authData.user.id)
    throw profileError
  }

  return profileData as UserProfile
}

export async function updateUser(id: string, userData: {
  username?: string
  email?: string
  city_id?: number | null
  role?: 'admin' | 'superadmin'
  status?: 0 | 9 | 10
}): Promise<UserProfile> {
  await requireSuperadmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_profile')
    .update(userData)
    .eq('id', id)
    .select('*, city:city_id(*)')
    .single()

  if (error) {
    throw error
  }

  // Update auth email if changed
  if (userData.email) {
    const adminSupabase = createAdminClient()
    await adminSupabase.auth.admin.updateUserById(id, {
      email: userData.email,
    })
  }

  return data as UserProfile
}

export async function deleteUser(id: string): Promise<void> {
  await requireSuperadmin()
  const adminSupabase = createAdminClient()

  // Delete auth user (this will cascade delete profile due to foreign key)
  const { error } = await adminSupabase.auth.admin.deleteUser(id)

  if (error) {
    throw error
  }
}
