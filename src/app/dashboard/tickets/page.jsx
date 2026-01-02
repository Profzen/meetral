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
      <h1 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Mes billets</h1>
      {loading ? (
        <div className="text-center py-8">
          <div className="text-[var(--text-muted)]">Chargement de vos billets...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="bg-[var(--surface)] rounded-lg border border-[#111] p-8 text-center">
              <div className="text-4xl mb-3">🎫</div>
              <p className="text-[var(--text-muted)]">Aucun billet trouvé.</p>
              <p className="text-sm text-[var(--text-muted)] mt-2">Inscrivez-vous à un événement pour obtenir votre premier billet !</p>
            </div>
          ) : (
            tickets.map(t => (
              <div key={t.id} className="bg-[var(--surface)] p-6 rounded-lg border border-[#111] hover:border-[var(--brand)] transition">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Infos événement */}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2">
                      {t.events?.title ?? 'Événement'}
                    </h3>
                    <div className="space-y-1 text-sm text-[var(--text-muted)]">
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{t.events?.place ?? 'Lieu non défini'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{t.events?.date ? new Date(`${t.events.date}${t.events.start_time ? 'T'+t.events.start_time : ''}`).toLocaleString('fr-FR', { 
                          dateStyle: 'long', 
                          timeStyle: 'short' 
                        }) : 'Date non définie'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>✅</span>
                        <span>Inscrit le {new Date(t.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ticket code */}
                  <div className="bg-[#0a0a0a] border-2 border-[var(--brand)] rounded-lg p-4 text-center min-w-[200px]">
                    <div className="text-xs text-[var(--text-muted)] mb-1">Code du billet</div>
                    <div className="font-mono text-2xl font-bold text-[var(--brand)] tracking-wider">
                      {t.ticket_code ?? '—'}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-2">
                      Présentez ce code à l'entrée
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
