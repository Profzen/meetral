// src/app/page.jsx
'use client';
import { useEffect, useState } from 'react';
import Hero from '@/components/home/Hero';
import FilterBar from '@/components/home/FilterBar';
import EventCard from '@/components/events/EventCard';
import EventModal from '@/components/events/EventModal';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewEvent, setViewEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await fetch('/api/events');
      const json = await res.json();
      const list = json?.events || [];
      setEvents(list);
      setFiltered(list);
    } catch (err) {
      console.error('fetch events error', err);
      setEvents([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    // apply search + filter
    const term = q.trim().toLowerCase();
    let out = events.filter(ev => {
      const title = (ev.title || '').toLowerCase();
      const desc = (ev.description || '').toLowerCase();
      const matchesQ = term === '' || title.includes(term) || desc.includes(term) || (ev.place || '').toLowerCase().includes(term);
      let matchesF = true;
      if (filter === 'freefood') matchesF = !!ev.freefood;
      if (filter === 'free') matchesF = ev.is_free === true || ev.price === 0;
      return matchesQ && matchesF;
    });
    setFiltered(out);
  }, [q, filter, events]);

  return (
    <div className="space-y-8">
      <Hero />
      <div className="container mx-auto px-4">
        <FilterBar
          q={q} onQChange={setQ}
          filter={filter} onFilterChange={setFilter}
          resultsCount={filtered.length}
        />

        <section className="mt-6">
          {loading ? (
            <div className="text-center py-12">Chargement des événements…</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white p-6 rounded shadow text-center">
              <h3 className="text-xl font-semibold">Aucun événement trouvé</h3>
              <p className="mt-2 text-sm text-slate-500">Essaie d'élargir ta recherche ou crée le premier événement.</p>
            </div>
          ) : (
            <div id="eventsGrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(ev => (
                <EventCard key={ev.id} event={ev} onOpen={() => setViewEvent(ev)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {viewEvent && <EventModal event={viewEvent} onClose={() => setViewEvent(null)} />}
    </div>
  );
}
