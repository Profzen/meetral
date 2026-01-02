// src/server/api/events/[id]/route.js
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Route handler pour /api/events/[id]
 * Méthodes : PATCH (mise à jour), DELETE (suppression)
 *
 * Autorisation :
 * - l'utilisateur doit être authentifié (token Bearer)
 * - autorisé si user.id === events.organizer_id OR si user's role === 'admin'
 *
 * Remarque :
 * - on utilise supabaseAdmin pour les opérations côté serveur (service role).
 * - Assure-toi que SUPABASE_SERVICE_ROLE_KEY est défini dans .env.local.
 */

async function getAuthUserFromToken(token) {
  if (!token) throw new Error('missing_token');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) throw error;
  if (!data?.user) throw new Error('invalid_token');
  return data.user;
}

// vérifie si l'utilisateur est admin (lecture table users)
async function isUserAdmin(userId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data?.role === 'admin';
}

// récupère l'événement
async function fetchEventById(id) {
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function PATCH(req, { params }) {
  const id = params?.id;
  try {
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401 });

    // 1) auth user
    const user = await getAuthUserFromToken(token);

    // 2) fetch event
    const event = await fetchEventById(id);
    if (!event) return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });

    // 3) check permission: organizer or admin
    const isOrganizer = event.organizer_id === user.id;
    let admin = false;
    try {
      admin = await isUserAdmin(user.id);
    } catch (e) {
      // si lecture users échoue, on considère pas admin
      admin = false;
    }

    if (!isOrganizer && !admin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // 4) parse body and update allowed fields only
    const body = await req.json();
    // whitelist fields autorisés à la mise à jour
    const allowed = ['title', 'description', 'date', 'start_time', 'place', 'freefood', 'is_free', 'cover_url', 'price', 'capacity'];
    const payload = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, k)) payload[k] = body[k];
    }

    if (Object.keys(payload).length === 0) {
      return new Response(JSON.stringify({ error: 'No valid fields to update' }), { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('events')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ event: updated }), { status: 200 });
  } catch (err) {
    console.error('PATCH /api/events/[id] error', err);
    if (err.message === 'missing_token' || err.message === 'invalid_token') {
      return new Response(JSON.stringify({ error: err.message }), { status: 401 });
    }
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const id = params?.id;
  try {
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401 });

    // auth user
    const user = await getAuthUserFromToken(token);

    // fetch event
    const event = await fetchEventById(id);
    if (!event) return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });

    const isOrganizer = event.organizer_id === user.id;
    let admin = false;
    try {
      admin = await isUserAdmin(user.id);
    } catch (e) {
      admin = false;
    }

    if (!isOrganizer && !admin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const { data: deleted, error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ deleted }), { status: 200 });
  } catch (err) {
    console.error('DELETE /api/events/[id] error', err);
    if (err.message === 'missing_token' || err.message === 'invalid_token') {
      return new Response(JSON.stringify({ error: err.message }), { status: 401 });
    }
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), { status: 500 });
  }
}
