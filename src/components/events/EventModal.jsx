// src/components/events/EventModal.jsx
'use client';
import { useState } from 'react';
import formatDate from '@/utils/formatDate';

export default function EventModal({ event, onClose }) {
  const [joining, setJoining] = useState(false);
  if (!event) return null;

  async function onJoin() {
    setJoining(true);
    try {
      // placeholder: appeler endpoint d'inscription /tickets ou /event_participants
      await new Promise(r => setTimeout(r, 700));
      alert('Inscription simulée — intégration API à ajouter.');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'inscription');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-3xl rounded shadow-lg overflow-auto max-h-[90vh]">
        <div className="p-4 border-b flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{event.title}</h2>
            <div className="text-sm text-slate-500">{formatDate(event.date)} • {event.place}</div>
          </div>
          <button onClick={onClose} className="text-slate-600">Fermer ✕</button>
        </div>

        <div className="p-6">
          {event.cover_url && <img src={event.cover_url} alt={event.title} className="w-full h-64 object-cover rounded" />}

          <div className="mt-4 text-slate-700">
            <p>{event.description || 'Pas de description fournie.'}</p>
            <div className="mt-4 flex gap-2 items-center">
              {event.freefood && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-sm">FreeFood</span>}
              {event.is_free && <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">Gratuit</span>}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border rounded">Annuler</button>
            <button onClick={onJoin} disabled={joining} className="px-4 py-2 bg-sky-600 text-white rounded">
              {joining ? 'Inscription...' : 'S’inscrire'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
