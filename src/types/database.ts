export type City = {
  id: number
  name: string
  created_at?: string
  updated_at?: string
}

export type UserProfile = {
  id: string
  username: string
  email: string
  city_id: number | null
  role: 'superadmin' | 'admin'
  status: 0 | 9 | 10
  created_at?: string
  updated_at?: string
  city?: City
}

export type Donor = {
  id: number
  serial_number?: number | null
  name?: string | null
  phone_number: string
  date_of_birth?: string | null
  residence_address?: string | null
  blood_type_and_rh_factor?: string | null
  number_of_blood_donations?: number | null
  date_of_last_donation?: string | null
  awards_and_honors_received?: string | null
  registered_in_chapter?: string | null
  city_id?: number | null
  created_at?: string
  updated_at?: string
  city?: City
}

export type DonorFormData = {
  serial_number?: number | null
  name?: string | null
  phone_number: string
  date_of_birth?: string | null
  residence_address?: string | null
  blood_type_and_rh_factor?: string | null
  number_of_blood_donations?: number | null
  date_of_last_donation?: string | null
  awards_and_honors_received?: string | null
  registered_in_chapter?: string | null
  city_id?: number | null
}
