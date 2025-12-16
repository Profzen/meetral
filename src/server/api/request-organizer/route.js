// src/server/api/request-organizer/route.js
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * POST /api/request-organizer
 * - Reçoit { message } (optionnel) dans le body.
 * - Extrait Authorization Bearer <token> depuis l'entête.
 * - Vérifie le token via supabaseAdmin.auth.getUser(token).
 * - Insère une ligne dans organizer_requests avec user_id.
 *
 * Réponses :
 * - 201 + { request } sur succès
 * - 401 si pas connecté
 * - 500 sur erreur serveur
 */

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401 });

    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(token);
    if (userErr) throw userErr;
    if (!user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });

    const body = await req.json();
    const { message = null } = body ?? {};

    const { data, error } = await supabaseAdmin
      .from('organizer_requests')
      .insert([{ user_id: user.id, message }])
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify({ request: data }), { status: 201 });
  } catch (err) {
    console.error('POST /api/request-organizer error', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
