// src/components/admin/AdminEventEditModal.jsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminEventEditModal({ event, onClose }) {
  const [form, setForm] = useState({ title: event.title, place: event.place, date: event.date, description: event.description || '' });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const session = await supabase.auth.getSession();
    const token = session.data?.session?.access_token;
    const res = await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: event.id, ...form }),
    });
    if (res.ok) onClose();
    else console.error(await res.json());
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Éditer événement</h2>
        <div className="space-y-3">
          <input value={form.title} onChange={(e) => setForm(s => ({ ...s, title: e.target.value }))} className="w-full p-2 border rounded" />
          <input value={form.place} onChange={(e) => setForm(s => ({ ...s, place: e.target.value }))} className="w-full p-2 border rounded" />
          <input type="date" value={form.date} onChange={(e) => setForm(s => ({ ...s, date: e.target.value }))} className="w-full p-2 border rounded" />
          <textarea value={form.description} onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))} className="w-full p-2 border rounded" rows={4} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">Annuler</button>
          <button onClick={save} disabled={saving} className="px-4 py-1 bg-indigo-600 text-white rounded">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
        </div>
      </div>
    </div>
  );
}
