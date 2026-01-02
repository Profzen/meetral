// src/components/events/EventCard.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/lib/supabaseClient';

export default function EventCard({ event, onOpen }) {
  const { t } = useTranslation();
  const { id, title, date, start_time, place, price, is_free, freefood, capacity, registered, description, cover_url, likes_count } = event;
  const [isFavorited, setIsFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(likes_count || 0);

  const placesFilled = capacity > 0 ? Math.round((registered / capacity) * 100) : 0;
  const placesRemaining = capacity - registered;
  const isPaid = !is_free && price > 0;

  const formatDateTime = (d, time) => {
    if (!d) return '';
    try {
      // Extraire juste la partie date YYYY-MM-DD si c'est au format ISO complet
      const dateOnly = typeof d === 'string' ? d.split('T')[0] : d;
      const iso = time && time !== '00:00' ? `${dateOnly}T${time}` : dateOnly;
      const dateObj = new Date(iso);
      if (isNaN(dateObj.getTime())) return dateOnly;
      return dateObj.toLocaleString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return d;
    }
  };

  // Validate and fix image URL (only cover_url exists now)
  const getValidImageUrl = () => {
    const placeholder = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23222%22/%3E%3Ctext x=%22300%22 y=%22205%22 fill=%22%23aaa%22 font-size=%2232%22 text-anchor=%22middle%22 font-family=%22Arial,sans-serif%22%3EEvent%3C/text%3E%3C/svg%3E';
    if (!cover_url) {
      return placeholder;
    }
    
    // Check if URL is valid (starts with http/https or is a relative path starting with /)
    if (cover_url.startsWith('http://') || cover_url.startsWith('https://') || cover_url.startsWith('/')) {
      return cover_url;
    }
    
    // Fallback to placeholder
    return placeholder;
  };

  const imageUrl = getValidImageUrl();

  // Check if user has favorited this event
  useEffect(() => {
    async function checkFavorite() {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) return;

      const token = session.session.access_token;
      try {
        const res = await fetch('/api/favorites', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.favorites && json.favorites.includes(id)) {
          setIsFavorited(true);
        }
      } catch (e) {
        console.error('Check favorite error', e);
      }
    }
    checkFavorite();
  }, [id]);

  async function toggleFavorite(e) {
    e.stopPropagation();
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      alert('Vous devez être connecté pour aimer un événement');
      return;
    }

    const token = session.session.access_token;
    try {
      if (isFavorited) {
        // Remove favorite
        const res = await fetch(`/api/favorites?event_id=${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setIsFavorited(false);
          setLikesCount((c) => Math.max(0, c - 1));
        }
      } else {
        // Add favorite
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ event_id: id }),
        });
        if (res.ok) {
          setIsFavorited(true);
          setLikesCount((c) => c + 1);
        }
      }
    } catch (err) {
      console.error('Toggle favorite error', err);
      alert('Erreur lors de la mise à jour des favoris');
    }
  }

  return (
    <article className="bg-[var(--surface)] rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full border border-[#111]">
      {/* Image Container */}
      <div className="relative w-full h-56 bg-[#0b0b0b] overflow-hidden flex-shrink-0 rounded-b-none">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover rounded-t-md border border-[#222]"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23222%22/%3E%3Ctext x=%22300%22 y=%22205%22 fill=%22%23aaa%22 font-size=%2232%22 text-anchor=%22middle%22 font-family=%22Arial,sans-serif%22%3EEvent%3C/text%3E%3C/svg%3E';
          }}
        />
        
        {/* Badge Container - Fixed positioning */}
        <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
          {freefood && (
            <span className="inline-block px-2 py-1 bg-[var(--success)] text-black rounded-full text-xs font-bold shadow-md">
              🍕 FreeFood
            </span>
          )}
          {is_free && (
            <span className="inline-block px-2 py-1 bg-[var(--success)] text-black rounded-full text-xs font-bold shadow-md">
              Gratuit
            </span>
          )}
        </div>
        
        {/* Price Badge - Top Right */}
        {isPaid && price && (
          <div className="absolute top-2 right-2 px-3 py-1 bg-[var(--brand)] text-black rounded-full text-sm font-bold shadow-md">
            {price}€
          </div>
        )}
      </div>

      {/* Content Container - Takes remaining space */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title and Description */}
        <div className="mb-3">
          <h3 className="text-base font-bold text-[var(--text-primary)] line-clamp-2">{title}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{description}</p>
        </div>

        {/* Info Section - Flexible spacing */}
          <div className="space-y-2 text-xs text-[var(--text-muted)] mb-3 flex-grow">
          {/* Date et Lieu sur une ligne */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-sm">📅</span>
              <span className="font-medium text-[var(--text-primary)]">{formatDateTime(date, start_time)}</span>
            </div>
            <div className="flex items-center gap-1 flex-1">
              <span className="text-sm">📍</span>
              <span className="truncate font-medium text-[var(--text-primary)]">{place}</span>
            </div>
          </div>
          
          {/* Places Info */}
          <div className="flex items-center gap-2">
            <span className="text-sm">👥</span>
            <span className="font-medium">
              {placesRemaining > 0 ? (
                <>
                  <span className="text-[var(--success)]">{placesRemaining}</span>
                  <span className="text-[var(--text-muted)]"> places restantes</span>
                </>
              ) : (
                <span className="text-[var(--danger)] font-bold">Complet</span>
              )}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-[#1b1b1b] rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all ${
                    placesFilled < 25 ? 'bg-[var(--success)]' : placesFilled < 50 ? 'bg-green-500' : placesFilled < 75 ? 'bg-yellow-500' : 'bg-[var(--danger)]'
                  }`}
              style={{ width: `${placesFilled}%` }}
            />
          </div>
          <div className="text-xs text-[var(--text-muted)] text-right">{registered}/{capacity} inscrits</div>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex gap-2 pt-3 border-t border-[#111]">
          <button
            onClick={() => onOpen && onOpen(event)}
            className="flex-1 px-3 py-2 text-center bg-[var(--brand)] text-black rounded font-medium hover:opacity-95 transition text-sm"
          >
            {t('see_more')}
          </button>
          <button
            onClick={() => onOpen && onOpen(event)}
            className="flex-1 px-3 py-2 text-center bg-[#0f0f0f] border border-[#222] text-[var(--text-primary)] rounded font-medium hover:bg-[#1b1b1b] transition text-sm"
          >
            {t('register')}
          </button>
          <button
            onClick={toggleFavorite}
            className={`px-3 py-2 transition text-lg relative ${
              isFavorited
                ? 'text-[var(--danger)]'
                : 'text-[var(--text-muted)] hover:text-[var(--danger)]'
            }`}
            title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            {isFavorited ? '❤️' : '♡'}
            {likesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--brand)] text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {likesCount > 99 ? '99+' : likesCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
