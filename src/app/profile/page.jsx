// src/app/profile/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import RequestOrganizerButton from '@/components/auth/RequestOrganizerButton';

export default function ProfilePage(){
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState({ display_name: '' });
  const [role, setRole] = useState(null);
  const [message, setMessage] = useState(null);
  const { language: ctxLanguage, setLanguage: setCtxLanguage } = useUser();
  const [language, setLanguage] = useState(ctxLanguage ?? 'fr');
  const { t } = useTranslation();

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data?.session) { router.push('/auth'); return; }
      setSession(data.session);
      try{
        const { data: userProfil } = await supabase.from('users').select('display_name, lang, role').eq('user_id', data.session.user.id).single();
        if (mounted) setProfile({ display_name: userProfil?.display_name ?? '' });
        if (mounted) setLanguage(userProfil?.lang ?? (localStorage.getItem('meetral_lang') || 'fr'));
        if (mounted && setCtxLanguage) setCtxLanguage(userProfil?.lang ?? (localStorage.getItem('meetral_lang') || 'fr'));
        if (mounted) setRole(userProfil?.role ?? null);
      }catch(err){ console.error(err); }
      if (mounted) setLoading(false);
    })();
    return ()=> mounted = false;
  },[router]);

  async function onSave(e){
    e.preventDefault();
    setMessage(null);
    try{
      const { data } = await supabase.auth.getSession();
      if (!data?.session) return;
      const token = data.session.access_token;
      // call server to update profile, placeholder using /api/create-profile endpoint if exists
      const res = await fetch('/api/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ display_name: profile.display_name, role: undefined, lang: language }),
      });
      if (!res.ok) throw new Error('Erreur sauvegarde profil');
      setMessage({ type: 'success', text: 'Profil mis à jour.' });
    }catch(err){ console.error(err); setMessage({ type: 'error', text: err.message }); }
  }

  async function onSignOut(){
    await supabase.auth.signOut();
    router.push('/');
  }

  async function onResetPassword(){
    setMessage(null);
    try{
      const { data } = await supabase.auth.getSession();
      const email = data?.session?.user?.email;
      if(!email) throw new Error('Email introuvable');
      const { data: res, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Email de réinitialisation envoyé.' });
    }catch(err){ console.error(err); setMessage({ type: 'error', text: err.message || 'Erreur envoi email' }); }
  }

  async function onLanguageChange(lang){
    setLanguage(lang);
    if (setCtxLanguage) setCtxLanguage(lang);
    // persist locally
    try{ localStorage.setItem('meetral_lang', lang); }catch(e){}
    // persist server-side when possible
    try{
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) return; // not logged in, local storage is enough
      await fetch('/api/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ display_name: profile.display_name, role: undefined, lang }),
      });
    }catch(e){ console.warn('Could not persist language server-side', e); }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">{t('edit_profile')}</h1>
      {loading ? <div>Chargement…</div> : (
        <div className="bg-[var(--surface)] p-6 rounded shadow border border-[#111] max-w-3xl mx-auto">
          {message && <div className={`mb-3 text-sm ${message.type === 'error' ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>{message.text}</div>}
          <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)]">Email</label>
              <p className="text-sm text-[var(--text-muted)]">{session?.user.email}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Rôle: {role ?? 'Membre'}</p>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)]">Nom d'affichage</label>
              <input value={profile.display_name} onChange={(e)=>setProfile(s=>({ ...s, display_name: e.target.value }))} className="mt-1 block w-full rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] px-3 py-2" />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <button type="submit" className="px-4 py-2 bg-[var(--brand)] text-black rounded">Sauvegarder</button>
              <button type="button" className="px-4 py-2 border rounded" onClick={()=> router.push('/dashboard')}>Annuler</button>
            </div>
          </form>
          <div className="mt-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">{t('profile')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <Link href="/dashboard/tickets" className="px-3 py-2 bg-[#0f0f0f] border border-[#222] rounded text-[var(--text-primary)] text-center">{t('my_tickets')}</Link>
              <Link href="/dashboard/participations" className="px-3 py-2 bg-[#0f0f0f] border border-[#222] rounded text-[var(--text-primary)] text-center">Mes participations</Link>
              {role && (role === 'organisateur' || role === 'admin') ? (
                <Link href="/dashboard/my-events" className="px-3 py-2 bg-[#0f0f0f] border border-[#222] rounded text-[var(--text-primary)] text-center">{t('manage_my_events')}</Link>
              ) : (
                <RequestOrganizerButton />
              )}
              <button onClick={onSignOut} className="px-3 py-2 bg-[var(--danger)] text-black rounded font-medium" title="Se déconnecter">{t('logout')}</button>
            </div>
            <div className="mt-4 border-t pt-4">
              <label className="block text-sm text-[var(--text-muted)] mb-2">{t('site_lang')}</label>
              <div className="flex items-center gap-2">
                <button onClick={()=>onLanguageChange('fr')} className={`px-3 py-2 rounded ${language === 'fr' ? 'bg-[var(--brand)] text-black' : 'bg-[#0f0f0f] text-[var(--text-primary)]'}`}>Français</button>
                <button onClick={()=>onLanguageChange('en')} className={`px-3 py-2 rounded ${language === 'en' ? 'bg-[var(--brand)] text-black' : 'bg-[#0f0f0f] text-[var(--text-primary)]'}`}>English</button>
              </div>
            </div>
            <div className="mt-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Sécurité</h3>
              <div className="flex gap-2">
                <button onClick={onResetPassword} className="px-3 py-2 bg-[#0f0f0f] border border-[#222] rounded">{t('reset_password')}</button>
                <button onClick={()=>navigator.clipboard?.writeText(session?.user?.email || '')} className="px-3 py-2 bg-[#0f0f0f] border border-[#222] rounded">Copier mon email</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
