// src/lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRole) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in env (server only).');
}

export const supabaseAdmin = createClient(url, serviceRole, {
  // allow server-side usage
  auth: { persistSession: false },
});
