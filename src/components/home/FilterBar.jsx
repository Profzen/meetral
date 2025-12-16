// src/components/home/FilterBar.jsx
'use client';

export default function FilterBar({ q, onQChange, filter, onFilterChange, resultsCount }) {
  return (
    <div className="bg-[var(--surface)] p-4 rounded shadow flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-[#111]">
      <div className="flex-1 flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Rechercher un événement, lieu ou mot-clé..."
          className="flex-1 px-3 py-2 border border-[#222] rounded bg-[#0f0f0f] text-[var(--text-primary)]"
        />
        <div className="hidden sm:flex gap-2 items-center">
          <button onClick={() => onFilterChange('all')} className={`px-3 py-1 rounded ${filter==='all' ? 'bg-[var(--brand)] text-black' : 'border border-[#222] text-[var(--text-muted)]'}`}>Tous</button>
          <button onClick={() => onFilterChange('freefood')} className={`px-3 py-1 rounded ${filter==='freefood' ? 'bg-[var(--success)] text-black' : 'border border-[#222] text-[var(--text-muted)]'}`}>FreeFood</button>
          <button onClick={() => onFilterChange('free')} className={`px-3 py-1 rounded ${filter==='free' ? 'bg-[var(--brand)] text-black' : 'border border-[#222] text-[var(--text-muted)]'}`}>Gratuit</button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-[var(--text-muted)]">Résultats : <strong className="text-[var(--text-primary)]">{resultsCount}</strong></div>
        <div>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-3 py-1 border border-[#222] rounded text-sm text-[var(--text-muted)]">Haut</button>
        </div>
      </div>
    </div>
  );
}
