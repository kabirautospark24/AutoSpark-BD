export function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-label="Loading page">
      <div className="w-8 h-8 border-2 border-[var(--brand-red,#D6001C)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
