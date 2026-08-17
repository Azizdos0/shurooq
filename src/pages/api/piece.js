export const prerender = false;

import { getSupabase } from '../../lib/supabase.js';
import { SECTION_IDS, PIECE_STATUSES, TAGS } from '../../lib/editor-constants.js';
import { deriveTitle } from '../../lib/templates.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

// GET /api/piece?issueId=..&section=.. → { piece, sources }
// Returns piece:null when nothing has been saved for that slot yet.
export async function GET({ url }) {
  try {
    const issueId = url.searchParams.get('issueId');
    const section = url.searchParams.get('section');
    if (!issueId || !SECTION_IDS.includes(section)) {
      return json({ error: 'issueId and a valid section are required' }, 400);
    }
    const sb = getSupabase();
    const { data: piece, error } = await sb
      .from('pieces')
      .select('*')
      .eq('issue_id', issueId)
      .eq('section', section)
      .maybeSingle();
    if (error) throw error;

    let sources = [];
    if (piece) {
      const { data: src, error: srcErr } = await sb
        .from('sources')
        .select('*')
        .eq('piece_id', piece.id)
        .order('position', { ascending: true });
      if (srcErr) throw srcErr;
      sources = src;
    }
    return json({ piece: piece ?? null, sources });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// POST /api/piece  { issueId, section, title, body, status, sources:[{note,url,tag}] }
// Upserts the piece for (issue, section) and replaces its source log.
export async function POST({ request }) {
  try {
    const payload = await request.json();
    const { issueId, section } = payload;
    if (!issueId || !SECTION_IDS.includes(section)) {
      return json({ error: 'issueId and a valid section are required' }, 400);
    }
    const status = PIECE_STATUSES.includes(payload.status) ? payload.status : 'draft';
    const content =
      payload.content && typeof payload.content === 'object' && !Array.isArray(payload.content)
        ? payload.content
        : {};
    // Title is derived from the template's headline field (keeps the archive
    // and editor tab labelled without a separate title input).
    const title = deriveTitle(section, content, '');

    const sb = getSupabase();

    // Upsert the piece on the (issue_id, section) unique constraint.
    const { data: piece, error: upErr } = await sb
      .from('pieces')
      .upsert(
        { issue_id: issueId, section, title, content, status },
        { onConflict: 'issue_id,section' }
      )
      .select()
      .single();
    if (upErr) throw upErr;

    // Replace the source log: clear then insert the incoming rows in order.
    const { error: delErr } = await sb.from('sources').delete().eq('piece_id', piece.id);
    if (delErr) throw delErr;

    const incoming = Array.isArray(payload.sources) ? payload.sources : [];
    const rows = incoming
      .map((s, i) => ({
        piece_id: piece.id,
        note: typeof s.note === 'string' ? s.note.trim() : '',
        url: typeof s.url === 'string' ? s.url.trim() : '',
        tag: TAGS.includes(s.tag) ? s.tag : 'verified',
        position: i,
      }))
      // drop fully-empty rows
      .filter((s) => s.note || s.url);

    let sources = [];
    if (rows.length) {
      const { data: inserted, error: insErr } = await sb
        .from('sources')
        .insert(rows)
        .select()
        .order('position', { ascending: true });
      if (insErr) throw insErr;
      sources = inserted;
    }

    return json({ piece, sources });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
