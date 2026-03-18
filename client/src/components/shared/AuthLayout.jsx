import authBanner from "@/assets/auth-banner.svg";

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
  return (
    <div className="min-h-screen bg-[var(--brand-page-bg)]">
      <div className="grid min-h-screen lg:grid-cols-[1fr_0.98fr]">
        {/* ── Left panel: illustration ──────────────────────────────── */}
        <div className="hidden lg:block">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="h-full w-full object-cover"
          />
        </div>

        {/* ── Right panel: form ─────────────────────────────────────── */}
        <div className="flex min-h-screen items-center justify-center bg-white px-8 py-12 sm:px-12 lg:px-16">
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
      </div>
    </div>
  );
}