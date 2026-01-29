import { createClient } from './supabase/server'
import { UserProfile } from '@/types/database'

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('user_profile')
    .select('*, city:city_id(*)')
    .eq('id', user.id)
    .single()

  return profile as UserProfile | null
}

export async function isSuperadmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'superadmin'
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireSuperadmin() {
  const user = await requireAuth()
  if (user.role !== 'superadmin') {
    throw new Error('Forbidden')
  }
  return user
}
