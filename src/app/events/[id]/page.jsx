'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

// Données de test - correspondra à un fetch réel /api/events/[id]
const eventDetails = {
  id: '1',
  title: 'Formation React.js pour débutants',
  description:
    'Apprenez les bases de React.js dans une ambiance conviviale. Cette formation couvre les concepts fondamentaux, les hooks, et la gestion d\'état avec Redux.',
  date: '2025-12-20',
  time: '18:30',
  endTime: '20:30',
  place: 'Paris 11e',
  address: '123 Rue de la Paix, 75011 Paris',
  price: 0,
  isPaid: false,
  freefood: true,
  capacity: 50,
  registered: 45,
  category: 'formation',
  image: 'https://via.placeholder.com/800x400?text=React+Formation',
  organizer: {
    name: 'Tech Academy',
    email: 'contact@techacademy.fr',
    avatar: 'https://via.placeholder.com/60x60?text=TA',
  },
  agenda: [
    { time: '18:30', title: 'Accueil & Présentation', duration: '15 min' },
    { time: '18:45', title: 'Les bases de React', duration: '45 min' },
    { time: '19:30', title: 'Break + FreeFood 🍕', duration: '15 min' },
    { time: '19:45', title: 'Exercices pratiques', duration: '45 min' },
  ],
};

export default function EventDetailPage({ params }) {
  const { t } = useTranslation();
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    // Simuler une soumission
    setTimeout(() => {
      setIsRegistered(true);
      setLoading(false);
    }, 1000);
  };

  const placesRemaining = eventDetails.capacity - eventDetails.registered;
  const placesFilled = Math.round(
    (eventDetails.registered / eventDetails.capacity) * 100
  );

  return (
    <section>
      <Link href="/events/listing" className="text-[var(--brand)] font-medium mb-6 inline-block">
        {t('back_to_events')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contenu principal */}
        <div className="lg:col-span-2">
          {/* Image */}
          <div className="w-full h-96 rounded-lg overflow-hidden mb-6">
            <img
              src={eventDetails.image}
              alt={eventDetails.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Titre et infos basiques */}
          <div className="mb-8">
            <div className="flex items-start gap-4 mb-4">
              <h1 className="text-4xl font-bold text-[var(--text-primary)]">{eventDetails.title}</h1>
              {eventDetails.freefood && (
                <span className="px-4 py-2 bg-[var(--success)] text-black rounded-full font-bold whitespace-nowrap">
                  🍕 FreeFood
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-[var(--text-muted)]">Date</p>
                <p className="font-semibold text-[var(--text-primary)]">
                  {new Date(eventDetails.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Horaire</p>
                <p className="font-semibold text-[var(--text-primary)]">
                  {eventDetails.time} - {eventDetails.endTime}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Lieu</p>
                <p className="font-semibold text-[var(--text-primary)]">{eventDetails.place}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Tarif</p>
                <p className="font-semibold text-[var(--text-primary)]">
                  {eventDetails.isPaid ? `${eventDetails.price}€` : 'Gratuit'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">À propos</h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">{eventDetails.description}</p>
          </div>

          {/* Agenda */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Programme</h2>
            <div className="space-y-3">
              {eventDetails.agenda.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-[var(--surface)] rounded-lg border border-[#111]">
                  <div className="text-[var(--brand)] font-bold whitespace-nowrap min-w-fit">
                    {item.time}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--text-primary)]">{item.title}</p>
                    <p className="text-sm text-[var(--text-muted)]">{item.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Adresse */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Lieu</h2>
              <div className="p-4 bg-[var(--surface)] rounded-lg border border-[#111]">
                <p className="text-[var(--text-primary)] font-semibold">{eventDetails.address}</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">📍 {eventDetails.place}</p>
            </div>
          </div>
        </div>

        {/* Sidebar - Inscription */}
        <div>
          <div className="bg-[var(--surface)] rounded-lg shadow-lg p-6 sticky top-20 border border-[#111]">
            {/* Organisateur */}
            <div className="mb-6 pb-6 border-b">
              <p className="text-sm text-[var(--text-muted)] mb-3">Organisé par</p>
              <div className="flex items-center gap-3">
                <img
                  src={eventDetails.organizer.avatar}
                  alt={eventDetails.organizer.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {eventDetails.organizer.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{eventDetails.organizer.email}</p>
                </div>
              </div>
            </div>

            {/* Places */}
            <div className="mb-6 pb-6 border-b">
              <p className="text-sm text-[var(--text-muted)] mb-2">Places disponibles</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                {placesRemaining > 0 ? placesRemaining : '0'}/{eventDetails.capacity}
              </p>
              <div className="w-full bg-[#111] rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    placesFilled < 50
                      ? 'bg-[var(--success)]'
                      : placesFilled < 80
                      ? 'bg-[var(--warning)]'
                      : 'bg-[var(--danger)]'
                  }`}
                  style={{ width: `${placesFilled}%` }}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">{placesFilled}% rempli</p>
            </div>

            {/* Inscription */}
            {isRegistered ? (
              <div className="bg-[var(--surface)] border border-[var(--success-dark)] rounded-lg p-4 text-center">
                <p className="text-[var(--success)] font-semibold">{t('you_are_registered')}</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">Vous recevrez un email de confirmation</p>
                <button className="mt-4 w-full px-4 py-2 border border-[var(--success)] text-[var(--success)] rounded-lg hover:bg-[#0f0f0f] transition">
                  Consulter mon billet
                </button>
              </div>
            ) : placesRemaining > 0 ? (
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full px-6 py-3 bg-[var(--brand)] text-black rounded-lg font-bold hover:opacity-95 transition disabled:opacity-50"
              >
                {loading ? `${t('register')}...` : t('register')}
              </button>
            ) : (
              <div className="bg-[var(--surface)] border border-[var(--danger-dark)] rounded-lg p-4 text-center">
                <p className="text-[var(--danger)] font-semibold">{t('event_full')}</p>
              </div>
            )}

            {/* Actions supplémentaires */}
              <div className="mt-4 flex gap-2">
              <button className="flex-1 px-3 py-2 border border-[#222] text-[var(--text-muted)] rounded-lg hover:bg-[#0f0f0f] transition">
                ♡ Favoris
              </button>
              <button className="flex-1 px-3 py-2 border border-[#222] text-[var(--text-muted)] rounded-lg hover:bg-[#0f0f0f] transition">
                📢 Partager
              </button>
            </div>

            {/* Info important */}
            <div className="mt-6 p-4 bg-[var(--surface)] border border-[#222] rounded-lg text-sm text-[var(--text-muted)]">
              <p className="font-semibold mb-1">💡 Important</p>
              <p>
                Veuillez confirmer votre présence en cliquant sur le lien dans l'email de confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
