// src/server/api/favorites/route.js
// POST /api/favorites - Add favorite (like)
// DELETE /api/favorites/{eventId} - Remove favorite
// GET /api/favorites - Get user's favorites

import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function getUserFromToken(token) {
  if (!token) throw new Error('Missing authorization token');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) throw new Error('Invalid or expired token');
  return user;
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const user = await getUserFromToken(token);
    
    const body = await req.json();
    const { event_id } = body;
    if (!event_id) throw new Error('Missing event_id');

    // Insert favorite (ignore if already exists due to UNIQUE constraint)
    const { data, error } = await supabaseAdmin
      .from('favorites')
      .insert([{ user_id: user.id, event_id }])
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation = already favorited
        return new Response(JSON.stringify({ message: 'Already favorited', data: null }), { status: 200 });
      }
      throw error;
    }

    return new Response(JSON.stringify({ success: true, favorite: data }), { status: 201 });
  } catch (err) {
    console.error('POST /api/favorites error', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
}

export async function DELETE(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const user = await getUserFromToken(token);

    // Get event_id from query params
    const url = new URL(req.url);
    const event_id = url.searchParams.get('event_id');
    if (!event_id) throw new Error('Missing event_id query param');

    const { error } = await supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('event_id', event_id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, message: 'Favorite removed' }), { status: 200 });
  } catch (err) {
    console.error('DELETE /api/favorites error', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
}

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const user = await getUserFromToken(token);

    const { data, error } = await supabaseAdmin
      .from('favorites')
      .select('event_id')
      .eq('user_id', user.id);

    if (error) throw error;

    const favoriteIds = data?.map(f => f.event_id) || [];
    return new Response(JSON.stringify({ success: true, favorites: favoriteIds }), { status: 200 });
  } catch (err) {
    console.error('GET /api/favorites error', err);
    return new Response(JSON.stringify({ error: err.message, favorites: [] }), { status: 200 });
  }
}
