/**
 * ErrorPopup — reusable error modal popup
 *
 * Usage:
 *   <ErrorPopup
 *     open={hasError}
 *     onClose={() => setHasError(false)}
 *     onRetry={fetchData}   // optional
 *   />
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X, RotateCcw } from "lucide-react";

export default function ErrorPopup({ open, onClose, onRetry }) {
  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes _ep-backdrop { from { opacity:0 } to { opacity:1 } }
        @keyframes _ep-card { from { opacity:0; transform:translateY(14px) scale(.96) } to { opacity:1; transform:none } }
        @keyframes _ep-shake {
          0%,100% { transform: rotate(0deg) }
          20%      { transform: rotate(-12deg) }
          40%      { transform: rotate(10deg) }
          60%      { transform: rotate(-8deg) }
          80%      { transform: rotate(6deg) }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
        style={{ animation: "_ep-backdrop .15s ease both" }}
        onClick={onClose}
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Error"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-[360px] rounded-2xl bg-white shadow-[0_20px_60px_-10px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.06]"
          style={{ animation: "_ep-card .22s cubic-bezier(.16,1,.3,1) both" }}
        >
          {/* Red top stripe */}
          <div className="h-[3px] rounded-t-2xl bg-gradient-to-r from-red-400 via-red-500 to-orange-400" />

          <div className="p-5">
            {/* Header row */}
            <div className="flex items-start gap-3 mb-4">
              {/* Icon with shake animation */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50"
                style={{ animation: "_ep-shake .45s ease .1s both" }}
              >
                <AlertTriangle className="size-[18px] text-red-500" strokeWidth={2.2} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-gray-900 leading-snug">
                  Something went wrong
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-gray-500">
                  Please try again or{" "}
                  <a
                    href="mailto:support@autotesting.com"
                    className="font-medium text-red-500 hover:underline underline-offset-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    send us an email
                  </a>
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 mt-0.5 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={() => { onRetry(); onClose(); }}
                  className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-medium text-gray-600 transition-colors hover:bg-gray-100"
                >
                  <RotateCcw className="size-3" />
                  Try again
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-red-500 px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-red-600 active:bg-red-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
