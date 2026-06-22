import authBanner from "@/assets/auth-banner.jpg";
import useDocumentTitle from "@/hooks/useDocumentTitle";

/**
 * AuthLayout – full-screen split layout for all auth pages.
 *
 * Props:
 *   title    {string}           – heading shown in the form panel
 *   subtitle {string?}          – optional sub-heading below title
 *   children {React.ReactNode}  – form content
 *   imageSrc {string?}          – illustration for the left panel (falls back to authBanner)
 *   imageAlt {string?}          – accessible alt text for the illustration
 */
export default function AuthLayout({
  title,
  subtitle,
  children,
  imageSrc = authBanner,
  imageAlt = "Auth illustration",
}) {
  useDocumentTitle(title);

  return (
    <div className="min-h-screen bg-[var(--brand-page-bg)]">
      <div className="grid min-h-screen lg:grid-cols-[1fr_0.98fr]">
        {/* ── Left panel: illustration ──────────────────────────────── */}
        <div className="hidden lg:block">
          <img
            src={imageSrc}
            alt={imageAlt}
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>

        {/* ── Right panel: form ─────────────────────────────────────── */}
        <div className="flex min-h-screen flex-col bg-white px-8 py-12 sm:px-12 lg:px-16">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-[430px]">
              {/* Page heading */}
              <div className="mb-8 text-center">
                <h1 className="text-[42px] font-bold leading-tight tracking-tight text-slate-800">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
                )}
              </div>

              {children}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-8 flex flex-col items-center gap-1 text-center text-xs text-slate-400 sm:flex-row sm:justify-between">
            <span>© {new Date().getFullYear()} AutoTesting. All rights reserved.</span>
            <span className="flex items-center gap-3">
              <a href="mailto:support@autotesting.com" className="hover:text-slate-600">
                Support
              </a>
              <span className="text-slate-300">·</span>
              <a href="/login" className="hover:text-slate-600">
                Sign in
              </a>
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}