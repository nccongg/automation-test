/**
 * RouteFallback — Suspense fallback shown while a lazily-loaded route chunk is
 * being fetched. Fills the available area so the surrounding app shell (sidebar,
 * header) stays put during in-app navigation.
 */

import LoadingSpinner from "./LoadingSpinner";

export default function RouteFallback({ label = "Loading…" }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingSpinner size="lg" label={label} color="var(--brand-primary)" />
    </div>
  );
}
