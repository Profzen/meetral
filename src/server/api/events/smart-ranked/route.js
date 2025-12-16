// src/server/api/events/smart-ranked/route.js
// GET /api/events/smart-ranked - Smart ranking algorithm
// Scoring: imminence + popularity + fill rate + likes

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const limitParam = parseInt(url.searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 200; // default 200

    console.log('[API] GET /api/events/smart-ranked called', { limit });
    
    // Fetch upcoming and recently past events with favorites count
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select(`
        *,
        favorites:favorites(count)
      `)
      // Include events from the last 30 days up to the future
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(limit * 3); // over-fetch to allow scoring then trimming

    if (error) throw error;

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ events: [] }), { status: 200 });
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
        else if (hoursUntil < 168) imminenceScore = 4; // 1 week
        else imminenceScore = 2;

        // Popularity score: more registered = higher (max 10 points)
        const popularityScore = Math.min(10, (registered / 10) * 2);

        // Fill rate score: 70-90% = hot (max 10 points)
        const fillRate = capacity > 0 ? (registered / capacity) * 100 : 0;
        let fillRateScore = 0;
        if (fillRate >= 70 && fillRate < 90) fillRateScore = 10;
        else if (fillRate >= 50 && fillRate < 70) fillRateScore = 6;
        else if (fillRate >= 30 && fillRate < 50) fillRateScore = 3;
        else fillRateScore = 1;

        // Likes score (favorites count)
        const likesCount = ev.favorites?.[0]?.count || 0;
        const likesScore = Math.min(10, likesCount * 0.5);

        // Recency score (recently created events get a short boost)
        const createdAt = ev.created_at ? new Date(ev.created_at) : now;
        const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);
        let recencyScore = 0;
        if (hoursSinceCreated < 24) recencyScore = 6;
        else if (hoursSinceCreated < 72) recencyScore = 5;
        else if (hoursSinceCreated < 168) recencyScore = 3;
        else if (hoursSinceCreated < 720) recencyScore = 1; // < 30 jours

        // Total score with weighted factors
        const score =
          imminenceScore * 3 +   // Imminence weight: 3x
          popularityScore * 2 +   // Popularity weight: 2x
          fillRateScore * 1.5 +   // Fill rate weight: 1.5x
          likesScore * 1 +        // Likes weight: 1x
          recencyScore * 1.2;     // Recency weight: 1.2x

        return {
          ...ev,
          likes_count: likesCount,
          score,
          _debug: {
            imminenceScore,
            popularityScore,
            fillRateScore,
            likesScore,
            recencyScore,
            hoursUntil: Math.round(hoursUntil),
            fillRate: Math.round(fillRate),
            hoursSinceCreated: Math.round(hoursSinceCreated),
          },
        };
      })
      .filter((ev) => ev !== null) // Remove full events
      .sort((a, b) => b.score - a.score) // Sort by score desc
      .slice(0, limit); // Trim to requested limit

    // Remove debug info before returning
    const cleanedEvents = scoredEvents.map(({ _debug, ...ev }) => ev);

    return new Response(JSON.stringify({ events: cleanedEvents }), { status: 200 });
  } catch (err) {
    console.error('GET /api/events/smart-ranked error', err);
    return new Response(JSON.stringify({ error: err.message, events: [] }), { status: 200 });
  }
}
