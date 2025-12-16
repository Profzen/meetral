// src/server/api/tickets/route.js
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req) {
  try {
    const body = await req.json();
    const { event_id, name, email, count } = body || {};
    if (!event_id || !name || !email || !count || count <= 0) {
      return new Response(JSON.stringify({ error: 'Paramètres invalides' }), { status: 400 });
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

    const registrationId = `${event_id}-${Date.now()}`;
    const qrText = `meetral:ticket:${registrationId}`;

    // Store registration in database
    const { error: regErr } = await supabaseAdmin.from('registrations').insert({
      registration_id: registrationId,
      event_id,
      name,
      email,
      count,
      qr_text: qrText,
    });
    if (regErr) return new Response(JSON.stringify({ error: 'Erreur enregistrement inscription' }), { status: 500 });

    // Update event registered count
    const { error: updErr } = await supabaseAdmin
      .from('events')
      .update({ registered: (registered || 0) + count })
      .eq('id', event_id);
    if (updErr) {
      console.error('Update error:', updErr);
      return new Response(JSON.stringify({ error: 'Erreur mise à jour capacité', details: updErr.message }), { status: 500 });
    }

    // Return registration data for client-side PDF generation
    return new Response(JSON.stringify({
      success: true,
      registration: {
        id: registrationId,
        event: {
          title: ev.title,
          date: ev.date,
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
