'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState({
    participations: 0,
    tickets: 0,
    createdEvents: 0,
    upcomingEvents: 0,
  });

  // LocalStorage data for non-authenticated users
  const [localData, setLocalData] = useState({
    participations: [],
    favorites: [],
    createdEvents: [],
  });

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      setLoading(true);

      // Vérifier la session Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Utilisateur connecté
        if (mounted) {
          setUser(session.user);
          setIsAuthenticated(true);

          // Récupérer le profil depuis la table users
          const { data, error } = await supabase
            .from('users')
            .select('role, display_name, phone, email')
            .eq('user_id', session.user.id)
            .single();

          if (!error && data) {
            setRole(data.role);
            setProfile(data);
            console.log('User profile:', data);
          }

          // Charger les statistiques depuis la base
          await loadStatistics(session.user.id);
        }
      } else {
        // Utilisateur non connecté - charger depuis localStorage
        if (mounted) {
          setIsAuthenticated(false);
          const saved = localStorage.getItem('meetral_dashboard');
          if (saved) {
            setLocalData(JSON.parse(saved));
          }
        }
      }

      if (mounted) setLoading(false);
    }

    async function loadStatistics(userId) {
      try {
        // Participations count
        const { data: participations } = await supabase
          .from('event_participants')
          .select('id')
          .eq('user_id', userId);
        
        // Tickets count (same as event_participants)
        const { data: tickets } = await supabase
          .from('event_participants')
          .select('id')
          .eq('user_id', userId);
        
        // Created events count
        const { data: createdEvents } = await supabase
          .from('events')
          .select('id')
          .eq('organizer_id', userId);
        
        // Upcoming events count (events with date > now)
        const { data: upcomingEvents } = await supabase
          .from('events')
          .select('id')
          .eq('organizer_id', userId)
          .gte('date', new Date().toISOString());

        if (mounted) {
          setStats({
            participations: participations?.length || 0,
            tickets: tickets?.length || 0,
            createdEvents: createdEvents?.length || 0,
            upcomingEvents: upcomingEvents?.length || 0,
          });
        }
      } catch (err) {
        console.error('Error loading statistics:', err);
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="text-center py-12">
        <p className="text-[var(--text-muted)]">Chargement de votre dashboard...</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    // Dashboard pour utilisateur NON connecté (localStorage)
    return (
      <section>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">Mon Dashboard</h1>
          <p className="text-[var(--text-muted)] mt-2">
            Vous n'êtes pas connecté. Vos données sont stockées localement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Mes Participations */}
          <div className="bg-[var(--surface)] rounded-lg shadow-md p-6 border border-[#111]">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Mes Participations</h2>
            {localData.participations.length > 0 ? (
              <div className="space-y-3">
                {localData.participations.map((event) => (
                  <div key={event.id} className="border-l-4 border-[var(--brand)] pl-4 py-2">
                    <p className="font-semibold text-[var(--text-primary)]">{event.title}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      📅 {new Date(event.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[var(--text-muted)]">Aucune participation enregistrée localement</p>
            )}
          </div>

          {/* Mes Favoris */}
          <div className="bg-[var(--surface)] rounded-lg shadow-md p-6 border border-[#111]">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Mes Favoris</h2>
            {localData.favorites.length > 0 ? (
              <div className="space-y-3">
                {localData.favorites.map((event) => (
                  <div key={event.id} className="border-l-4 border-[var(--warning)] pl-4 py-2">
                    <p className="font-semibold text-[var(--text-primary)]">{event.title}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      📍 {event.place}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[var(--text-muted)]">Aucun favori enregistré</p>
            )}
          </div>
        </div>

          <div className="bg-[var(--surface)]/70 border border-[#111] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Connectez-vous pour plus de fonctionnalités
          </h3>
          <p className="text-[var(--text-muted)] mb-4">
            En vous connectant, vous aurez accès à un dashboard complet avec :
          </p>
          <ul className="list-disc list-inside text-blue-800 mb-6 space-y-1">
            <li>Historique complet de vos événements</li>
            <li>Gestion des événements créés</li>
            <li>Billets et codes QR</li>
            <li>Synchronisation entre appareils</li>
          </ul>
            <Link
            href="/auth/login"
            className="px-6 py-3 bg-[var(--brand)] text-black rounded-lg font-medium hover:opacity-95 transition"
          >
            Se connecter / S'inscrire
          </Link>
        </div>
      </section>
    );
  }

  // Dashboard pour utilisateur CONNECTÉ (base de données)
  return (
    <section>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[var(--text-primary)]">
          Bienvenue, {profile?.display_name || user?.email}
        </h1>
        <p className="text-[var(--text-muted)] mt-2">Gérez vos événements et participations</p>
      </div>

      {/* Statistiques en base de données */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--surface)] rounded-lg shadow-md p-4 border border-[#111]">
          <div className="text-2xl mb-1">👥</div>
          <p className="text-[var(--text-muted)] text-xs mb-1">Participations</p>
          <p className="text-3xl font-bold text-[var(--brand)]">{stats.participations}</p>
        </div>
        <div className="bg-[var(--surface)] rounded-lg shadow-md p-4 border border-[#111]">
          <div className="text-2xl mb-1">🎫</div>
          <p className="text-[var(--text-muted)] text-xs mb-1">Billets</p>
          <p className="text-3xl font-bold text-[var(--brand)]">{stats.tickets}</p>
        </div>
        <div className="bg-[var(--surface)] rounded-lg shadow-md p-4 border border-[#111]">
          <div className="text-2xl mb-1">📅</div>
          <p className="text-[var(--text-muted)] text-xs mb-1">Événements créés</p>
          <p className="text-3xl font-bold text-[var(--brand)]">{stats.createdEvents}</p>
        </div>
        <div className="bg-[var(--surface)] rounded-lg shadow-md p-4 border border-[#111]">
          <div className="text-2xl mb-1">⏰</div>
          <p className="text-[var(--text-muted)] text-xs mb-1">À venir</p>
          <p className="text-3xl font-bold text-[var(--brand)]">{stats.upcomingEvents}</p>
        </div>
      </div>

      {/* Actions principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Participant - Mes Participations */}
        <div className="bg-[var(--surface)] rounded-lg shadow-md p-6 hover:shadow-lg transition border border-[#111]">
          <div className="text-3xl mb-2">👥</div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Mes Participations</h3>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            Consultez les événements auxquels vous participerez
          </p>
          <Link
            href="/dashboard/participations"
            className="text-[var(--brand)] font-medium hover:underline"
          >
            Voir les détails →
          </Link>
        </div>

        {/* Participant - Mes Billets */}
        <div className="bg-[var(--surface)] rounded-lg shadow-md p-6 hover:shadow-lg transition border border-[#111]">
          <div className="text-3xl mb-2">🎫</div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Mes Billets</h3>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            Accédez à vos billets numériques avec codes QR
          </p>
          <Link
            href="/dashboard/tickets"
            className="text-[var(--brand)] font-medium hover:underline"
          >
            Voir mes billets →
          </Link>
        </div>

        {/* Organisateur - Mes Événements */}
        {role === 'organisateur' && (
          <div className="bg-[var(--surface)] rounded-lg shadow-md p-6 hover:shadow-lg transition border-2 border-[#222]">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
              Mes Événements
            </h3>
              <p className="text-[var(--text-muted)] text-sm mb-4">
              Gérez les événements que vous avez créés
            </p>
              <Link
                href="/dashboard/my-events"
                className="text-[var(--brand)] font-medium hover:underline"
              >
              Gérer mes événements →
            </Link>
          </div>
        )}

        {/* Admin - Gestion de tous les événements */}
        {role === 'admin' && (
          <div className="bg-[var(--surface)] rounded-lg shadow-md p-6 hover:shadow-lg transition border-2 border-[var(--brand)]">
            <div className="text-3xl mb-2">⚙️</div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
              Gestion Événements
            </h3>
              <p className="text-[var(--text-muted)] text-sm mb-4">
              Modérez et gérez tous les événements
            </p>
              <Link
                href="/admin/events"
                className="text-[var(--brand)] font-medium hover:underline"
              >
              Voir tous les événements →
            </Link>
          </div>
        )}
      </div>

      {/* Bouton Créer Événement - Organisateurs */}
      {role === 'organisateur' && (
        <div className="bg-[var(--brand)] rounded-lg p-8 text-black mb-8">
          <h2 className="text-2xl font-bold mb-2">Créer un nouvel événement</h2>
          <p className="text-[var(--text-muted)] mb-6">
            Partagez votre événement avec la communauté Meetral
          </p>
          <Link
            href="/events/create"
            className="px-6 py-3 bg-black/5 text-black rounded-lg font-bold hover:opacity-95 transition inline-block"
          >
            + Créer un événement
          </Link>
        </div>
      )}

      {role === 'admin' && (
        <div className="bg-[var(--brand)] rounded-lg p-8 text-black mb-8">
          <h2 className="text-2xl font-bold mb-2">Créer un nouvel événement</h2>
          <p className="text-[var(--text-muted)] mb-6">
            En tant qu'admin, vous pouvez créer et modérer tous les événements
          </p>
          <Link
            href="/events/create"
            className="px-6 py-3 bg-black/5 text-black rounded-lg font-bold hover:opacity-95 transition inline-block"
          >
            + Créer un événement
          </Link>
        </div>
      )}

      {/* Demander le rôle d'organisateur */}
      {role === 'participant' && (
        <div className="bg-[var(--surface)] border border-[#222] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Vous voulez organiser un événement ?
          </h3>
          <p className="text-[var(--text-muted)] mb-4">
            Demandez le rôle d'organisateur pour pouvoir créer vos propres événements.
          </p>
          <button className="px-6 py-2 bg-[var(--brand)] text-black rounded-lg font-medium hover:opacity-95 transition">
            Demander le rôle d'organisateur
          </button>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-[var(--surface)] rounded-lg shadow-md p-6 border border-[#111]">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Statistiques</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-[var(--text-muted)]">Événements auxquels vous participez</span>
              <span className="text-2xl font-bold text-[var(--brand)]">0</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-[var(--text-muted)]">Événements à venir</span>
              <span className="text-2xl font-bold text-[var(--brand)]">0</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-[var(--text-muted)]">Favoris</span>
              <span className="text-2xl font-bold text-[var(--brand)]">0</span>
            </div>
            {role === 'organisateur' && (
              <>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-[var(--text-muted)]">Événements créés</span>
                  <span className="text-2xl font-bold text-[var(--brand)]">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Total des participants</span>
                  <span className="text-2xl font-bold text-[var(--brand)]">0</span>
                </div>
              </>
            )}
            {role === 'admin' && (
              <>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-[var(--text-muted)]">Total des événements</span>
                  <span className="text-2xl font-bold text-[var(--brand)]">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Total des inscriptions</span>
                  <span className="text-2xl font-bold text-[var(--brand)]">0</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-lg shadow-md p-6 border border-[#111]">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Informations du compte</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Email</p>
              <p className="font-semibold text-[var(--text-primary)]">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Rôle</p>
              <p className="font-semibold text-[var(--text-primary)] capitalize">
                {role || 'Non défini'}
              </p>
            </div>
            <Link
              href="/profile"
              className="text-[var(--brand)] font-medium hover:underline text-sm"
            >
              Modifier mon profil →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
