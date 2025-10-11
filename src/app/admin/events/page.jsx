// src/app/admin/events/page.jsx
'use client';
import { useEffect, useState } from 'react';
import AdminEventRow from '@/components/admin/AdminEventRow';
import AdminEventEditModal from '@/components/admin/AdminEventEditModal';
import { supabase } from '@/lib/supabaseClient';

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  // Récupère token utilisateur (session supabase) pour appeler /api/admin/events
  async function fetchEvents() {
    setLoading(true);
    const session = await supabase.auth.getSession();
    const access_token = session.data?.session?.access_token;
    try {
      const res = await fetch('/api/admin/events', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const j = await res.json();
      if (res.ok) setEvents(j.events || []);
      else console.error(j);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchEvents(); }, []);

  async function onDelete(id) {
    const session = await supabase.auth.getSession();
    const token = session.data?.session?.access_token;
    if (!confirm('Supprimer cet événement ?')) return;
    const res = await fetch('/api/admin/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchEvents();
    else console.error(await res.json());
  }

  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">Admin — Événements</h1>
      {loading ? <div>Chargement...</div> :
        <div className="space-y-2">
          {events.map(ev => (
            <AdminEventRow key={ev.id} event={ev} onEdit={() => setEditing(ev)} onDelete={() => onDelete(ev.id)} />
          ))}
        </div>
      }
      {editing && <AdminEventEditModal event={editing} onClose={() => { setEditing(null); fetchEvents(); }} />}
    </section>
  );
}
