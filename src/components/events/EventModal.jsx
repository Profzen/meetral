'use client';
import { useState } from 'react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import formatDate from '@/utils/formatDate';

export default function EventModal({ event, onClose, onRegistrationSuccess }) {
  const [joining, setJoining] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', count: 1 });
  if (!event) return null;

  // Validate and fix image URL (only cover_url exists now)
  const getValidImageUrl = () => {
    if (!event.cover_url) {
      return 'https://via.placeholder.com/600x400?text=Event';
    }
    
    // Check if URL is valid
    if (event.cover_url.startsWith('http://') || event.cover_url.startsWith('https://') || event.cover_url.startsWith('/')) {
      return event.cover_url;
    }
    
    return 'https://via.placeholder.com/600x400?text=Event';
  };

  const imageUrl = getValidImageUrl();

  const placesRemaining = (event.capacity || 0) - (event.registered || 0);
  const placesFilled = event.capacity > 0 ? Math.round(((event.registered || 0) / event.capacity) * 100) : 0;
  const isFull = placesRemaining <= 0;
  const isPaid = !event.is_free && event.price > 0;

  async function generatePDF(registration) {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFontSize(20);
      doc.text('Ticket Meetral', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Événement: ${registration.event.title}`, 20, 40);
      doc.text(`Date: ${new Date(registration.event.date).toLocaleString('fr-FR')}`, 20, 50);
      doc.text(`Lieu: ${registration.event.place}`, 20, 60);
      doc.setFontSize(11);
      doc.text(`Nom: ${registration.name}`, 20, 75);
      doc.text(`Email: ${registration.email}`, 20, 85);
      doc.text(`Places: ${registration.count}`, 20, 95);
      doc.text(`ID d'inscription: ${registration.id}`, 20, 105);
      const qrDataUrl = await QRCode.toDataURL(registration.qrText, { margin: 1, width: 256 });
      doc.addImage(qrDataUrl, 'PNG', 20, 120, 50, 50);
      doc.save(`ticket-${registration.id}.pdf`);
    } catch (e) {
      console.error('PDF generation error', e);
      alert('Erreur lors de la génération du PDF');
    }
  }

  async function onJoin() {
    setJoining(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          name: form.name,
          email: form.email,
          count: Number(form.count) || 1,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Inscription impossible');
      }
      const j = await res.json();
      if (j.success && j.registration) {
        await generatePDF(j.registration);
        alert('Inscription confirmée. Votre ticket PDF a été généré et téléchargé.');
        
        // Notify parent to refresh data
        if (onRegistrationSuccess) {
          onRegistrationSuccess();
        }
        
        onClose();
      } else {
        throw new Error('Réponse serveur invalide');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'inscription: ' + (err.message || ''));
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[var(--surface)] w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden max-h-[95vh] border border-[#111] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#111] flex items-center justify-between gap-4 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{event.title}</h2>
            <div className="text-sm text-[var(--text-muted)] mt-1">{formatDate(event.date)} • {event.place}</div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition text-2xl">✕</button>
        </div>

        {/* 2-Column Layout */}
        <div className="flex-1 overflow-auto flex flex-col lg:flex-row gap-6 p-6">
          
          {/* Left Column - Image & Details */}
          <div className="flex-1 lg:flex-[1.2] flex flex-col gap-6">
            {/* Large Image */}
            <div className="w-full rounded-lg overflow-hidden bg-[#0b0b0b] flex-shrink-0">
              <img 
                src={imageUrl} 
                alt={event.title} 
                className="w-full h-64 lg:h-80 object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x400?text=Event';
                }}
              />
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-2">À propos</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                {event.description || 'Pas de description fournie.'}
              </p>
            </div>

            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              {event.freefood && (
                <span className="inline-block px-3 py-1 bg-[var(--success)] text-black rounded-full text-sm font-semibold">
                  🍕 FreeFood
                </span>
              )}
              {event.is_free && (
                <span className="inline-block px-3 py-1 bg-[var(--success)] text-black rounded-full text-sm font-semibold">
                  Gratuit
                </span>
              )}
              {isPaid && event.price && (
                <span className="inline-block px-3 py-1 bg-[var(--brand)] text-black rounded-full text-sm font-semibold">
                  {event.price}€
                </span>
              )}
            </div>
          </div>

          {/* Right Column - Info & Registration */}
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Event Details Card */}
            <div className="bg-[#0f0f0f] p-4 rounded-lg border border-[#222]">
              <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-4">Détails</h3>
              <div className="space-y-3 text-sm">
                {/* Date */}
                <div className="flex items-center gap-3">
                  <span className="text-lg">📅</span>
                  <div>
                    <div className="text-[var(--text-muted)]">Date</div>
                    <div className="text-[var(--text-primary)] font-medium">
                      {new Date(event.date).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-3">
                  <span className="text-lg">📍</span>
                  <div>
                    <div className="text-[var(--text-muted)]">Lieu</div>
                    <div className="text-[var(--text-primary)] font-medium">{event.place}</div>
                  </div>
                </div>

                {/* Capacity */}
                <div className="flex items-center gap-3">
                  <span className="text-lg">👥</span>
                  <div className="flex-1">
                    <div className="text-[var(--text-muted)] flex justify-between mb-1">
                      <span>Capacité</span>
                      <span className="text-[var(--text-primary)]">{event.registered}/{event.capacity}</span>
                    </div>
                    <div className="w-full bg-[#1b1b1b] rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          placesFilled < 25 ? 'bg-[var(--success)]' : 
                          placesFilled < 50 ? 'bg-green-500' : 
                          placesFilled < 75 ? 'bg-yellow-500' : 
                          'bg-[var(--danger)]'
                        }`}
                        style={{ width: `${placesFilled}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Places Remaining */}
                {!isFull ? (
                  <div className="text-sm font-semibold text-[var(--success)]">
                    ✓ {placesRemaining} place{placesRemaining > 1 ? 's' : ''} restante{placesRemaining > 1 ? 's' : ''}
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-[var(--danger)]">
                    ✕ Cet événement est complet
                  </div>
                )}
              </div>
            </div>

            {/* Registration Form */}
            {!isFull && (
              <div className="bg-[#0f0f0f] p-4 rounded-lg border border-[#222]">
                <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-4">S'inscrire</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-[var(--text-muted)] mb-1">Nom</label>
                    <input 
                      value={form.name} 
                      onChange={(e)=>setForm(s=>({ ...s, name: e.target.value }))} 
                      placeholder="Votre nom complet"
                      className="w-full px-3 py-2 rounded border border-[#222] bg-[#0a0a0a] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none transition" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-muted)] mb-1">Email</label>
                    <input 
                      type="email" 
                      value={form.email} 
                      onChange={(e)=>setForm(s=>({ ...s, email: e.target.value }))} 
                      placeholder="votre@email.com"
                      className="w-full px-3 py-2 rounded border border-[#222] bg-[#0a0a0a] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-muted)] mb-1">Places</label>
                    <input 
                      type="number" 
                      min="1" 
                      max={Math.max(1, placesRemaining)} 
                      value={form.count} 
                      onChange={(e)=>setForm(s=>({ ...s, count: e.target.value }))} 
                      className="w-full px-3 py-2 rounded border border-[#222] bg-[#0a0a0a] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none transition"
                    />
                  </div>
                  <button 
                    onClick={onJoin} 
                    disabled={joining} 
                    className="w-full px-4 py-3 bg-[var(--brand)] text-black rounded font-semibold hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {joining ? 'Inscription en cours...' : 'S\'inscrire'}
                  </button>
                </div>
              </div>
            )}

            {/* Close Button on Mobile */}
            <button 
              onClick={onClose} 
              className="lg:hidden w-full px-4 py-2 border rounded border-[#222] text-[var(--text-muted)] hover:bg-[#0f0f0f] transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
