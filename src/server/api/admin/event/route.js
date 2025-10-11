// src/server/api/admin/events/route.js
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Admin endpoints:
 * - GET: liste complète
 * - PATCH: éditer event (body doit contenir id + fields)
 * - DELETE: supprimer event (body { id })
 *
 * Nécessite Authorization: Bearer <access_token> d'un user avec role 'admin'
 */

async function checkAdmin(token) {
  if (!token) throw new Error('Missing token');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error) throw error;
  if (!user) throw new Error('Invalid token');

  const { data, error: uerr } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (uerr) throw uerr;
  if (!data || data.role !== 'admin') throw new Error('Not an admin');
  return user;
}

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    await checkAdmin(token);

    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return new Response(JSON.stringify({ events: data }), { status: 200 });
  } catch (err) {
    console.error(err);
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
    const { id, ...fields } = body;
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('events')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify({ event: data }), { status: 200 });
  } catch (err) {
    console.error(err);
    const status = err.message === 'Not an admin' ? 403 : 401;
    return new Response(JSON.stringify({ error: err.message }), { status });
  }
}

export async function DELETE(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    await checkAdmin(token);

    const body = await req.json();
    const { id } = body;
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify({ deleted: data }), { status: 200 });
  } catch (err) {
    console.error(err);
    const status = err.message === 'Not an admin' ? 403 : 401;
    return new Response(JSON.stringify({ error: err.message }), { status });
  }
}
