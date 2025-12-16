// src/components/admin/AdminEventRow.jsx
'use client';
import React from 'react';

export default function AdminEventRow({ event, onEdit, onDelete }) {
  return (
    <div className="bg-[var(--surface)] p-4 rounded-md shadow flex items-center justify-between border border-[#111]">
      <div>
        <div className="font-semibold">{event.title}</div>
        <div className="text-sm text-[var(--text-muted)]">{event.place} • {event.date}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="px-3 py-1 border border-[#222] rounded text-sm text-[var(--text-muted)]">Éditer</button>
        <button onClick={onDelete} className="px-3 py-1 bg-[var(--danger)] text-white rounded text-sm">Supprimer</button>
      </div>
    </div>
  );
}
