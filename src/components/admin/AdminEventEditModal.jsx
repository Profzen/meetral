// src/components/admin/AdminEventEditModal.jsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Modal d'édition Admin avec upload cover et champs complets (aligné sur EventForm)
export default function AdminEventEditModal({ event, onClose }) {
  const [form, setForm] = useState({
    title: event.title || '',
    description: event.description || '',
    date: event.date ? event.date.split('T')[0] : '',
    start_time: event.start_time || '18:00',
    place: event.place || '',
    is_free: !!event.is_free,
    freefood: !!event.freefood,
    price: event.price ?? 0,
    capacity: event.capacity ?? 0,
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(event.cover_url || null);
  const [saving, setSaving] = useState(false);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
  }

  function onFileChange(e) {
    const f = e.target.files?.[0] ?? null;
    setCoverFile(f);
    if (f) setCoverPreview(URL.createObjectURL(f));
  }

  async function uploadCover(file) {
    if (!file) return event.cover_url || null;
    const reader = new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
    const dataUrl = await reader;
    const res = await fetch('/api/cloudinary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, folder: 'events' }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Cloudinary upload failed');
    return json.url ?? null;
  }

  async function save() {
    try {
      setSaving(true);
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error('Session invalide');

      let cover_url = event.cover_url || null;
      if (coverFile) {
        cover_url = await uploadCover(coverFile);
      }

      const payload = {
        id: event.id,
        ...form,
        price: form.is_free ? 0 : Number(form.price || 0),
        capacity: Number(form.capacity || 0),
        cover_url,
      };

      const res = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Erreur sauvegarde');
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-[var(--surface)] p-6 rounded-md w-full max-w-2xl border border-[#111] max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Éditer événement</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block text-sm text-[var(--text-muted)]">Titre</label>
            <input value={form.title} name="title" onChange={onChange} className="w-full p-2 border border-[#222] rounded bg-[#0f0f0f] text-[var(--text-primary)]" />

            <label className="block text-sm text-[var(--text-muted)]">Lieu</label>
            <input value={form.place} name="place" onChange={onChange} className="w-full p-2 border border-[#222] rounded bg-[#0f0f0f] text-[var(--text-primary)]" />

            <label className="block text-sm text-[var(--text-muted)]">Date</label>
            <input type="date" value={form.date} name="date" onChange={onChange} className="w-full p-2 border border-[#222] rounded bg-[#0f0f0f] text-[var(--text-primary)]" />

            <label className="block text-sm text-[var(--text-muted)]">Heure de début</label>
            <input type="time" value={form.start_time} name="start_time" onChange={onChange} className="w-full p-2 border border-[#222] rounded bg-[#0f0f0f] text-[var(--text-primary)]" />

            <label className="block text-sm text-[var(--text-muted)]">Description</label>
            <textarea value={form.description} name="description" onChange={onChange} className="w-full p-2 border border-[#222] rounded bg-[#0f0f0f] text-[var(--text-primary)]" rows={4} />
          </div>

          <div className="space-y-3">
            <label className="block text-sm text-[var(--text-muted)]">Image de couverture</label>
            {coverPreview && <img src={coverPreview} alt="Cover preview" className="w-full h-40 object-cover rounded border border-[#222]" />}
            <input type="file" accept="image/*" onChange={onFileChange} className="w-full text-sm" />

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <input type="checkbox" name="is_free" checked={form.is_free} onChange={onChange} />
                Gratuit
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <input type="checkbox" name="freefood" checked={form.freefood} onChange={onChange} />
                Restauration offerte
              </label>
            </div>

            {!form.is_free && (
              <div>
                <label className="block text-sm text-[var(--text-muted)]">Prix (€)</label>
                <input type="number" min="0" step="0.01" name="price" value={form.price} onChange={onChange} className="w-full p-2 border border-[#222] rounded bg-[#0f0f0f] text-[var(--text-primary)]" />
              </div>
            )}

            <div>
              <label className="block text-sm text-[var(--text-muted)]">Capacité</label>
              <input type="number" min="1" name="capacity" value={form.capacity} onChange={onChange} className="w-full p-2 border border-[#222] rounded bg-[#0f0f0f] text-[var(--text-primary)]" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border border-[#222] rounded text-[var(--text-muted)]">Annuler</button>
          <button onClick={save} disabled={saving} className="px-4 py-1 bg-[var(--brand)] text-black rounded flex items-center gap-2 disabled:opacity-50">
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" aria-hidden="true"></span>
                <span>Enregistrement...</span>
              </>
            ) : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
