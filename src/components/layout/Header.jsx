// src/components/layout/Header.jsx
'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from '@/lib/i18n';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [session, setSession] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data?.session ?? null);
    })();

    const { subscription } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <header className="bg-[var(--surface)] border-b border-[#121212] sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 bg-[var(--brand)] rounded-md text-black flex items-center justify-center font-bold">M</div>
          <div className="hidden sm:block">
            <div className="font-semibold text-[var(--text-primary)]">Meetral</div>
            <div className="text-xs text-[var(--text-muted)]">Events & rencontres</div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/events/listing" className="text-sm text-[var(--text-primary)] hover:text-[var(--brand)] font-medium transition">
            {t('events')}
          </Link>
          <Link href="/dashboard" className="text-sm text-[var(--text-primary)] hover:text-[var(--brand)] font-medium transition">
            {t('dashboard')}
          </Link>
          {!session ? (
            <Link href="/auth/login" className="text-sm px-4 py-2 rounded-md bg-[var(--brand)] text-black font-medium transition hover:opacity-95">
              {t('login')}
            </Link>
          ) : (
            <Link href="/profile" className="text-sm px-2 py-2 rounded-full bg-[var(--surface)] border border-[#222] flex items-center gap-2 hover:bg-[#0f0f0f] transition">
              <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-black flex items-center justify-center font-semibold">{(session?.user?.email || '').charAt(0)?.toUpperCase()}</div>
              <span className="hidden sm:inline text-[var(--text-primary)]">{t('profile')}</span>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-md hover:bg-[#0f0f0f] transition"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-[var(--surface)] border-t border-[#121212] px-4 py-4 space-y-3">
          <Link 
            href="/events/listing" 
            className="block text-sm text-[var(--text-primary)] hover:text-[var(--brand)] font-medium py-2 px-3 rounded hover:bg-[#0f0f0f] transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            Événements
          </Link>
          <Link 
            href="/dashboard" 
            className="block text-sm text-[var(--text-primary)] hover:text-[var(--brand)] font-medium py-2 px-3 rounded hover:bg-[#0f0f0f] transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            Mon dashboard
          </Link>
          <Link 
            href="/auth/login" 
            className="block w-full text-sm px-4 py-2 rounded-md bg-[var(--brand)] text-black font-medium text-center transition hover:opacity-95"
            onClick={() => setMobileMenuOpen(false)}
          >
            Connexion
          </Link>
        </nav>
      )}
    </header>
  );
}
