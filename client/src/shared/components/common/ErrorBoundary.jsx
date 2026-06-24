/**
 * ErrorBoundary — app-level safety net.
 *
 * Catches any render/runtime error thrown by a descendant component and shows a
 * branded recovery screen instead of a blank white page. Wrap the whole app
 * (or any risky subtree) with it.
 *
 * Note: error boundaries must be class components — there is no hook equivalent.
 */

import { Component } from "react";
import { Activity, RotateCw, Home } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Surface to the console for local debugging; a real logger/Sentry hook
    // can be plugged in here later without touching call sites.
    console.error("[ErrorBoundary] Uncaught error:", error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--brand-page-bg)] px-6 text-center">
        <div className="mb-6 flex items-center gap-2 text-slate-700">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow)]">
            <Activity className="size-5" />
          </div>
          <span className="text-sm font-semibold tracking-tight">AutoTesting</span>
        </div>

        <p className="bg-gradient-to-b from-[var(--brand-primary)] to-purple-400 bg-clip-text text-6xl font-bold tracking-tight text-transparent sm:text-7xl">
          Oops
        </p>
        <h1 className="mt-4 text-xl font-semibold text-slate-800">
          Something went wrong
        </h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          An unexpected error interrupted this page. Reloading usually fixes it —
          if it keeps happening, head back to the dashboard.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--brand-primary-shadow)] transition-opacity hover:opacity-90"
          >
            <RotateCw className="size-4" />
            Reload page
          </button>
          <button
            type="button"
            onClick={this.handleHome}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Home className="size-4" />
            Dashboard
          </button>
        </div>

        {import.meta.env.DEV && this.state.error && (
          <pre className="mt-8 max-w-xl overflow-auto rounded-lg bg-slate-900/90 px-4 py-3 text-left text-xs text-slate-200">
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        )}
      </div>
    );
  }
}
