// src/app/auth/login/page.jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * Page Login
 * - login par email/password
 * - propose lien vers inscription
 * - redirige vers '/' après connexion
 */

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);

  async function onLogin(e) {
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
      // Signed in
      setInfo({ type: 'success', text: 'Connexion réussie. Redirection…' });
      setTimeout(() => router.push('/'), 800);
    } catch (err) {
      console.error(err);
      setInfo({ type: 'error', text: err.message || 'Erreur' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md bg-[var(--surface)] rounded-lg shadow p-6 border border-[#111]">
        <h2 className="text-2xl font-bold mb-2">Connexion</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">Connecte-toi pour gérer tes événements ou t'inscrire aux événements.</p>

        {info && <div className={`mb-4 text-sm p-3 rounded ${info.type === 'error' ? 'bg-[var(--danger-dark)]/20 text-[var(--danger)]' : 'bg-[var(--success-dark)]/10 text-[var(--success)]'}`}>{info.text}</div>}

        <form onSubmit={onLogin} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)]">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)]">Mot de passe</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" />
          </div>

          <div className="flex items-center justify-between">
            <button type="submit" disabled={loading} className="bg-[var(--brand)] text-black px-4 py-2 rounded">
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
            <button type="button" onClick={() => router.push('/auth/register')} className="text-sm text-[var(--text-muted)]">Créer un compte</button>
          </div>
        </form>
      </div>
    </div>
  );
}
