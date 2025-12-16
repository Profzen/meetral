// src/app/admin/registrations/page.jsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminRegistrationsPage() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ totalRegistrations: 0, totalSeats: 0 });
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [q, setQ] = useState('');

  async function fetchEvents() {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const res = await fetch('/api/admin/events', { headers: { Authorization: `Bearer ${token}` } });
      const j = await res.json();
      if (res.ok) setEvents(j.events || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchRegistrations(eventId = '') {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    try {
      const url = eventId ? `/api/registrations?event_id=${eventId}` : '/api/registrations';
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erreur chargement');
      setRows(j.registrations || []);
      setStats(j.stats || { totalRegistrations: 0, totalSeats: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
    fetchRegistrations();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => {
      const fields = [r.name, r.email, r.registration_id, r.events?.title, r.events?.place].map((x) => (x || '').toLowerCase());
      return fields.some((f) => f.includes(term));
    });
  }, [rows, q]);

  function exportCsv() {
    const header = ['registration_id','event_title','event_place','name','email','count','created_at'];
    const lines = filtered.map(r => [
      r.registration_id,
      (r.events?.title || '').replace(/"/g,'""'),
      (r.events?.place || '').replace(/"/g,'""'),
      (r.name || '').replace(/"/g,'""'),
      (r.email || '').replace(/"/g,'""'),
      r.count,
      r.created_at
    ].map(v => `"${v ?? ''}"`).join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registrations.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admin — Inscriptions</h1>
          <p className="text-sm text-[var(--text-muted)]">{stats.totalRegistrations} inscriptions, {stats.totalSeats} places</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <select
            value={selectedEvent}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedEvent(id);
              fetchRegistrations(id);
            }}
            className="px-3 py-2 rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)]"
          >
            <option value="">Tous les événements</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, email, évènement, ID)"
            className="w-full sm:w-72 px-3 py-2 rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)]"
          />
          <button onClick={exportCsv} className="px-3 py-2 bg-[var(--brand)] text-black rounded">Exporter CSV</button>
        </div>
      </div>

      {loading ? (
        <div>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="text-[var(--text-muted)]">Aucune inscription trouvée</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.registration_id} className="border border-[#111] rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="font-semibold text-[var(--text-primary)]">{r.name}</div>
                <div className="text-xs text-[var(--text-muted)]">{r.email}</div>
                <div className="text-xs text-[var(--text-muted)]">ID: {r.registration_id}</div>
              </div>
              <div className="text-sm">
                <div className="text-[var(--text-primary)]">{r.events?.title}</div>
                <div className="text-xs text-[var(--text-muted)]">{r.events?.place} • {r.events?.date && new Date(r.events.date).toLocaleDateString('fr-FR')}</div>
              </div>
              <div className="text-sm font-semibold">{r.count} place(s)</div>
              <div className="text-xs text-[var(--text-muted)]">{new Date(r.created_at).toLocaleString('fr-FR')}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
