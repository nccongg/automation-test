/**
 * Skeleton — placeholder shapes shown while content loads.
 *
 * Use the primitive <Skeleton /> for arbitrary blocks, or the prebuilt
 * <SkeletonCard /> / <SkeletonCardGrid /> for the common project/KPI card lists.
 * Matches the app's rounded, muted aesthetic and respects reduced-motion.
 */

import { cn } from "@/lib/utils";

export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/70 motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

/** A single card-shaped placeholder mirroring ProjectCard's proportions. */
export function SkeletonCard() {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/** A responsive grid of skeleton cards — drop-in for a loading card list. */
export function SkeletonCardGrid({ count = 6 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** A page-title placeholder (title + subtitle) matching PageHeader proportions. */
export function SkeletonHeader() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

/** Stacked rows — drop-in for a loading table or list view. */
export function SkeletonList({ rows = 6 }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Header + content panels — drop-in for a loading detail page. */
export function SkeletonDetail() {
  return (
    <div className="space-y-8">
      <SkeletonHeader />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/** Full-page skeleton: header + list. Convenience for simple list pages. */
export function SkeletonListPage({ rows = 6 }) {
  return (
    <div className="space-y-8">
      <SkeletonHeader />
      <SkeletonList rows={rows} />
    </div>
  );
}
