// src/app/dashboard/user/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [participations, setParticipations] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data?.session) {
        router.push('/auth'); // redirect to auth
        return;
      }
      setSession(data.session);
      // fetch participations / tickets for user
      try {
        const { data: tickets } = await supabase
          .from('event_participants')
          .select('*, events(*)')
          .eq('user_id', data.session.user.id)
          .order('created_at', { ascending: false });

        if (mounted) setParticipations(tickets ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Mon tableau de bord</h1>
      {loading ? <div>Chargement…</div> : (
        <>
          <section className="bg-[var(--surface)] p-4 rounded shadow mb-4 border border-[#111]">
            <h2 className="font-semibold">Bienvenue,</h2>
            <p className="text-sm text-[var(--text-muted)]">Sur cette page tu verras les événements auxquels tu as participé et ceux à venir.</p>
          </section>

          <section className="bg-[var(--surface)] p-4 rounded shadow border border-[#111]">
            <h3 className="font-semibold mb-2">Mes participations</h3>
            {participations.length === 0 ? <div className="text-[var(--text-muted)]">Aucune participation enregistrée.</div> :
              <ul className="space-y-3">
                {participations.map(p => (
                  <li key={p.id} className="border p-3 rounded flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{p.events?.title ?? 'Événement'}</div>
                      <div className="text-sm text-[var(--text-muted)]">{p.events?.place} — {new Date(p.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">Statut: {p.status ?? 'inscrit'}</div>
                  </li>
                ))}
              </ul>
            }
          </section>
        </>
      )}
    </div>
  );
}
