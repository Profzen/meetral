// src/components/home/Hero.jsx
'use client';
import Link from 'next/link';

export default function Hero() {
  return (
    <header className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white">
      <div className="container mx-auto px-4 py-16 flex flex-col lg:flex-row items-center gap-8">
        <div className="flex-1">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">Meetral — Trouve ou organise des événements près de toi</h1>
          <p className="mt-4 text-lg max-w-xl text-sky-100">
            Recherche, rejoins et crée des événements — et repère facilement ceux qui offrent une collation grâce au label <span className="font-semibold">FreeFood</span>.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/events" className="inline-block bg-white/90 text-sky-700 px-5 py-3 rounded-md font-semibold shadow hover:scale-[1.01]">
              Voir les événements
            </Link>
            <Link href="/events/create" className="inline-block border border-white/40 text-white px-5 py-3 rounded-md hover:bg-white/10">
              Créer un événement
            </Link>
          </div>

          <div className="mt-6 text-sm text-sky-100">
            <span className="inline-flex items-center gap-2">
              <span className="bg-white/20 px-2 py-1 rounded text-xs">Badge</span>
              <strong className="ml-2">FreeFood</strong> — évènement avec collation offerte.
            </span>
          </div>
        </div>

        <div className="w-full lg:w-1/3">
          <div className="bg-white/10 p-4 rounded-lg shadow-inner">
            <img src="/ev.jpg" alt="Meetral events" className="w-full h-48 object-cover rounded" />
            <div className="mt-3 text-sm text-sky-100">
              Découvre les événements populaires et rejoins la communauté.
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
