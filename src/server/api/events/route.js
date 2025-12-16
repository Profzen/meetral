// src/server/api/events/route.js
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req) {
  try {
    console.log('[API] GET /api/events called');
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Filter out full events (registered >= capacity)
    const availableEvents = (data || []).filter(event => {
      const registered = event.registered || 0;
      const capacity = event.capacity || 0;
      return registered < capacity; // Only show events with available places
    });
    
    // Si pas de données, retourner des sample data pour tester
    if (!availableEvents || availableEvents.length === 0) {
      const sampleEvents = [
        {
          id: '1',
          title: 'Formation React.js pour débutants',
          description: 'Apprenez les bases de React.js',
          date: '2025-12-20',
          place: 'Paris 11e',
          price: 0,
          capacity: 50,
          registered: 0,
          freefood: true,
          organizer_id: null,
          status: 'validé',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Atelier Design Thinking',
          description: 'Découvrez les méthodes du design thinking',
          date: '2025-12-22',
          place: 'Lyon 2e',
          price: 25,
          capacity: 20,
          registered: 0,
          freefood: false,
          organizer_id: null,
          status: 'validé',
          created_at: new Date().toISOString(),
        },
      ];
      return new Response(JSON.stringify({ events: sampleEvents }), { status: 200 });
    }
    
    return new Response(JSON.stringify({ events: availableEvents }), { status: 200 });
  } catch (err) {
    console.error('GET /api/events error', err);
    return new Response(JSON.stringify({ error: err.message, events: [] }), { status: 200 });
  }
}

export async function POST(req) {
  try {
    console.log('[API] POST /api/events called');
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401 });

    // Vérifier l'utilisateur avec supabaseAdmin.auth.getUser
    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(token);

    if (userErr) throw userErr;
    if (!user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });

    // Vérifier rôle dans table users
    const { data: u, error: uErr } = await supabaseAdmin
      .from('users')
      .select('role, user_id')
      .eq('user_id', user.id)
      .single();

    if (uErr) throw uErr;
    if (!['organisateur', 'admin'].includes(u.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient role' }), { status: 403 });
    }

    const body = await req.json();
    // log minimal body for debug (avoid logging sensitive info)
    console.log('[API] POST body keys:', Object.keys(body));
    const { title, description, date, place, freefood = false, is_free = false, cover_url = null, price = 0, capacity = 0 } = body;

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('events')
      .insert([{
        title,
        description,
        date,
        place,
        freefood,
        is_free,
        price,
        capacity,
        cover_url,
        organizer_id: user.id
      }])
      .select()
      .single();

    if (insertErr) {
      console.error('[API] Insert error detail:', insertErr);
      throw insertErr;
    }
    console.log('[API] Event inserted id:', inserted?.id ?? null);
    return new Response(JSON.stringify({ event: inserted }), { status: 201 });
  } catch (err) {
    console.error('POST /api/events error', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
