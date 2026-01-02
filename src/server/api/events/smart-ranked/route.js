// src/server/api/events/smart-ranked/route.js
// GET /api/events/smart-ranked - Smart ranking algorithm with pagination
// Query params: limit (default 200), offset (default 0), userId (to include user favorites)
// Scoring: imminence + popularity + fill rate + likes + recency

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const limitParam = parseInt(url.searchParams.get('limit') || '', 10);
    const offsetParam = parseInt(url.searchParams.get('offset') || '0', 10);
    const userId = url.searchParams.get('userId');
    
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 200;
    const offset = Math.max(0, offsetParam);

    console.log('[API] GET /api/events/smart-ranked', { limit, offset, userId });
    
    // Fetch events with minimal columns for performance
    // Over-fetch to allow scoring + filtering full events
    const { data: rawEvents, error } = await supabaseAdmin
      .from('events')
      .select(`
        id,
        title,
        description,
        date,
        start_time,
        place,
        cover_url,
        price,
        isPaid,
        capacity,
        registered,
        freefood,
        category,
        created_at,
        likes:favorites(count)
      `)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(limit * 3); // over-fetch to allow filtering

    if (error) throw error;

    // Normalize dates to YYYY-MM-DD format (remove time/timezone)
    const events = (rawEvents || []).map(ev => ({
      ...ev,
      date: ev.date ? ev.date.split('T')[0] : ev.date,
    }));

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ events: [], total: 0 }), { status: 200 });
    }

    // Fetch user's favorites if userId provided
    let userFavorites = new Set();
    if (userId) {
      const { data: favs, error: favError } = await supabaseAdmin
        .from('favorites')
        .select('event_id')
        .eq('user_id', userId);
      
      if (!favError && favs) {
        userFavorites = new Set(favs.map(f => f.event_id));
      }
    }

    const now = new Date();
    
    // Calculate score for each event
    const scoredEvents = events
      .map((ev) => {
        const registered = ev.registered || 0;
        const capacity = ev.capacity || 1;
        const isFull = registered >= capacity;
        
        // Skip full events
        if (isFull) return null;

        // Imminence score: closer = higher (max 10 points)
        const eventDate = new Date(ev.date);
        const hoursUntil = (eventDate - now) / (1000 * 60 * 60);
        let imminenceScore = 0;
        if (hoursUntil < 24) imminenceScore = 10;
        else if (hoursUntil < 48) imminenceScore = 8;
        else if (hoursUntil < 72) imminenceScore = 6;
        else if (hoursUntil < 168) imminenceScore = 4;
        else imminenceScore = 2;

        // Popularity score
        const popularityScore = Math.min(10, (registered / 10) * 2);

        // Fill rate score
        const fillRate = capacity > 0 ? (registered / capacity) * 100 : 0;
        let fillRateScore = 0;
        if (fillRate >= 70 && fillRate < 90) fillRateScore = 10;
        else if (fillRate >= 50 && fillRate < 70) fillRateScore = 6;
        else if (fillRate >= 30 && fillRate < 50) fillRateScore = 3;
        else fillRateScore = 1;

        // Recency score
        const createdAt = ev.created_at ? new Date(ev.created_at) : now;
        const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);
        let recencyScore = 0;
        if (hoursSinceCreated < 24) recencyScore = 6;
        else if (hoursSinceCreated < 72) recencyScore = 5;
        else if (hoursSinceCreated < 168) recencyScore = 3;
        else if (hoursSinceCreated < 720) recencyScore = 1;

        // Total score (SANS likes)
        const score =
          imminenceScore * 3 +
          popularityScore * 2 +
          fillRateScore * 1.5 +
          recencyScore * 1.2;

        return {
          ...ev,
          isFavorited: userFavorites.has(ev.id),
          score,
        };
      })
      .filter((ev) => ev !== null)
      .sort((a, b) => b.score - a.score);
    
    // Apply offset/limit pagination
    const total = scoredEvents.length;
    const paginatedEvents = scoredEvents.slice(offset, offset + limit);

    return new Response(JSON.stringify({ 
      events: paginatedEvents, 
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }), { status: 200 });
  } catch (err) {
    console.error('GET /api/events/smart-ranked error', err);
    return new Response(JSON.stringify({ error: err.message, events: [], total: 0 }), { status: 200 });
  }
}
