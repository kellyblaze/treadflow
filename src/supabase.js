import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://egaxolujduyhcomkbuum.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYXhvbHVqZHV5aGNvbWtidXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NjAzOTUsImV4cCI6MjA5MzMzNjM5NX0.nNWcDR2EVLODNnXnKoRvyJ9YDl63YRMlypimNyG8JXA'

export const supabase = createClient(supabaseUrl, supabaseKey)