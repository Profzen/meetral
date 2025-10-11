// src/components/layout/Header.jsx
'use client';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-md text-white flex items-center justify-center font-bold">M</div>
          <div>
            <div className="font-semibold">Meetral</div>
            <div className="text-xs text-slate-500">Events & rencontres</div>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <Link href="/events" className="text-sm hover:underline">Événements</Link>
          <Link href="/dashboard" className="text-sm hover:underline">Mon dashboard</Link>
          <Link href="/auth/login" className="text-sm px-3 py-1 rounded-md border">Connexion</Link>
        </nav>
      </div>
    </header>
  );
}
