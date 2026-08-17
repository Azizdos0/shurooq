export const prerender = false;

import { getSupabase } from '../../lib/supabase.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export async function GET() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('issues')
      .select('id, number, title, status')
      .order('number', { ascending: true });
    if (error) throw error;
    return json({ issues: data });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
