/**
 * ErrorState — classifies a request error and renders the appropriate UI.
 *
 * Routing by HTTP status:
 *   401  → redirect to login (token missing / expired)
 *   403  → full-page "no access" state
 *   404  → full-page "not found" state
 *   else → ErrorPopup modal (real system / network error, status 0 or 5xx)
 *
 * Usage:
 *   const { data, loading, error } = useProject();
 *   if (error) return <ErrorState error={error} onRetry={refetch} />;
 *
 * `error` may be an Error object carrying `.status` (set by api/client.js)
 * or a plain string (treated as a generic system error).
 */

import { Navigate } from "react-router-dom";
import { ShieldOff, FileQuestion, ArrowLeft } from "lucide-react";
import { ROUTES } from "@/config/routes";
import ErrorPopup from "./ErrorPopup";

function FullPageState({ icon, title, message, onBack }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-gray-900">{title}</p>
        <p className="max-w-sm text-sm text-gray-500">{message}</p>
      </div>
      <button
        type="button"
        onClick={onBack ?? (() => window.history.back())}
        className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
      >
        <ArrowLeft className="size-3.5" />
        Go back
      </button>
    </div>
  );
}

export default function ErrorState({ error, onRetry, onBack }) {
  const status = typeof error === "object" && error ? error.status : undefined;

  if (status === 401) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (status === 403) {
    return (
      <FullPageState
        icon={<ShieldOff className="size-7" strokeWidth={1.75} />}
        title="You don't have access"
        message="This resource belongs to another account or you haven't been granted access to it."
        onBack={onBack}
      />
    );
  }

  if (status === 404) {
    return (
      <FullPageState
        icon={<FileQuestion className="size-7" strokeWidth={1.75} />}
        title="Not found"
        message="The page you're looking for doesn't exist or may have been removed."
        onBack={onBack}
      />
    );
  }

  // Real system / network error (status 0, 5xx, or unknown) → contact-us popup.
  return (
    <ErrorPopup
      open
      onClose={onRetry ?? (() => window.history.back())}
      onRetry={onRetry}
    />
  );
}
