// src/components/admin/AdminEventRow.jsx
'use client';
import React from 'react';

export default function AdminEventRow({ event, onEdit, onDelete }) {
  return (
    <div className="bg-white p-4 rounded-md shadow flex items-center justify-between">
      <div>
        <div className="font-semibold">{event.title}</div>
        <div className="text-sm text-slate-500">{event.place} • {event.date}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="px-3 py-1 border rounded text-sm">Éditer</button>
        <button onClick={onDelete} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Supprimer</button>
      </div>
    </div>
  );
}
