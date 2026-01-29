'use client';

import { useState } from 'react';

export default function FilterBar({ onFiltersChange }) {
  const [filters, setFilters] = useState({
    search: '',
    date: '',
    location: '',
    category: '',
    priceRange: 'all',
    freefood: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFilters = {
      ...filters,
      [name]: type === 'checkbox' ? checked : value,
    };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      date: '',
      location: '',
      category: '',
      priceRange: 'all',
      freefood: false,
    };
    setFilters(resetFilters);
    onFiltersChange?.(resetFilters);
  };

  return (
    <div className="bg-[var(--surface)] p-6 rounded-lg shadow-md mb-6 border border-[#111]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Recherche */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
            Rechercher
          </label>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Titre, lieu..."
            className="w-full px-3 py-2 border border-[#222] rounded-md bg-[#0f0f0f] text-[var(--text-primary)] shadow-sm focus:outline-none focus:ring-[var(--brand)] focus:border-[var(--brand-dark)]"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#222] rounded-md bg-[#0f0f0f] text-[var(--text-primary)] shadow-sm focus:outline-none focus:ring-[var(--brand)] focus:border-[var(--brand-dark)]"
          />
        </div>

        {/* Lieu */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
            Lieu
          </label>
          <input
            type="text"
            name="location"
            value={filters.location}
            onChange={handleChange}
            placeholder="Ville..."
            className="w-full px-3 py-2 border border-[#222] rounded-md bg-[#0f0f0f] text-[var(--text-primary)] shadow-sm focus:outline-none focus:ring-[var(--brand)] focus:border-[var(--brand-dark)]"
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
            Catégorie
          </label>
          <select
            name="category"
            value={filters.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#222] rounded-md bg-[#0f0f0f] text-[var(--text-primary)] shadow-sm focus:outline-none focus:ring-[var(--brand)] focus:border-[var(--brand-dark)]"
          >
            <option value="">Toutes</option>
            <option value="tech">Tech</option>
            <option value="business">Business</option>
            <option value="culture">Culture</option>
            <option value="formation">Formation</option>
            <option value="networking">Networking</option>
          </select>
        </div>

        {/* Prix */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
            Prix
          </label>
          <select
            name="priceRange"
            value={filters.priceRange}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#222] rounded-md bg-[#0f0f0f] text-[var(--text-primary)] shadow-sm focus:outline-none focus:ring-[var(--brand)] focus:border-[var(--brand-dark)]"
          >
            <option value="all">Tous les prix</option>
            <option value="free">Gratuit</option>
            <option value="0-50">0 - 50 000 XOF</option>
            <option value="50-200">50 000 - 200 000 XOF</option>
            <option value="200+">200 000 XOF+</option>
          </select>
        </div>

        {/* FreeFood */}
          <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="freefood"
              checked={filters.freefood}
              onChange={handleChange}
              className="h-4 w-4 text-[var(--brand)] rounded"
            />
            <span className="text-sm font-medium text-[var(--text-muted)]">🍕 FreeFood</span>
          </label>
        </div>
      </div>

      {/* Boutons d'action */}
        <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] bg-[var(--surface)] border border-[#222] rounded-md hover:bg-[#0f0f0f]"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
}
