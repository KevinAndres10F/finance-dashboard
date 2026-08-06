import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function isAuthError(err) {
  if (!err) return false;
  const code = err.code || err.status || '';
  const msg = err.message || '';
  return code === '401' || code === '403' || code === 401 || code === 403
    || msg.includes('JWT') || msg.includes('permission') || msg.includes('RLS');
}
