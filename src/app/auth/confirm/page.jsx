// src/app/auth/confirm/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Confirmation en cours...');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    // Récupérer les paramètres depuis l'URL (hash ou query)
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const queryParams = new URLSearchParams(window.location.search);
    const accessToken = hashParams.get('access_token') || queryParams.get('access_token') || queryParams.get('token');
    const type = hashParams.get('type') || queryParams.get('type');

    if (accessToken && type === 'signup') {
      setSuccess(true);
      setMessage('✅ Ton email a été confirmé avec succès !');

      // Redirection automatique après 3 secondes
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } else {
      setSuccess(false);
      setMessage("❌ Le lien de confirmation n'est pas valide ou a expiré.");
    }
  }, [router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-[var(--surface)] rounded-lg shadow p-6 border border-[#111]">
        <h2 className="text-2xl font-bold mb-4">Confirmation d'email</h2>
        
        <div className={`mb-4 text-sm p-4 rounded ${success ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
          {message}
          {success && (
            <div className="mt-3 text-xs text-[var(--text-muted)]">
              Tu vas être redirigé vers la page de connexion dans quelques secondes…
            </div>
          )}
        </div>

        {!success && (
          <div className="mt-4">
            <p className="text-sm text-[var(--text-muted)] mb-3">
              Si tu as des problèmes, tu peux demander un nouveau lien de confirmation lors de la connexion.
            </p>
            <Link 
              href="/auth/login" 
              className="inline-block bg-[var(--brand)] text-black px-4 py-2 rounded font-medium hover:opacity-95 transition"
            >
              Aller à la connexion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
