import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type UTMLink = {
  id: string
  created_at: string
  created_by: string
  brand: string
  campaign_type: string
  campaign_name: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string | null
  base_url: string
  full_utm_url: string
  campaign_status: string
  notes: string | null
  tags: string | null
}

export type UTMLinkInsert = Omit<UTMLink, 'id' | 'created_at'>

// Lazy singleton — only created when called, avoids build-time errors with placeholder env vars
let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url === 'your_supabase_project_url_here' || key === 'your_supabase_anon_key_here') {
    throw new Error(
      'Supabase is not configured yet. Please add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
    )
  }

  _client = createClient(url, key)
  return _client
}

// Convenience export — use this in components
export const supabase = {
  from: (table: string) => getSupabaseClient().from(table),
}
