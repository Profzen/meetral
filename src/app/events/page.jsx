'use client';
import Link from 'next/link';
export default function EventsPage() {
  return (
    <div>
      <h2 className='text-2xl font-semibold mb-4'>Événements</h2>
      <p>Aucun événement pour l'instant (placeholder)</p>
      <p className='mt-4'>
        <Link href='/events/create' className='text-blue-600 underline'>Créer un événement</Link>
      </p>
    </div>
  );
}// src/app/events/page.jsx
import EventCard from '@/components/events/EventCard';
import Link from 'next/link';

// TODO: remplacer sample par fetch réel (Prisma / Supabase)
const sampleEvents = [
  { id: '1', title: 'Apéro Meetral', date: '2025-10-20', place: 'Paris' },
  { id: '2', title: 'FreeFood Pop-up', date: '2025-11-05', place: 'Lyon' },
  { id: '3', title: 'Atelier UX', date: '2025-12-02', place: 'Remote' },
];

export default function EventsPage() {
  return (
    <section>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tous les événements</h1>
        <Link href="/events/create" className="text-sm bg-indigo-600 text-white px-3 py-1 rounded">Organiser un événement</Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sampleEvents.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </section>
  );
}

