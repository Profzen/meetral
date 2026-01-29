"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ForgotPage(){
  const [email, setEmail] = useState('');
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e){
    e.preventDefault();
    setLoading(true);
    setInfo(null);
    try{
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`
      });
      if (error) throw error;
      setInfo({ type: 'success', text: `Un email de réinitialisation a été envoyé à ${email}. Vérifie tes dossiers "Courrier indésirable" ou "Spam" si tu ne le trouves pas dans ta boîte de réception.` });
    } catch (err) {
      console.error('forgot password', err);
      setInfo({ type: 'error', text: err?.message || "Erreur lors de l'envoi de l'email" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-[var(--surface)] rounded-lg shadow p-6 border border-[#111]">
        <h2 className="text-2xl font-bold mb-2">Réinitialiser le mot de passe</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">Entrer ton email et tu recevras un lien pour définir un nouveau mot de passe.</p>
        {info && <div className={`mb-4 text-sm p-3 rounded ${info.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>{info.text}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)]">Email</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" disabled={loading} />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading} className="w-full bg-[var(--brand)] text-black px-6 py-2 rounded font-medium hover:opacity-95 transition disabled:opacity-50">{loading ? 'Envoi...' : 'Envoyer le lien'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
