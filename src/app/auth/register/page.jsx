// src/app/auth/register/page.jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * Page Register
 * - Permet de créer un compte (participant) ou de demander le rôle organisateur.
 * - Après signup, appelle /api/create-profile pour insérer la ligne users (ou créer organizer request).
 * - UI simple, responsive et stylée selon charte.
 */

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [roleRequest, setRoleRequest] = useState('user'); // 'user' | 'organisateur'
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);

  async function onRegister(e) {
    e.preventDefault();
    setLoading(true);
    setInfo(null);
    try {
      if (!email || !password) {
        setInfo({ type: 'error', text: 'Email et mot de passe requis.' });
        setLoading(false);
        return;
      }

      // 1) create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setInfo({ type: 'error', text: error.message || 'Erreur signup' });
        setLoading(false);
        return;
      }

      // signUp returns session only for certain flows; we wait a bit then attempt to get session
      // 2) attempt to get session (user may need to confirm email)
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      // 3) call server to create profile OR create organizer request
      if (token) {
        const res = await fetch('/api/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ role: roleRequest, display_name: displayName }),
        });
        const j = await res.json();
        if (!res.ok) {
          setInfo({ type: 'error', text: j.error || 'Erreur création profil' });
          setLoading(false);
          return;
        }
        // success
        if (roleRequest === 'organisateur') {
          setInfo({ type: 'success', text: 'Inscription réussie. Une demande d’organisateur a été créée et sera examinée par un admin.' });
        } else {
          setInfo({ type: 'success', text: 'Inscription réussie. Tu peux te connecter.' });
        }
        // redirect optionally to login or to profile
        setTimeout(() => router.push('/auth/login'), 1500);
      } else {
        // no token available (email confirmation required)
        setInfo({ type: 'info', text: 'Vérifie ton email : tu dois peut-être confirmer ton adresse avant de te connecter.' });
        setTimeout(() => router.push('/auth/login'), 2500);
      }
    } catch (err) {
      console.error(err);
      setInfo({ type: 'error', text: err.message || 'Erreur inattendue' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md bg-[var(--surface)] rounded-lg shadow p-6 border border-[#111]">
        <h2 className="text-2xl font-bold mb-2">Créer un compte Meetral</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">Inscris-toi pour rejoindre la communauté. Si tu veux organiser des événements, choisis "Organisateur".</p>

        {info && (
          <div className={`mb-4 text-sm p-3 rounded ${info.type === 'error' ? 'bg-[var(--danger-dark)]/20 text-[var(--danger)]' : info.type === 'success' ? 'bg-[var(--success-dark)]/10 text-[var(--success)]' : 'bg-[var(--surface)]/40 text-[var(--text-muted)]'}`}>
            {info.text}
          </div>
        )}

        <form onSubmit={onRegister} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)]">Nom affiché (optionnel)</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" placeholder="Ex: Alice" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)]">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)]">Mot de passe</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium">Type de compte</label>
            <div className="mt-2 flex gap-2">
              <label className={`px-3 py-2 border rounded cursor-pointer ${roleRequest === 'user' ? 'bg-[#111] border-[#222]' : ''}`}>
                <input type="radio" name="role" value="user" checked={roleRequest === 'user'} onChange={() => setRoleRequest('user')} className="mr-2" /> Participant
              </label>
              <label className={`px-3 py-2 border rounded cursor-pointer ${roleRequest === 'organisateur' ? 'bg-[#111] border-[var(--success)]' : ''}`}>
                <input type="radio" name="role" value="organisateur" checked={roleRequest === 'organisateur'} onChange={() => setRoleRequest('organisateur')} className="mr-2" /> Organisateur (demande)
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button type="submit" disabled={loading} className="bg-[var(--brand)] text-black px-4 py-2 rounded">
              {loading ? 'En cours…' : 'Créer mon compte'}
            </button>
            <button type="button" onClick={() => router.push('/auth/login')} className="text-sm text-[var(--text-muted)]">J'ai déjà un compte</button>
          </div>
        </form>
      </div>
    </div>
  );
}
