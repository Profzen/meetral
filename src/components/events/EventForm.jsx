// src/components/events/EventForm.jsx
'use client';

/**
 * EventForm (création & édition)
 * - Création : POST /api/events (route server-side fournie précédemment)
 * - Édition : PATCH /api/events/{id} (route server-side fournie précédemment)
 *
 * Si tu actives les policies RLS (A), tu pourras modifier cette logique pour
 * écrire directement via supabase.from('events').update(...) côté client — j'ai laissé
 * des commentaires indiquant où faire ce changement.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import formatCurrency from '@/utils/formatCurrency';

export default function EventForm({ initialEvent = null, eventId = null, onSuccess = null }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '18:00',
    place: '',
    is_free: false,
    freefood: false,
  price: null,
  capacity: '',
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [mode, setMode] = useState(initialEvent ? 'edit' : 'create');
  const [fetchedEvent, setFetchedEvent] = useState(null);

  useEffect(() => {
    if (initialEvent) {
      const ev = initialEvent;
        setForm({
        title: ev.title ?? '',
        description: ev.description ?? '',
        date: ev.date ? ev.date.split('T')[0] : '',
        start_time: ev.start_time ?? '18:00',
        place: ev.place ?? '',
        is_free: !!ev.is_free,
        freefood: !!ev.freefood,
          price: ev.price ?? null,
          capacity: ev.capacity ?? '',
      });
      setCoverPreview(ev.cover_url ?? null);
      setMode('edit');
      setFetchedEvent(ev);
      return;
    }

    if (eventId) {
      // fetch event to edit (fallback if not provided initialEvent)
      (async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/events');
          const json = await res.json();
          const ev = (json.events || []).find(e => String(e.id) === String(eventId));
          if (!ev) {
            setMessage({ type: 'error', text: 'Événement introuvable.' });
            return;
          }
          setForm({
            title: ev.title ?? '',
            description: ev.description ?? '',
            date: ev.date ? ev.date.split('T')[0] : '',
            start_time: ev.start_time ?? '18:00',
            place: ev.place ?? '',
            is_free: !!ev.is_free,
            freefood: !!ev.freefood,
            price: ev.price ?? null,
            capacity: ev.capacity ?? '',
          });
          setCoverPreview(ev.cover_url ?? null);
          setMode('edit');
          setFetchedEvent(ev);
        } catch (err) {
          console.error('fetch event for edit', err);
          setMessage({ type: 'error', text: 'Erreur de chargement.' });
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [initialEvent, eventId]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    // coerce number inputs to strings/ints at the right time
    if (type === 'checkbox') {
      setForm(s => ({ ...s, [name]: checked, ...(name === 'is_free' && checked ? { price: null } : {}) }));
      return;
    }

    if (e.target.type === 'number') {
      // keep as string for controlled input but prevent non-numeric
      setForm(s => ({ ...s, [name]: value }));
      return;
    }

    setForm(s => ({ ...s, [name]: value }));
  }

  function onFileChange(e) {
    const f = e.target.files?.[0] ?? null;
    setCoverFile(f);
    if (f) setCoverPreview(URL.createObjectURL(f));
  }

  async function uploadCover(file) {
    if (!file) return null;
    try {
      // Upload to Cloudinary via server endpoint
      const reader = new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = (e) => reject(e);
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
    } catch (err) {
      const msg = err?.message || err || 'Upload error';
      throw new Error(msg);
    }
  }

  // Use server endpoints for create/edit (safe). If you enabled RLS policies in (A)
  // you could instead use client-side supabase.from('events').update() (see commented example).
  async function onSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (!form.title || !form.date) {
        setMessage({ type: 'error', text: 'Titre et date requis.' });
        setLoading(false);
        return;
      }
      if (!form.start_time) {
        setMessage({ type: 'error', text: "Indique une heure de début" });
        setLoading(false);
        return;
      }
      // validate price if not free
      if (!form.is_free) {
        const p = Number(form.price);
        if (!form.price || isNaN(p) || p < 0) {
          setMessage({ type: 'error', text: "Prix invalide : indiquez un prix ≥ 0 ou cochez 'Gratuit'" });
          setLoading(false);
          return;
        }
      }
      // validate capacity
      const cap = Number(form.capacity);
      if (!form.capacity || isNaN(cap) || cap <= 0) {
        setMessage({ type: 'error', text: 'Capacité invalide : indiquez un entier > 0' });
        setLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setMessage({ type: 'error', text: 'Tu dois être connecté.' });
        setLoading(false);
        return;
      }

      let cover_url = fetchedEvent?.cover_url ?? null;
      if (coverFile) {
        try {
          cover_url = await uploadCover(coverFile);
        } catch (err) {
          console.error(err);
          const text = String(err.message || err);
          if (text.toLowerCase().includes('bucket')) {
            setMessage({ type: 'error', text: `Échec upload image: ${text}. Créez le bucket 'events' dans Supabase Storage.` });
          } else {
            setMessage({ type: 'error', text: 'Échec upload image: ' + text });
          }
          setLoading(false);
          return;
        }
      }

  // Ensure price is stored as integer XOF (no decimals)
  const priceInt = form.is_free ? 0 : Math.round(Number(form.price || 0));
  const payload = { ...form, cover_url, price: priceInt, capacity: Number(form.capacity || 0) };

      if (mode === 'create') {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (res.status === 404) {
          setMessage({ type: 'error', text: "Endpoint /api/events introuvable (404). Vérifie que l'API est exposée et redémarre le serveur." });
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error(j.error || 'Erreur création');
        setMessage({ type: 'success', text: 'Événement créé.' });
        setForm({ title: '', description: '', date: '', place: '', is_free: false, freefood: false, price: null, capacity: 0 });
        setCoverFile(null);
        if (onSuccess) onSuccess(j.event ?? j);
      } else {
        // EDIT: call PATCH /api/events/{id}
        const id = fetchedEvent?.id ?? eventId;
        if (!id) throw new Error('Id événement manquant.');
        const res = await fetch(`/api/events/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (res.status === 404) {
          setMessage({ type: 'error', text: "Endpoint /api/events/[id] introuvable (404). Vérifie que l'API est exposée et redémarre le serveur." });
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error(j.error || 'Erreur mise à jour');
        setMessage({ type: 'success', text: 'Événement mis à jour.' });
        if (onSuccess) onSuccess(j.event ?? j);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Erreur inattendue' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-[var(--surface)] p-6 rounded-md shadow border border-[#111]">
      {message && <div className={`text-sm ${message.type === 'error' ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>{message.text}</div>}

      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)]">Titre *</label>
        <input name="title" value={form.title} onChange={onChange} className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)]">Description</label>
        <textarea name="description" value={form.description} onChange={onChange} rows={4} className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)]">Date *</label>
          <input name="date" type="date" value={form.date} onChange={onChange} className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)]">Heure de début *</label>
          <input name="start_time" type="time" value={form.start_time} onChange={onChange} className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)]">Lieu</label>
          <input name="place" value={form.place} onChange={onChange} className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2"><input type="checkbox" name="is_free" checked={form.is_free} onChange={onChange} className="accent-[var(--brand)]" /> <span className="text-sm text-[var(--text-muted)]">Gratuit</span></label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" name="freefood" checked={form.freefood} onChange={onChange} className="accent-[var(--brand)]" /> <span className="text-sm text-[var(--text-muted)]">FreeFood</span></label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)]">Nombre de places (capacity)</label>
          <input name="capacity" type="number" min="1" value={form.capacity} onChange={onChange} className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" />
        </div>
        <div>
          {!form.is_free && (
            <>
              <label className="block text-sm font-medium text-[var(--text-muted)]">Prix (XOF)</label>
              <div className="flex items-center gap-2">
                <input name="price" type="number" min="0" step="1" value={form.price ?? ''} onChange={onChange} className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" />
                <div className="text-sm text-[var(--text-muted)] w-36">
                  {form.price !== null && form.price !== '' ? <span>{formatCurrency(Number(form.price || 0))}</span> : <span className="italic">Aucun</span>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Image de couverture (optionnel)</label>
        <p className="text-xs text-[var(--text-muted)] mt-1 mb-2">
          💡 Pour un meilleur rendu, utilisez des images au format <strong>16:9</strong> (ex: 1920x1080, 1600x900, etc.)
        </p>
        <input type="file" accept="image/*" onChange={onFileChange} className="mt-1 block w-full text-[var(--text-primary)]" />
        {coverPreview && <img src={coverPreview} alt="preview" className="mt-2 w-48 h-28 object-cover rounded" />}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="bg-[var(--brand)] text-black px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50">
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" aria-hidden="true"></span>
              <span>{mode === 'create' ? 'Publication…' : 'Enregistrement…'}</span>
            </>
          ) : (
            mode === 'create' ? 'Publier' : 'Mettre à jour'
          )}
        </button>
        <button type="button" onClick={() => { setForm({ title: '', description: '', date: '', start_time: '18:00', place: '', is_free: false, freefood: false, price: null, capacity: 0 }); setCoverFile(null); setCoverPreview(null); }} className="text-sm px-3 py-1 border rounded border-[#222] text-[var(--text-muted)]">Réinitialiser</button>
      </div>
    </form>
  );
}
