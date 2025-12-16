// src/server/api/tickets/validate/route.js
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function getUserRole(token) {
  if (!token) return null;
  const { data: userData } = await supabaseAdmin.auth.getUser(token);
  const user = userData?.user;
  if (!user) return null;
  const { data: roleRow } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single();
  return { user, role: roleRow?.role || 'participant' };
}

export async function POST(req) {
  try {
    const auth = req.headers.get('authorization');
    const token = auth?.split('Bearer ')[1];
    const authUser = await getUserRole(token);
    if (!authUser || !['organisateur', 'admin'].includes(authUser.role)) {
      return new Response(JSON.stringify({ valid: false, error: 'Unauthorized' }), { status: 401 });
    }

    const body = await req.json();
    const { registration_id } = body || {};
    if (!registration_id) return new Response(JSON.stringify({ valid: false, error: 'id requis' }), { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('registrations')
      .select('registration_id, event_id, name, email, count, created_at, status')
      .eq('registration_id', registration_id)
      .single();

    if (error || !data) return new Response(JSON.stringify({ valid: false }), { status: 404 });

    return new Response(JSON.stringify({ valid: true, registration: data }), { status: 200 });
  } catch (e) {
    console.error('Validate ticket error', e);
    return new Response(JSON.stringify({ valid: false, error: 'Erreur serveur' }), { status: 500 });
  }
}
