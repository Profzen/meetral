// src/app/auth/page.jsx
'use client';

/**
 * Page Auth (login <-> register) combinée
 *
 * - Toggle entre Login et Register dans une même page.
 * - Register: signup via Supabase, puis appelle /api/create-profile (server)
 *   pour créer la ligne dans `users` ou créer une organizer_request si demandé.
 * - Login: signInWithPassword (supabase v2) puis redirection.
 * - Logout: supabase.auth.signOut()
 *
 * Prérequis:
 * - src/lib/supabaseClient.js exporte `supabase`
 * - route /api/create-profile existe (server side) — insère les profils ou crée organizer_requests
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from '@/lib/i18n';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [requestOrganizer, setRequestOrganizer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const { t } = useTranslation();
  const [session, setSession] = useState(null);

  // Watch session (on mount)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data?.session ?? null);
    })();

    // subscribe to auth changes to update UI
    const { subscription } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Login handler
  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setInfo(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setInfo({ type: 'error', text: error.message });
        setLoading(false);
        return;
      }
      setInfo({ type: 'success', text: 'Connexion réussie — redirection...' });

      // Redirect to home or dashboard after small delay
      setTimeout(() => router.push('/'), 800);
    } catch (err) {
      console.error(err);
      setInfo({ type: 'error', text: err.message || 'Erreur connexion' });
    } finally {
      setLoading(false);
    }
  }

  // Register handler
  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setInfo(null);

    try {
      if (!email || !password) {
        setInfo({ type: 'error', text: 'Email et mot de passe requis.' });
        setLoading(false);
        return;
      }

      // 1) Sign up with supabase auth
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName || null } }, // metadata if you want
      });

      if (signupError) {
        setInfo({ type: 'error', text: signupError.message || 'Erreur inscription' });
        setLoading(false);
        return;
      }

      // 2) Try to get session / token. Depending on email confirmation settings,
      // session may be available or not (if email confirm required).
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token ?? null;

      // 3) If token available, call server to create profile or organizer request
      if (token) {
        const desiredRole = requestOrganizer ? 'organisateur' : 'user';
        const res = await fetch('/api/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ role: desiredRole, display_name: displayName }),
        });
        const j = await res.json();
        if (!res.ok) {
          setInfo({ type: 'error', text: j.error || 'Erreur création profil' });
          setLoading(false);
          return;
        }
        if (desiredRole === 'organisateur') {
          setInfo({ type: 'success', text: 'Inscription ok — demande organisateur créée, en attente d’approbation.' });
        } else {
          setInfo({ type: 'success', text: 'Inscription réussie. Tu es prêt à te connecter.' });
        }
      } else {
        // No token — likely confirm email required
        setInfo({ type: 'info', text: 'Inscription effectuée. Vérifie ton email pour confirmer ton compte.' });
      }

      // after registration, switch to login view
      setTimeout(() => setMode('login'), 1200);
    } catch (err) {
      console.error(err);
      setInfo({ type: 'error', text: err.message || 'Erreur inscription' });
    } finally {
      setLoading(false);
    }
  }

  // Logout handler
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      setInfo({ type: 'info', text: 'Déconnecté.' });
      setSession(null);
    } catch (err) {
      console.error(err);
      setInfo({ type: 'error', text: 'Erreur déconnexion' });
    }
  }

  // If user already logged in -> show simple account panel with logout / go to dashboard
  if (session) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-[var(--surface)] p-6 rounded shadow w-full max-w-md text-center border border-[#111]">
          <h2 className="text-xl font-semibold mb-2">Vous êtes connecté</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">Email: {session.user.email}</p>

          <div className="flex justify-center gap-3">
            <button onClick={() => router.push('/')} className="px-4 py-2 border border-[#222] rounded text-[var(--text-muted)]">Accueil</button>
            <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-[var(--brand)] text-black rounded">Mon dashboard</button>
            <button onClick={handleLogout} className="px-4 py-2 bg-[var(--danger)] text-white rounded">Se déconnecter</button>
          </div>

          {info && <div className={`mt-4 text-sm ${info.type === 'error' ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>{info.text}</div>}
        </div>
      </div>
    );
  }

  // Auth UI (toggle between login & register)
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-lg bg-[var(--surface)] rounded-lg shadow p-6 border border-[#111]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{mode === 'login' ? t('login') : 'Créer un compte'}</h2>
          <div>
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm text-[var(--text-muted)] underline">
              {mode === 'login' ? "Tu n'as pas de compte ? S'inscrire" : 'Déjà inscrit ? Se connecter'}
            </button>
          </div>
        </div>

        {info && (
          <div className={`mb-3 p-3 rounded text-sm ${info.type === 'error' ? 'bg-[var(--danger-dark)]/20 text-[var(--danger)]' : info.type === 'success' ? 'bg-[var(--success-dark)]/10 text-[var(--success)]' : 'bg-[var(--surface)]/40 text-[var(--text-muted)]'}`}>
            {info.text}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full rounded border px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium">Mot de passe</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full rounded border px-3 py-2" />
            </div>

            <div className="flex items-center justify-between">
              <button type="submit" disabled={loading} className="bg-[var(--brand)] text-black px-4 py-2 rounded">{loading ? `${t('login')}…` : t('login')}</button>
              <button type="button" onClick={() => router.push('/auth/register')} className="text-sm text-[var(--text-muted)]">Inscription rapide</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)]">Nom affiché (optionnel)</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" placeholder="Ex : Alice" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)]">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)]">Mot de passe</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" />
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={requestOrganizer} onChange={(e) => setRequestOrganizer(e.target.checked)} className="accent-[var(--brand)]"/> <span className="text-[var(--text-muted)]">Je souhaite être organisateur (demande)</span></label>
            </div>

            <div className="flex items-center justify-between">
              <button type="submit" disabled={loading} className="bg-[var(--brand)] text-black px-4 py-2 rounded">{loading ? 'Inscription…' : 'Créer mon compte'}</button>
              <button type="button" onClick={() => setMode('login')} className="text-sm text-[var(--text-muted)]">Se connecter</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
