import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-[var(--surface)]/95 backdrop-blur-sm rounded-lg p-6 shadow-lg flex flex-col items-center border border-[#111]">
        <LoadingSpinner size={60} label="Chargement…" />
      </div>
    </div>
  );
}
