// src/server/api/create-profile/route.js
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * POST /api/create-profile
 * Body: { role: 'user' | 'organisateur' | null, display_name?: string }
 * Requires Authorization: Bearer <access_token> (user must be authenticated)
 *
 * Server will:
 * - validate token via supabaseAdmin.auth.getUser(token)
 * - insert a row into `users` table with user_id = auth user's id and role = provided role OR 'user'
 * - if role requested is 'organisateur', we will (option A) create organizer_requests instead (but here we accept 'user')
 *
 * Returns 201 + { user } on success
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
    const requestedRole = body?.role ?? 'user';
    const displayName = body?.display_name ?? null;
    const lang = body?.lang ?? null;

    // If someone requests 'organisateur' via registration, create a pending organizer_request instead of granting role directly.
    if (requestedRole === 'organisateur') {
      const { data: reqData, error: reqErr } = await supabaseAdmin
        .from('organizer_requests')
        .insert([{ user_id: user.id, message: `Requested via registration${displayName ? ' - ' + displayName : ''}` }])
        .select()
        .single();
      if (reqErr) throw reqErr;
      return new Response(JSON.stringify({ message: 'Organizer request created', request: reqData }), { status: 201 });
    }

    // else create or update user profile with role 'user' (or other allowed roles if you want)
    // we use upsert behavior so calling this route multiple times updates the profile
    const payload = { user_id: user.id, role: requestedRole, display_name: displayName };
    if (lang) payload.lang = lang;

    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert([payload])
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify({ user: data }), { status: 201 });
  } catch (err) {
    console.error('POST /api/create-profile error', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
