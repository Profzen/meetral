// src/app/dashboard/participations/page.jsx
'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ParticipationsPage(){
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [participations, setParticipations] = useState([]);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data?.session) {
        // if not logged, read from localStorage
        const saved = localStorage.getItem('meetral_dashboard');
        if (saved) {
          const parsed = JSON.parse(saved);
          setParticipations(parsed.participations || []);
        }
        setLoading(false);
        return;
      }
      setSession(data.session);
      try{
        const { data: results } = await supabase
          .from('event_participants')
          .select('*, events(*)')
          .eq('user_id', data.session.user.id)
          .order('created_at', { ascending: false });
        if (mounted) setParticipations(results ?? []);
      }catch(err){ console.error(err); }
      finally{ if (mounted) setLoading(false); }
    })();
    return ()=> mounted = false;
  },[router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Mes participations</h1>
      {loading ? <div>Chargement…</div> : (
        <div className="space-y-3">
          {participations.length === 0 ? <div className="text-[var(--text-muted)]">Aucune participation trouvée.</div> : (
            participations.map(p => (
              <div key={p.id} className="bg-[var(--surface)] p-4 rounded border border-[#111] flex items-center justify-between">
                <div>
                  <div className="font-semibold">{p.events?.title ?? p.title}</div>
                  <div className="text-sm text-[var(--text-muted)]">{p.events?.place} — {new Date(p.created_at).toLocaleString()}</div>
                </div>
                <div className="text-sm text-[var(--text-muted)]">Statut: {p.status ?? 'inscrit'}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

