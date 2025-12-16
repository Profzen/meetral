// src/components/home/Hero.jsx
'use client';
import Link from 'next/link';

export default function Hero() {
  return (
    <header className="bg-[linear-gradient(90deg,var(--surface),var(--bg))] text-white">
      <div className="container mx-auto px-4 py-16 flex flex-col lg:flex-row items-center gap-8">
        <div className="flex-1">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">Meetral — Trouve ou organise des événements près de toi</h1>
          <p className="mt-4 text-lg max-w-xl text-[var(--text-muted)]">
            Recherche, rejoins et crée des événements — et repère facilement ceux qui offrent une collation grâce au label <span className="font-semibold">FreeFood</span>.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/events" className="inline-block bg-[var(--brand)] text-black px-5 py-3 rounded-md font-semibold shadow hover:scale-[1.01]">
              Voir les événements
            </Link>
          </div>

            <div className="mt-6 text-sm text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-2">
              <span className="bg-[var(--brand)]/20 px-2 py-1 rounded text-xs text-[var(--brand)]">Badge</span>
              <strong className="ml-2">FreeFood</strong> — évènement avec collation offerte.
            </span>
          </div>
        </div>

          <div className="w-full lg:w-1/3">
          <div className="bg-[var(--surface)] p-4 rounded-lg shadow-inner border border-[#111]">
            <img src="/ev.jpg" alt="Meetral events" className="w-full h-48 object-cover rounded" />
            <div className="mt-3 text-sm text-[var(--text-muted)]">
              Découvre les événements populaires et rejoins la communauté.
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
