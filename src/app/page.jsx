// src/app/page.jsx
'use client';

/**
 * src/app/page.jsx
 *
 * Page d'accueil client-side complète et fonctionnelle :
 * - récupère les événements via GET /api/events
 * - propose recherche et filtres (All / FreeFood / Gratuit)
 * - met en place une subscription realtime Supabase (INSERT/UPDATE/DELETE) pour refléter les changements en direct
 * - ouvre une modal détaillée sur "Voir"
 *
 * Prérequis :
 * - src/lib/supabaseClient.js exposant `supabase`
 * - /api/events existe (GET) et renvoie { events: [...] }
 * - composants EventCard et EventModal existants aux chemins indiqués
 */

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { eventCache } from '@/lib/eventCache';
import Hero from '@/components/home/Hero';
import FilterBar from '@/components/home/FilterBar';
import EventCard from '@/components/events/EventCard';
import EventModal from '@/components/events/EventModal';
import { supabase } from '@/lib/supabaseClient';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewEvent, setViewEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // keep a ref to channel to unsubscribe on unmount
  const channelRef = useRef(null);

  // Fetch events from smart-ranked endpoint for homepage (top 50, we show 12)
  async function fetchEvents() {
    setLoading(true);
    try {
      // Check cache first
      const cached = eventCache.get('home_events');
      if (cached) {
        setEvents(cached);
        setFiltered(cached);
        setLoading(false);
        return;
      }

      // Get userId for smart-ranked API
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const query = new URLSearchParams({
        limit: '50',
        ...(userId && { userId }),
      });

      const res = await fetch(`/api/events/smart-ranked?${query}`);
      const json = await res.json();
      const list = json?.events ?? [];
      
      // Fallback: if ranked returns too few, fetch non-ranked list
      let source = list;
      if (!Array.isArray(source) || source.length < 12) {
        try {
          const res2 = await fetch('/api/events');
          const json2 = await res2.json();
          const list2 = json2?.events ?? [];
          source = list2;
        } catch (e2) {
          console.error('fallback /api/events error', e2);
        }
      }
      
      // Keep only the top 12 for homepage display
      const top12 = (source || []).slice(0, 12);
      
      // Cache the results
      eventCache.set('home_events', top12);
      
      setEvents(top12);
      setFiltered(top12);
    } catch (err) {
      console.error('fetchEvents error', err);
      setEvents([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }

  // Setup initial fetch + realtime subscription
  useEffect(() => {
    let mounted = true;
    fetchEvents();

    // Create realtime subscription via new Supabase Realtime API (channel)
    // This listens to INSERT / UPDATE / DELETE on public.events
    const channel = supabase
      .channel('public:events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          // payload contains eventType (INSERT/UPDATE/DELETE) and new/old rows
          // update local state immutably
          setEvents((prev) => {
            const current = Array.isArray(prev) ? [...prev] : [];
            try {
              if (payload.eventType === 'INSERT') {
                // add newest at top
                return [payload.new, ...current];
              } else if (payload.eventType === 'UPDATE') {
                return current.map((it) => (it.id === payload.new.id ? payload.new : it));
              } else if (payload.eventType === 'DELETE') {
                return current.filter((it) => it.id !== payload.old.id);
              }
            } catch (e) {
              console.error('Realtime payload processing error', e);
            }
            return current;
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    // cleanup on unmount
    return () => {
      mounted = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  // Apply search and filter whenever events / q / filter change
  useEffect(() => {
    const term = (q || '').trim().toLowerCase();
    const out = events.filter((ev) => {
      // Filter out full events first
      const registered = ev.registered || 0;
      const capacity = ev.capacity || 0;
      if (registered >= capacity) return false; // Skip full events

      const title = (ev.title || '').toLowerCase();
      const desc = (ev.description || '').toLowerCase();
      const place = (ev.place || '').toLowerCase();

      const matchesQ =
        term === '' || title.includes(term) || desc.includes(term) || place.includes(term);

      let matchesF = true;
      if (filter === 'freefood') matchesF = !!ev.freefood;
      if (filter === 'free') matchesF = ev.is_free === true || ev.price === 0;

      return matchesQ && matchesF;
    });

    setFiltered(out);
  }, [events, q, filter]);

  return (
    <div className="space-y-8">
      {/* Hero (visuel + CTA) */}
      <Hero />

      <div className="container mx-auto px-4">
        {/* Search & filters bar */}
        <FilterBar
          q={q}
          onQChange={setQ}
          filter={filter}
          onFilterChange={setFilter}
          resultsCount={filtered.length}
        />

        {/* Events grid */}
        <section className="mt-6">
          {loading ? (
            <div className="text-center py-12">Chargement des événements…</div>
            ) : filtered.length === 0 ? (
            <div className="bg-[var(--surface)] p-6 rounded shadow text-center border border-[#111]">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">Aucun événement trouvé</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Essaie d'élargir ta recherche ou crée ton premier événement.</p>
            </div>
          ) : (
              <>
                <div id="eventsGrid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filtered
                    .slice()
                    .sort((a, b) => new Date(a.date) - new Date(b.date) || ((b.registered / (b.capacity || 1)) - (a.registered / (a.capacity || 1))))
                    .slice(0, 20)
                    .map((ev) => (
                      <EventCard key={ev.id} event={ev} onOpen={() => setViewEvent(ev)} />
                    ))}
                </div>
                <div className="mt-6 flex justify-center">
                  <Link href="/events/listing" className="px-6 py-3 bg-[var(--brand)] text-black rounded-lg font-medium hover:opacity-95 transition inline-block">
                    {t('see_more')}
                  </Link>
                </div>
              </>
          )}
        </section>
      </div>

      {/* Event modal (detail + inscription) */}
      {viewEvent && (
        <EventModal 
          event={viewEvent} 
          onClose={() => setViewEvent(null)} 
          onRegistrationSuccess={() => {
            eventCache.clear('home_events');
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}
