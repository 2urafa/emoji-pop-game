export function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-700 border-t-fuchsia-500 shadow-[0_0_25px_rgba(217,70,239,0.6)]" />
      <p className="text-lg font-semibold text-fuchsia-300 neon-text">{label}</p>
    </div>
  );
}
