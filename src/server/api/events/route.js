// src/server/api/events/route.js
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET: retourne tous les événements publics (SELECT)
 * POST: créer un événement — nécessite token d'un utilisateur avec role 'organisateur' ou 'admin'
 */

export async function GET(req) {
  try {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return new Response(JSON.stringify({ events: data }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401 });

    // Vérifier le token et récupérer user
    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(token);

    if (userErr) throw userErr;
    if (!user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });

    // Vérifier rôle dans la table users
    const { data: usersData, error: uerr } = await supabaseAdmin
      .from('users')
      .select('role, user_id')
      .eq('user_id', user.id)
      .single();

    if (uerr) throw uerr;
    const role = usersData?.role;

    if (!['organisateur', 'admin'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Insufficient role' }), { status: 403 });
    }

    const body = await req.json();
    const { title, description, date, place } = body;

    // Insert en base — organiser_id = user.id
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('events')
      .insert([{
        title, description, date, place, organizer_id: user.id
      }])
      .select()
      .single();

    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ event: inserted }), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
