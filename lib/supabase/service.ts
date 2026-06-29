import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS.
// All actual data reads/writes go through this client.
export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
