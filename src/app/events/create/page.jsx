// src/app/events/create/page.jsx
'use client';
import EventForm from '@/components/events/EventForm';

export default function CreateEventPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">Créer un événement</h1>
      <p className="text-sm text-slate-600 mb-6">Remplis le formulaire pour publier ton événement.</p>
      <div className="max-w-2xl">
        <EventForm />
      </div>
    </section>
  );
}
