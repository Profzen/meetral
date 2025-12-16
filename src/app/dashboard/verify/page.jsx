// src/app/dashboard/verify/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function VerifyPage() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [manual, setManual] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const t = data?.session?.access_token || null;
      setToken(t);
      if (t) {
        try {
          const { data: userRow } = await supabase
            .from('users')
            .select('role')
            .eq('user_id', data.session.user.id)
            .single();
          setRole(userRow?.role || 'participant');
        } catch (e) {
          setRole('participant');
        }
      }
    })();
  }, []);

  async function validate(registration_id) {
    setError(null);
    setResult(null);
    if (!registration_id.trim()) {
      setError('Veuillez entrer un ID d\'inscription');
      return;
    }
    try {
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ registration_id: registration_id.trim() }),
      });
      const j = await res.json();
      if (!res.ok || !j.valid) throw new Error(j.error || 'Billet invalide');
      setResult(j.registration);
      setManual('');
    } catch (e) {
      setError(e.message || 'Erreur de validation');
    }
  }

  return (
    <section className="container mx-auto px-4 py-8 space-y-6">
      {role && !['organisateur', 'admin'].includes(role) ? (
        <div className="text-[var(--danger)] bg-[var(--surface)] p-4 rounded border border-[#111]">Accès réservé aux organisateurs ou admins.</div>
      ) : null}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Vérification de billets</h1>
        <p className="text-sm text-[var(--text-muted)]">Entrez un ID d'inscription pour valider un billet.</p>
      </div>

      <div className="bg-[var(--surface)] p-6 rounded border border-[#111] max-w-xl mx-auto">
        <h3 className="font-semibold mb-3">Saisir l'ID d'inscription</h3>
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Ex: uuid-timestamp"
          className="w-full px-3 py-2 rounded border border-[#222] bg-[#0f0f0f] text-[var(--text-primary)] mb-3"
        />
        <button onClick={() => validate(manual)} className="px-4 py-2 bg-[var(--brand)] text-black rounded w-full font-medium hover:opacity-95">
          Valider
        </button>
      </div>

      {error && <div className="text-[var(--danger)] bg-[var(--surface)] p-4 rounded border border-[#111]">{error}</div>}
      {result && (
        <div className="bg-[var(--surface)] p-6 rounded border border-[#111] max-w-xl mx-auto">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3">✓ Billet valide</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-[var(--text-muted)]">Nom:</span> <span className="font-medium">{result.name}</span></div>
            <div><span className="text-[var(--text-muted)]">Email:</span> <span className="font-medium">{result.email}</span></div>
            <div><span className="text-[var(--text-muted)]">ID:</span> <span className="font-medium">{result.registration_id}</span></div>
            <div><span className="text-[var(--text-muted)]">Places:</span> <span className="font-medium">{result.count}</span></div>
            <div><span className="text-[var(--text-muted)]">Date:</span> <span className="font-medium">{result.created_at && new Date(result.created_at).toLocaleString('fr-FR')}</span></div>
          </div>
        </div>
      )}
    </section>
  );
}
