// src/app/admin/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.push('/auth');
        return;
      }
      setSession(data.session);
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <div className="container mx-auto px-4 py-8">Chargement…</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Admin — Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--surface)] p-4 rounded shadow border border-[#111]">
          <h3 className="font-semibold">Utilisateurs</h3>
          <p className="text-sm text-[var(--text-muted)]">Gérer les comptes et rôles.</p>
          <div className="mt-3">
            <button onClick={() => router.push('/admin/users')} className="px-3 py-2 border rounded text-sm">Aller aux utilisateurs</button>
          </div>
        </div>

        <div className="bg-[var(--surface)] p-4 rounded shadow border border-[#111]">
          <h3 className="font-semibold">Demandes organisateurs</h3>
          <p className="text-sm text-[var(--text-muted)]">Approuver/refuser les demandes.</p>
          <div className="mt-3">
            <button onClick={() => router.push('/admin/organizer-requests')} className="px-3 py-2 border rounded text-sm">Voir les demandes</button>
          </div>
        </div>

        <div className="bg-[var(--surface)] p-4 rounded shadow border border-[#111]">
          <h3 className="font-semibold">Événements</h3>
          <p className="text-sm text-[var(--text-muted)]">Moderation & stats.</p>
          <div className="mt-3">
            <button onClick={() => router.push('/admin/events')} className="px-3 py-2 border rounded text-sm">Gérer les événements</button>
            <button onClick={() => router.push('/admin/registrations')} className="ml-2 px-3 py-2 border rounded text-sm">Inscriptions</button>
          </div>
        </div>
      </div>
    </div>
  );
}
