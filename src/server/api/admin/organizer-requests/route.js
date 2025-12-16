// src/server/api/admin/organizer-requests/route.js
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Admin endpoints for organizer requests
 * - GET: list all requests (admin-only)
 * - PATCH: { id, action } where action = 'approve' | 'deny'
 *    - if approve: update users table -> set role = 'organisateur' for that user_id
 *    - always update organizer_requests.status to 'approved' or 'denied'
 *
 * Authorization:
 * - checks that the caller's user (from token) has role = 'admin' in table users
 */

async function checkAdmin(token) {
  if (!token) throw new Error('Missing token');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error) throw error;
  if (!user) throw new Error('Invalid token');

  const { data, error: roleErr } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleErr) throw roleErr;
  if (!data || data.role !== 'admin') throw new Error('Not an admin');

  return user;
}

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    await checkAdmin(token);

    const { data, error } = await supabaseAdmin
      .from('organizer_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return new Response(JSON.stringify({ requests: data }), { status: 200 });
  } catch (err) {
    console.error('GET /api/admin/organizer-requests error', err);
    const status = err.message === 'Not an admin' ? 403 : 401;
    return new Response(JSON.stringify({ error: err.message }), { status });
  }
}

export async function PATCH(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    await checkAdmin(token);

    const body = await req.json();
    const { id, action } = body;
    if (!id || !['approve', 'deny'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Missing id or invalid action' }), { status: 400 });
    }

    // fetch the request row
    const { data: reqRow, error: fetchErr } = await supabaseAdmin
      .from('organizer_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;
    if (!reqRow) return new Response(JSON.stringify({ error: 'Request not found' }), { status: 404 });

    // If approve => update users table role => 'organisateur'
    if (action === 'approve') {
      const { error: updateUserErr } = await supabaseAdmin
        .from('users')
        .update({ role: 'organisateur' })
        .eq('user_id', reqRow.user_id);

      if (updateUserErr) throw updateUserErr;
    }

    // Update the request status
    const newStatus = action === 'approve' ? 'approved' : 'denied';
    const { data: updated, error: updateReqErr } = await supabaseAdmin
      .from('organizer_requests')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (updateReqErr) throw updateReqErr;

    return new Response(JSON.stringify({ request: updated }), { status: 200 });
  } catch (err) {
    console.error('PATCH /api/admin/organizer-requests error', err);
    const status = err.message === 'Not an admin' ? 403 : 401;
    return new Response(JSON.stringify({ error: err.message }), { status });
  }
}
