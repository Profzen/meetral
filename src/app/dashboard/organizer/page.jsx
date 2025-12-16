// src/app/dashboard/organizer/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function OrganizerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [regModal, setRegModal] = useState({ open: false, event: null, rows: [], stats: null, loading: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.push('/auth');
        return;
      }
      setSession(data.session);

      try {
        const { data: events } = await supabase
          .from('events')
          .select('*')
          .eq('organizer_id', data.session.user.id)
          .order('date', { ascending: false });

        if (mounted) setMyEvents(events ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [router]);

  async function handleDelete(evId) {
    if (!confirm('Supprimer cet événement ? Cette action est irréversible.')) return;
    try {
      const { data: s } = await supabase.auth.getSession();
      const token = s?.session?.access_token;
      const res = await fetch(`/api/events/${evId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erreur suppression');
      // remove from UI
      setMyEvents(prev => prev.filter(e => e.id !== evId));
      alert('Événement supprimé.');
    } catch (err) {
      console.error(err);
      alert('Erreur suppression: ' + (err.message || ''));
    }
  }

  async function openRegistrations(ev) {
    setRegModal((s) => ({ ...s, open: true, event: ev, loading: true, rows: [], stats: null }));
    const { data: s } = await supabase.auth.getSession();
    const token = s?.session?.access_token;
    try {
      const res = await fetch(`/api/registrations?event_id=${ev.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erreur chargement');
      setRegModal((st) => ({ ...st, rows: j.registrations || [], stats: j.stats || null, loading: false }));
    } catch (err) {
      console.error(err);
      setRegModal((st) => ({ ...st, loading: false }));
      alert('Impossible de charger les inscriptions');
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Dashboard organisateur</h1>

      {loading ? <div>Chargement…</div> : (
        <>
          <div className="bg-[var(--surface)] p-4 rounded shadow mb-4 flex justify-between items-center border border-[#111]">
            <div>
              <h2 className="font-semibold">Vos événements</h2>
              <p className="text-sm text-[var(--text-muted)]">Créer, éditer ou supprimer vos événements.</p>
            </div>
            <div>
              <button onClick={() => router.push('/events/create')} className="px-3 py-2 bg-[var(--brand)] text-black rounded">Créer un événement</button>
            </div>
          </div>

          <div className="space-y-3">
            {myEvents.length === 0 ? <div className="bg-[var(--surface)] p-4 rounded shadow text-[var(--text-muted)] border border-[#111]">Aucun événement créé.</div> :
              myEvents.map(ev => (
                <div key={ev.id} className="bg-[var(--surface)] p-4 rounded shadow flex justify-between items-center border border-[#111]">
                  <div>
                    <div className="font-semibold">{ev.title}</div>
                    <div className="text-sm text-[var(--text-muted)]">{ev.place} • {new Date(ev.date).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openRegistrations(ev)} className="px-3 py-1 border rounded text-sm">Inscriptions</button>
                    <button onClick={() => router.push(`/events/create?edit=${ev.id}`)} className="px-3 py-1 border rounded text-sm">Éditer</button>
                    <button onClick={() => handleDelete(ev.id)} className="px-3 py-1 bg-[var(--danger)] text-white rounded text-sm">Supprimer</button>
                  </div>
                </div>
              ))
            }
          </div>

          {regModal.open && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-[var(--surface)] w-full max-w-3xl rounded border border-[#111] shadow-lg max-h-[90vh] overflow-auto">
                <div className="p-4 border-b border-[#111] flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">Inscriptions — {regModal.event?.title}</h3>
                    {regModal.stats && (
                      <p className="text-sm text-[var(--text-muted)]">{regModal.stats.totalRegistrations} inscriptions, {regModal.stats.totalSeats} places</p>
                    )}
                  </div>
                  <button onClick={() => setRegModal({ open: false, event: null, rows: [], stats: null, loading: false })} className="text-[var(--text-muted)]">Fermer ✕</button>
                </div>
                <div className="p-4 space-y-3">
                  {regModal.loading ? (
                    <div>Chargement…</div>
                  ) : regModal.rows.length === 0 ? (
                    <div className="text-[var(--text-muted)]">Aucune inscription</div>
                  ) : (
                    <div className="space-y-2">
                      {regModal.rows.map((r) => (
                        <div key={r.registration_id} className="border border-[#111] rounded p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <div className="font-semibold text-[var(--text-primary)]">{r.name}</div>
                            <div className="text-xs text-[var(--text-muted)]">{r.email}</div>
                            <div className="text-xs text-[var(--text-muted)]">ID: {r.registration_id}</div>
                          </div>
                          <div className="text-sm">{r.count} place(s)</div>
                          <div className="text-xs text-[var(--text-muted)]">{new Date(r.created_at).toLocaleString('fr-FR')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
