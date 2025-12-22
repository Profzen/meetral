// src/app/auth/register/page.jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleRequest, setRoleRequest] = useState('user');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(null);

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

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            display_name: displayName,
            phone: phone,
            role_request: roleRequest,
          }
        }
      });

      if (error) {
        setInfo({ type: 'error', text: error.message || 'Erreur signup' });
        setLoading(false);
        return;
      }

      setInfo({ 
        type: 'success', 
        text: '✅ Inscription réussie ! Un email de confirmation a été envoyé à ' + email + '. Vérifie ta boîte mail et clique sur le lien pour activer ton compte.' 
      });

      setRedirectCountdown(3);
      const interval = setInterval(() => {
        setRedirectCountdown((c) => {
          if (c === null) return null;
          if (c <= 1) {
            clearInterval(interval);
            return 0;
          }
          return c - 1;
        });
      }, 1000);

      setTimeout(() => {
        setRedirectCountdown(null);
        router.push('/auth/login?message=confirm_email');
      }, 3000);

    } catch (err) {
      console.error(err);
      setInfo({ type: 'error', text: err.message || 'Erreur inattendue' });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-[var(--surface)] rounded-lg shadow p-6 border border-[#111]">
        <h2 className="text-2xl font-bold mb-2">Créer un compte Meetral</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">Inscris-toi pour rejoindre la communauté.</p>

        {info && (
          <div className={`mb-4 text-sm p-3 rounded ${info.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
            {info.text}
            {info.type === 'success' && redirectCountdown !== null && (
              <div className="mt-2 text-xs text-[var(--text-muted)]">Tu vas être redirigé vers la page de connexion dans {redirectCountdown} seconde{redirectCountdown > 1 ? 's' : ''}…</div>
            )}
          </div>
        )}

        <form onSubmit={onRegister} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)]">Nom (optionnel)</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Ex: Alice" disabled={loading} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)]">Téléphone (optionnel)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" placeholder="Ex: +33 6 12 34 56 78" disabled={loading} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)]">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" disabled={loading} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)]">Mot de passe</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" disabled={loading} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type de compte</label>
            <div className="flex gap-2">
              <label className={`flex-1 px-3 py-2 border rounded cursor-pointer transition ${roleRequest === 'user' ? 'bg-[#111] border-[var(--brand)]' : 'border-[#222]'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input type="radio" name="role" value="user" checked={roleRequest === 'user'} onChange={() => setRoleRequest('user')} className="mr-2" disabled={loading} /> Participant
              </label>
              <label className={`flex-1 px-3 py-2 border rounded cursor-pointer transition ${roleRequest === 'organisateur' ? 'bg-[#111] border-[var(--success)]' : 'border-[#222]'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input type="radio" name="role" value="organisateur" checked={roleRequest === 'organisateur'} onChange={() => setRoleRequest('organisateur')} className="mr-2" disabled={loading} /> Organisateur
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button type="submit" disabled={loading} className="w-full sm:w-auto bg-[var(--brand)] text-black px-6 py-2 rounded font-medium hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Inscription en cours...' : 'Créer mon compte'}
            </button>
            <button type="button" onClick={() => router.push('/auth/login')} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition" disabled={loading}>
              J'ai déjà un compte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
