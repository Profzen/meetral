'use client';

export default function LoadingSpinner({ size = 48, label = 'Chargement...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className="rounded-full border-4 border-t-4 border-[var(--brand)] border-t-transparent animate-spin"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
    </div>
  );
}
