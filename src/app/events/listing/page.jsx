 'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/lib/supabaseClient';
import { eventCache } from '@/lib/eventCache';
import EventCard from '@/components/events/EventCard';
import EventModal from '@/components/events/EventModal';
import FilterBar from '@/components/events/FilterBar';

export default function EventsListingPage() {
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');
  const [viewEvent, setViewEvent] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [userFavorites, setUserFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  const handleFiltersChange = (filters) => {
    let results = [...allEvents];

    // Filter out full events first
    results = results.filter((e) => {
      const registered = e.registered || 0;
      const capacity = e.capacity || 0;
      return registered < capacity; // Only show events with available places
    });

    // Apply favorites filter
    if (showFavoritesOnly) {
      results = results.filter((e) => userFavorites.includes(e.id));
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      results = results.filter(
        (e) =>
          e.title.toLowerCase().includes(search) ||
          e.place.toLowerCase().includes(search)
      );
    }

    if (filters.date) {
      results = results.filter((e) => e.date === filters.date);
    }

    if (filters.location) {
      const loc = filters.location.toLowerCase();
      results = results.filter((e) => e.place.toLowerCase().includes(loc));
    }

    if (filters.category) {
      results = results.filter((e) => e.category === filters.category);
    }

    if (filters.priceRange !== 'all') {
      results = results.filter((e) => {
        if (filters.priceRange === 'free') return e.isPaid === false;
        if (filters.priceRange === '0-50') return e.price > 0 && e.price <= 50;
        if (filters.priceRange === '50-200') return e.price > 50 && e.price <= 200;
        if (filters.priceRange === '200+') return e.price > 200;
        return true;
      });
    }

    if (filters.freefood) {
      results = results.filter((e) => e.freefood === true);
    }

    if (sortBy === 'date') {
      results.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === 'price') {
      results.sort((a, b) => a.price - b.price);
    }

    setFilteredEvents(results);
    setVisibleCount(20);
  };

  function loadMore() {
    setVisibleCount((c) => c + 20);
  }

  // Function to refresh events (called after registration)
  async function refreshEvents() {
    try {
      // Clear cache
      eventCache.clear('listing_events');
      
      // Fetch fresh data
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const query = new URLSearchParams({
        limit: '200',
        ...(userId && { userId }),
      });

      const res = await fetch(`/api/events/smart-ranked?${query}`);
      const json = await res.json();
      let list = json?.events ?? [];
      console.log('Listing events from smart-ranked:', list);

      if (!Array.isArray(list) || list.length < 20) {
        const res2 = await fetch('/api/events');
        const json2 = await res2.json();
        list = json2?.events ?? [];
      }

      eventCache.set('listing_events', list);
      setAllEvents(list);
      setFilteredEvents(list);
    } catch (e) {
      console.error('Refresh events error', e);
    }
  }

  // fetch events from smart-ranked server route with caching
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);

        // Check cache first
        const cached = eventCache.get('listing_events');
        if (cached) {
          if (mounted) {
            setAllEvents(cached);
            setFilteredEvents(cached);
            setIsLoading(false);
          }
          return;
        }

        // Get userId for smart-ranked API
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        // Build query with userId if available
        const query = new URLSearchParams({
          limit: '200',
          ...(userId && { userId }),
        });

        const res = await fetch(`/api/events/smart-ranked?${query}`);
        const json = await res.json();
        let list = json?.events ?? [];

        // Fallback: ensure minimum of 20 items for initial view
        if (!Array.isArray(list) || list.length < 20) {
          try {
            const res2 = await fetch('/api/events');
            const json2 = await res2.json();
            const list2 = json2?.events ?? [];
            list = list2;
          } catch (e2) {
            console.error('fallback /api/events error', e2);
          }
        }

        if (mounted) {
          // Cache the events
          eventCache.set('listing_events', list);
          setAllEvents(list);
          setFilteredEvents(list);
          setIsLoading(false);
        }
      } catch (e) {
        console.error('Fetch events listing error', e);
        if (mounted) setIsLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // Fetch user's favorites - removed since now included in smart-ranked
  useEffect(() => {
    async function fetchFavorites() {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) return;

      // If smart-ranked already returned isFavorited flag, we can skip this
      // But keep it for backward compatibility with non-ranked results
      const token = session.session.access_token;
      try {
        const res = await fetch('/api/favorites', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.favorites) {
          setUserFavorites(json.favorites);
        }
      } catch (e) {
        console.error('Fetch favorites error', e);
      }
    }
    fetchFavorites();
  }, []);

  // Re-filter when showFavoritesOnly changes
  useEffect(() => {
    handleFiltersChange({});
  }, [showFavoritesOnly, userFavorites]);

  async function toggleFavoritesFilter() {
    if (!showFavoritesOnly) {
      // Check if user is logged in
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        alert('Vous devez être connecté pour voir vos favoris');
        return;
      }
    }
    setShowFavoritesOnly(!showFavoritesOnly);
  }

  return (
    <section className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">Découvrez les événements</h1>
          <p className="text-[var(--text-muted)] mt-2 text-sm sm:text-base">
            {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} trouvé{filteredEvents.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <FilterBar onFiltersChange={handleFiltersChange} />

      {/* Contrôles de tri et vue */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
            <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded transition text-sm font-medium ${
              viewMode === 'grid'
                ? 'bg-[var(--brand)] text-black'
                : 'bg-[#0f0f0f] text-[var(--text-muted)] hover:bg-[#1b1b1b]'
            }`}
          >
            ⊞ Grille
          </button>
            <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded transition text-sm font-medium ${
              viewMode === 'list'
                ? 'bg-[var(--brand)] text-black'
                : 'bg-[#0f0f0f] text-[var(--text-muted)] hover:bg-[#1b1b1b]'
            }`}
          >
            ☰ Liste
          </button>
          <button
            onClick={toggleFavoritesFilter}
            className={`px-3 py-2 rounded transition text-sm font-medium ${
              showFavoritesOnly
                ? 'bg-[var(--danger)] text-white'
                : 'bg-[#0f0f0f] text-[var(--text-muted)] hover:bg-[#1b1b1b]'
            }`}
          >
            {showFavoritesOnly ? '❤️ Favoris' : '♡ Mes favoris'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--text-muted)] whitespace-nowrap">Trier par:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-[#222] rounded-md text-sm bg-[#0f0f0f] text-[var(--text-primary)] focus:outline-none focus:ring-[var(--brand)] flex-1 sm:flex-none"
          >
            <option value="date">Date (proche)</option>
            <option value="price">Prix (croissant)</option>
          </select>
        </div>
      </div>

      {/* Événements - Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="animate-pulse bg-[var(--surface)] rounded-lg border border-[#111] p-4 space-y-3">
                <div className="h-36 bg-[#111] rounded" />
                <div className="h-4 bg-[#111] rounded w-3/4" />
                <div className="h-3 bg-[#111] rounded w-1/2" />
                <div className="h-2 bg-[#111] rounded w-full" />
                <div className="h-2 bg-[#111] rounded w-5/6" />
              </div>
            ))
          ) : filteredEvents.length > 0 ? (
            filteredEvents.slice(0, visibleCount).map((event) => (
              <EventCard key={event.id} event={event} onOpen={() => setViewEvent(event)} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-[var(--text-muted)] text-lg">Aucun événement ne correspond à vos critères</p>
            </div>
          )}
        </div>
      )}
      {/* grid load more */}
          {filteredEvents.length > visibleCount && (
        <div className="mt-8 text-center">
          <button onClick={loadMore} className="px-6 py-3 bg-[var(--brand)] text-black rounded-lg font-medium hover:opacity-95 transition inline-block">{t('see_more')}</button>
        </div>
      )}

      {/* Événements - List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="animate-pulse bg-[var(--surface)] rounded-lg border border-[#111] p-4 flex gap-4">
                <div className="w-32 h-24 bg-[#111] rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#111] rounded w-2/3" />
                  <div className="h-3 bg-[#111] rounded w-1/2" />
                  <div className="h-2 bg-[#111] rounded w-4/5" />
                  <div className="h-2 bg-[#111] rounded w-3/4" />
                </div>
              </div>
            ))
          ) : filteredEvents.length > 0 ? (
            filteredEvents.slice(0, visibleCount).map((event) => (
              <div
                key={event.id}
                className="bg-[var(--surface)] rounded-lg shadow-md p-4 flex flex-col sm:flex-row gap-4 hover:shadow-lg transition border border-[#111]"
              >
                <img
                  src={event.cover_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23222%22/%3E%3Ctext x=%22300%22 y=%22205%22 fill=%22%23aaa%22 font-size=%2232%22 text-anchor=%22middle%22 font-family=%22Arial,sans-serif%22%3EEvent%3C/text%3E%3C/svg%3E'}
                  alt={event.title}
                  className="w-full sm:w-32 h-40 sm:h-32 object-cover rounded-md flex-shrink-0"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23222%22/%3E%3Ctext x=%22300%22 y=%22205%22 fill=%22%23aaa%22 font-size=%2232%22 text-anchor=%22middle%22 font-family=%22Arial,sans-serif%22%3EEvent%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] line-clamp-2">{event.title}</h3>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 line-clamp-2">{event.description}</p>
                    </div>
                    {event.freefood && (
                      <span className="px-2 sm:px-3 py-1 bg-[var(--success)] text-black rounded-full text-xs font-semibold whitespace-nowrap self-start">
                        🍕 FreeFood
                      </span>
                    )}
                  </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-[var(--text-muted)]">
                    <div className="flex items-center">
                      <span className="mr-2">📅</span>
                      <span className="text-[var(--text-primary)]">{event.date && event.start_time ? new Date(`${event.date}T${event.start_time}`).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : event.date}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">📍</span>
                      <span className="truncate text-[var(--text-primary)]">{event.place}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">💰</span>
                      <span>{event.isPaid ? `${event.price}€` : 'Gratuit'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">👥</span>
                      <span>{event.registered}/{event.capacity} places</span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/events/${event.id}`}
                  className="px-4 py-2 bg-[var(--brand)] text-black rounded-lg font-medium hover:opacity-95 text-center text-sm sm:h-fit whitespace-nowrap"
                >
                  Voir plus
                </Link>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-[var(--surface)] rounded-lg border border-[#111]">
              <p className="text-[var(--text-muted)] text-base sm:text-lg">
                Aucun événement ne correspond à vos critères
              </p>
            </div>
          )}
        </div>
      )}

      {viewEvent && (
        <EventModal 
          event={viewEvent} 
          onClose={() => setViewEvent(null)} 
          onRegistrationSuccess={refreshEvents}
        />
      )}
    </section>
  );
}
