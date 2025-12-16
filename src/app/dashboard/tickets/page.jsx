// src/app/dashboard/tickets/page.jsx
'use client'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function TicketsPage(){
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data?.session) {
        router.push('/auth');
        return;
      }
      try{
        const { data: results } = await supabase
          .from('event_participants')
          .select('*, events(*)')
          .eq('user_id', data.session.user.id)
          .order('created_at', { ascending: false });
        if (mounted) setTickets(results ?? []);
      }catch(err){ console.error(err); }
      finally{ if (mounted) setLoading(false); }
    })();
    return ()=> mounted = false;
  },[router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Mes billets</h1>
      {loading ? <div>Chargement...</div> : (
        <div className="space-y-3">
          {tickets.length === 0 ? <div className="text-[var(--text-muted)]">Aucun billet trouvé.</div> : (
            tickets.map(t => (
              <div key={t.id} className="bg-[var(--surface)] p-4 rounded border border-[#111] flex items-center justify-between">
                <div>
                  <div className="font-semibold">{t.events?.title ?? 'Événement'}</div>
                  <div className="text-sm text-[var(--text-muted)]">{t.events?.place} • {new Date(t.created_at).toLocaleString()}</div>
                </div>
                <div className="text-sm text-[var(--text-muted)]">Billet: {t.ticket_code ?? '—'}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
