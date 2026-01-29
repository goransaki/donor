import { createClient } from './supabase/server'
import { City } from '@/types/database'
import { requireSuperadmin } from './auth'

export async function getCities(): Promise<City[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('city')
    .select('*')
    .order('name')

  if (error) {
    throw error
  }

  return (data || []) as City[]
}

export async function createCity(name: string): Promise<City> {
  await requireSuperadmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('city')
    .insert({ name })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as City
}

export async function updateCity(id: number, name: string): Promise<City> {
  await requireSuperadmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('city')
    .update({ name })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as City
}

export async function deleteCity(id: number): Promise<void> {
  await requireSuperadmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('city')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}
