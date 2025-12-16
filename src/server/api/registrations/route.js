// src/server/api/registrations/route.js
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function getUserAndRole(token) {
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

export async function GET(req) {
  try {
    const auth = req.headers.get('authorization');
    const token = auth?.split('Bearer ')[1];
    const userCtx = await getUserAndRole(token);
    if (!userCtx) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { user, role } = userCtx;
    const { searchParams } = new URL(req.url);
    const event_id = searchParams.get('event_id');

    let query = supabaseAdmin
      .from('registrations')
      .select('registration_id,event_id,name,email,count,status,created_at,events(title,date,place,organizer_id)')
      .order('created_at', { ascending: false });

    if (role !== 'admin') {
      // restrict to organizer's events
      query = query.eq('events.organizer_id', user.id);
    }
    if (event_id) query = query.eq('event_id', event_id);

    const { data, error } = await query;
    if (error) throw error;

    const stats = {
      totalRegistrations: data?.length || 0,
      totalSeats: (data || []).reduce((sum, r) => sum + (r.count || 0), 0),
    };

    return new Response(JSON.stringify({ registrations: data || [], stats }), { status: 200 });
  } catch (e) {
    console.error('Registrations GET error', e);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 });
  }
}
