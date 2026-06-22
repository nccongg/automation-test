/**
 * NotFoundPage — branded 404 shown for any unmatched route.
 */

import { Link } from "react-router-dom";
import { Activity, ArrowLeft } from "lucide-react";
import { ROUTES } from "@/config/routes";
import useDocumentTitle from "@/hooks/useDocumentTitle";

export default function NotFoundPage() {
  useDocumentTitle("Page not found");

  const isAuthed = !!localStorage.getItem("token");
  const homeTo = isAuthed ? ROUTES.DASHBOARD : ROUTES.LOGIN;
  const homeLabel = isAuthed ? "Back to dashboard" : "Back to sign in";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--brand-page-bg)] px-6 text-center">
      <div className="mb-6 flex items-center gap-2 text-slate-700">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow)]">
          <Activity className="size-5" />
        </div>
        <span className="text-sm font-semibold tracking-tight">AutoTesting</span>
      </div>

      <p className="bg-gradient-to-b from-[var(--brand-primary)] to-purple-400 bg-clip-text text-7xl font-bold tracking-tight text-transparent sm:text-8xl">
        404
      </p>
      <h1 className="mt-4 text-xl font-semibold text-slate-800">
        This page doesn't exist
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        The page you're looking for may have been moved, removed, or the link is
        incorrect.
      </p>

      <Link
        to={homeTo}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--brand-primary-shadow)] transition-opacity hover:opacity-90"
      >
        <ArrowLeft className="size-4" />
        {homeLabel}
      </Link>
    </div>
  );
}
