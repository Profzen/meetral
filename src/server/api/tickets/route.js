// src/server/api/tickets/route.js
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req) {
  try {
    const body = await req.json();
    const { event_id, name, email, count } = body || {};
    if (!event_id || !name || !email || !count || count <= 0) {
      return new Response(JSON.stringify({ error: 'Paramètres invalides' }), { status: 400 });
    }

    // Get authenticated user from Authorization header
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401 });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Utilisateur non authentifié' }), { status: 401 });
    }

    const { data: ev, error: evErr } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();
    if (evErr || !ev) return new Response(JSON.stringify({ error: 'Événement introuvable' }), { status: 404 });

    const capacity = ev.capacity || 0;
    const registered = ev.registered || 0;
    if (capacity && registered + count > capacity) {
      return new Response(JSON.stringify({ error: 'Capacité insuffisante' }), { status: 409 });
    }

    // Insert into event_participants (trigger will generate ticket_code automatically)
    // Keep payload minimal to match table schema
    const { data: participant, error: regErr } = await supabaseAdmin
      .from('event_participants')
      .insert({
        event_id,
        user_id: user.id,
      })
      .select()
      .single();

    if (regErr) {
      console.error('Registration error:', regErr);
      return new Response(JSON.stringify({ error: 'Erreur enregistrement inscription', details: regErr.message || regErr.code }), { status: 500 });
    }

    // Update event registered count
    const { error: updErr } = await supabaseAdmin
      .from('events')
      .update({ registered: (registered || 0) + count })
      .eq('id', event_id);
    if (updErr) {
      console.error('Update error:', updErr);
      return new Response(JSON.stringify({ error: 'Erreur mise à jour capacité', details: updErr.message }), { status: 500 });
    }

    // Return registration data for client-side PDF generation with 10-digit ticket_code
    const qrText = `meetral:ticket:${participant.ticket_code}`;
    
    // Normalize date format
    const eventDate = ev.date ? ev.date.split('T')[0] : ev.date;
    
    return new Response(JSON.stringify({
      success: true,
      registration: {
        id: participant.ticket_code, // Use 10-digit code
        ticket_code: participant.ticket_code, // Explicit ticket code
        event: {
          title: ev.title,
          date: eventDate,
          start_time: ev.start_time || '18:00',
          place: ev.place,
        },
        name,
        email,
        count,
        qrText,
      },
    }), { status: 200 });
  } catch (e) {
    console.error('Ticket POST error', e);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 });
  }
}
