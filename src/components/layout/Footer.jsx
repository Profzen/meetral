// src/components/layout/Footer.jsx
'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[var(--surface)] border-t border-[#121212] mt-12">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center">
        <div className="text-sm text-[var(--text-muted)]">© {new Date().getFullYear()} Meetral — Tous droits réservés</div>
        <div className="flex gap-4 mt-3 md:mt-0">
          <Link href="/about" className="text-sm text-[var(--text-muted)] hover:underline">À propos</Link>
          <Link href="/terms" className="text-sm text-[var(--text-muted)] hover:underline">CGU</Link>
          <Link href="/privacy" className="text-sm text-[var(--text-muted)] hover:underline">Confidentialité</Link>
        </div>
      </div>
    </footer>
  );
}
