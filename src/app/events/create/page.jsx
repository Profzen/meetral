// src/app/events/create/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import EventForm from '@/components/events/EventForm';

export default function CreateEventPage() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params?.get('edit') ?? null;

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [initialEvent, setInitialEvent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push(`/auth/login?next=${encodeURIComponent('/events/create' + (editId ? `?edit=${editId}` : ''))}`);
          return;
        }
        if (!mounted) return;
        setUser(session.user);

        // get role
        const { data, error: rErr } = await supabase.from('users').select('role').eq('user_id', session.user.id).single();
        if (rErr) console.warn('no role', rErr);
        setRole(data?.role ?? null);

        // if editing, we pass eventId to the EventForm (it will fetch data)
        if (editId) {
          // we attempt to fetch the event to show preview (EventForm will also fetch if needed)
          const res = await fetch('/api/events');
          const json = await res.json();
          const ev = (json.events || []).find(e => String(e.id) === String(editId));
          if (ev) setInitialEvent(ev);
        }
      } catch (err) {
        console.error(err);
        setError('Erreur lors de la vérification de session.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [editId, router]);

  function isAuthorized() {
    const allowed = ['organisateur', 'admin'];
    return allowed.includes(role);
  }

  if (loading) return <div className="container mx-auto px-4 py-8">Vérification en cours...</div>;
  if (!user) return <div className="container mx-auto px-4 py-8">Redirection vers la connexion…</div>;
  if (!isAuthorized()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-[var(--surface)] p-6 rounded shadow border border-[#111]">
          <h2 className="text-lg font-semibold">Accès refusé</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Tu n'as pas le rôle requis pour créer ou éditer des événements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">{editId ? 'Modifier l’événement' : 'Créer un événement'}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Remplis le formulaire pour publier ou mettre à jour ton événement.</p>
        </header>

        <div className="bg-[var(--surface)] p-6 rounded shadow border border-[#111]">
          <EventForm initialEvent={initialEvent} eventId={editId} onSuccess={(res) => {
            // after create/edit, navigate to the organizer's events list
            router.push('/dashboard/my-events');
          }} />
        </div>
      </div>
    </div>
  );
}
