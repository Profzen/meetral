// src/app/admin/organizer-requests/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminOrganizerRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchRequests() {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data?.session?.access_token;
      const res = await fetch('/api/admin/organizer-requests', { headers: { Authorization: `Bearer ${token}` }});
      const json = await res.json();
      if (res.ok) setRequests(json.requests || []);
      else console.error(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRequests(); }, []);

  async function handleAction(id, action) {
    if (!confirm(`Confirmer ${action} ?`)) return;
    try {
      const session = await supabase.auth.getSession();
      const token = session.data?.session?.access_token;
      const res = await fetch('/api/admin/organizer-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      // update UI
      setRequests((prev) => prev.map(r => r.id === json.request.id ? json.request : r));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'action : ' + err.message);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Demandes d'organisateur</h1>

      {loading ? <div>Chargement...</div> : (
        <div className="space-y-3">
          {requests.length === 0 ? <div className="bg-[var(--surface)] p-4 rounded shadow text-[var(--text-muted)] border border-[#111]">Aucune demande.</div> :
            requests.map(r => (
              <div key={r.id} className="bg-[var(--surface)] p-4 rounded shadow flex items-center justify-between border border-[#111]">
                <div>
                  <div className="font-semibold">User: {r.user_id}</div>
                  <div className="text-sm text-[var(--text-muted)] mt-1">{r.message ?? '—'}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-2">Reçu: {new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <div className={`px-2 py-1 rounded text-sm ${r.status === 'pending' ? 'bg-[var(--warning)] text-black' : r.status === 'approved' ? 'bg-[var(--success)] text-black' : 'bg-[var(--danger)] text-black'}`}>
                    {r.status}
                  </div>
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => handleAction(r.id, 'approve')} className="px-3 py-1 bg-[var(--success)] text-black rounded text-sm">Approuver</button>
                      <button onClick={() => handleAction(r.id, 'deny')} className="px-3 py-1 bg-[var(--danger)] text-white rounded text-sm">Refuser</button>
                    </>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
