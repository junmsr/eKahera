import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qzeomarntlrksyenepqe.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6ZW9tYXJudGxya3N5ZW5lcHFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5Mjg2NjUsImV4cCI6MjA3NTUwNDY2NX0.x3S2nvc2wx-9hlsqwvw_nyB5YJWyHFo4Kmv6zPEJr78'

if (supabaseAnonKey === 'your-anon-key-here') {
  console.warn('Supabase anon key is not set. Please set VITE_SUPABASE_ANON_KEY in your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket name for business documents
export const DOCUMENTS_BUCKET = 'eKahera'
