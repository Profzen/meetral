"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPage(){
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // loading | ready | error | done
  const [message, setMessage] = useState('Vérification du lien...');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase sometimes puts the token in the URL hash (#access_token=...) or in the
    // query string (?access_token=... or ?token=...). Accept both formats for robustness.
    const hash = window.location.hash || '';
    const hashParams = new URLSearchParams(hash.replace('#', ''));
    const searchParams = new URLSearchParams(window.location.search || '');

    // Prefer hash params if present, otherwise fall back to query string.
    const accessToken = hashParams.get('access_token') || searchParams.get('access_token') || searchParams.get('token');
    const type = hashParams.get('type') || searchParams.get('type');

    if (!accessToken || type !== 'recovery') {
      setStatus('error');
      setMessage('Le lien de réinitialisation n\'est pas valide.');
      return;
    }

    // verify the token to create a session client-side
    (async () => {
      try{
        // For password recovery, Supabase sends access_token directly in the URL
        // We need to use setSession() instead of verifyOtp()
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (error) throw error;
        setStatus('ready');
        setMessage('Définis un nouveau mot de passe.');
      }catch(err){
        console.error('verify recovery', err);
        setStatus('error');
        setMessage(err?.message || 'Erreur lors de la vérification du lien');
      }
    })();
  }, []);

  async function onSubmit(e){
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setMessage('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try{
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setStatus('done');
      setMessage('Mot de passe réinitialisé. Tu vas être redirigé vers la page de connexion.');
      setTimeout(() => router.push('/auth/login'), 2500);
    }catch(err){
      console.error('reset password update', err);
      setMessage(err?.message || 'Erreur lors de la mise à jour du mot de passe');
    }finally{ setLoading(false); }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-[var(--surface)] rounded-lg shadow p-6 border border-[#111]">
        <h2 className="text-2xl font-bold mb-2">Réinitialisation du mot de passe</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">{message}</p>

        {status === 'ready' && (
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)]">Nouveau mot de passe</label>
              <input value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} type="password" required className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" disabled={loading} />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={loading} className="w-full bg-[var(--brand)] text-black px-6 py-2 rounded font-medium hover:opacity-95 transition disabled:opacity-50">{loading ? 'Sauvegarde...' : 'Définir le mot de passe'}</button>
            </div>
          </form>
        )}

        {status === 'error' && (
          <div className="mt-4">
            <button className="bg-[var(--brand)] text-black px-4 py-2 rounded" onClick={() => router.push('/auth/forgot')}>Demander un nouveau lien</button>
          </div>
        )}
      </div>
    </div>
  );
}
