import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client using the service_role key (bypasses RLS).
// Read from import.meta.env (dev/.env) with a process.env fallback (Vercel
// runtime). This module must never be imported from client-side code — doing
// so would leak the secret into the browser bundle.
const url =
  import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey =
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let client = null;

export function getSupabase() {
  if (!url || !serviceKey || serviceKey === 'paste-your-service_role-key-here') {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env — see .env.example.'
    );
  }
  if (!client) {
    client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export function isConfigured() {
  return Boolean(url && serviceKey && serviceKey !== 'paste-your-service_role-key-here');
}
