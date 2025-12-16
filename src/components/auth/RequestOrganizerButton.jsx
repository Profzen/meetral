// src/components/auth/RequestOrganizerButton.jsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function RequestOrganizerButton() {
  const [loading, setLoading] = useState(false);
  async function onRequest() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? session?.access_token; // supabase v2 shape
      if (!token) return alert('Connecte-toi d’abord.');

      const res = await fetch('/api/request-organizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: 'Demande depuis le profil' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      alert('Demande envoyée.');
    } catch (err) {
      console.error(err);
      alert('Erreur: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }

  return <button onClick={onRequest} disabled={loading} className="px-3 py-1 bg-[var(--brand)] text-black rounded text-sm">{loading ? 'Envoi...' : 'Demander rôle organisateur'}</button>;
}
