// src/components/events/EventCard.jsx
'use client';
import React from 'react';
import formatDate from '@/utils/formatDate';

export default function EventCard({ event, onOpen }) {
  const { id, title, place, date, freefood, cover_url, description, is_free } = event;

  return (
    <article className="bg-white rounded-lg shadow hover:shadow-md overflow-hidden flex flex-col">
      <div className="h-44 bg-gray-100 overflow-hidden">
        {cover_url ? (
          <img src={cover_url} alt={title} className="w-full h-44 object-cover" />
        ) : (
          <div className="w-full h-44 flex items-center justify-center text-slate-400">No image</div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-sm text-slate-500">{formatDate(date)}</div>
        </div>

        <p className="text-sm text-slate-600 mt-2 line-clamp-3">{description || 'Pas de description'}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {freefood && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">FreeFood</span>}
            {is_free && <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">Gratuit</span>}
            <div className="text-sm text-slate-500">{place}</div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => onOpen && onOpen()} className="px-3 py-1 border rounded text-sm">Voir</button>
            <button className="px-3 py-1 bg-sky-600 text-white rounded text-sm">Participer</button>
          </div>
        </div>
      </div>
    </article>
  );
}
