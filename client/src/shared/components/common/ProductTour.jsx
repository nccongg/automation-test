import { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { authApi } from "@/features/auth/api/authApi";
import { ChevronRight, ChevronLeft, MousePointerClick, X, Wand2 } from "lucide-react";

const ONBOARDING_DISMISSED_KEY = "onboarding_completed";
const PADDING = 10;
const TOOLTIP_W = 272;
// Desktop sidebar is always w-64 (256px) while tour is active
const SIDEBAR_W = 256;
const TOUR_TRANSITION =
  "left 220ms cubic-bezier(0.22, 1, 0.36, 1), top 220ms cubic-bezier(0.22, 1, 0.36, 1), width 220ms cubic-bezier(0.22, 1, 0.36, 1), height 220ms cubic-bezier(0.22, 1, 0.36, 1)";

const STEPS = [
  {
    target: null,
    title: "Welcome to AutoTesting! 👋",
    description:
      "Your AI-powered browser automation platform. Click through a quick tour to see the main features.",
    cta: null,
  },
  {
    target: '[data-tour="nav-dashboard"]',
    title: "Dashboard",
    description:
      "See your test metrics, pass rates, and recent activity at a glance. Great for spotting regressions early.",
    cta: "Click Dashboard to continue",
    placement: "right",
  },
  {
    target: '[data-tour="nav-projects"]',
    title: "Projects",
    description:
      "All your test automation work lives inside projects. Group tests by application, team, or environment.",
    cta: "Click Projects to continue",
    placement: "right",
  },
  {
    target: '[data-tour="btn-new-project"]',
    title: "Create a Project",
    description:
      "Click New Project to open the setup dialog. You'll give your project a name, base URL, and optional auth config.",
    cta: "Click New Project to continue",
    placement: "bottom",
  },
  {
    target: "#project-name",
    title: "Project Name",
    description:
      "Đặt tên rõ ràng cho project. Bấm vào ô để tự điền tên mẫu OrangeHRM.",
    cta: "Click to auto-fill",
    placement: "right",
    dialogMode: true,
    defaultValue: "OrangeHRM Automation",
  },
  {
    target: "#project-description",
    title: "Project Description",
    description:
      "Mô tả ngắn về project. AI dùng thông tin này để tạo test case phù hợp hơn. Bấm vào ô để tự điền.",
    cta: "Click to auto-fill",
    placement: "right",
    dialogMode: true,
    defaultValue: "End-to-end automated tests for OrangeHRM — an open-source HR management demo widely used for QA practice.",
  },
  {
    target: "#project-base-url",
    title: "Base URL",
    description:
      "URL gốc của trang cần test. Bấm vào ô để tự điền URL demo OrangeHRM.",
    cta: "Click to auto-fill",
    placement: "right",
    dialogMode: true,
    defaultValue: "https://opensource-demo.orangehrmlive.com",
  },
  {
    target: "#auth-type",
    title: "Site Authentication",
    description:
      "Nếu website yêu cầu đăng nhập, chọn phương thức ở đây. Agent sẽ tự đăng nhập trước mỗi lần chạy test. Bấm vào để tiếp tục.",
    cta: "Click to continue",
    placement: "right",
    dialogMode: true,
  },
  {
    target: '[data-tour="dialog-create-btn"]',
    title: "Create the Project",
    description:
      "All set — click Create Project to save and get started, or click Next to skip for now.",
    cta: "Click Create Project when ready",
    dialogMode: true,
    noClickAdvance: true,
  },
  {
    target: '[data-tour="nav-settings"]',
    title: "Settings",
    description:
      "Configure your account, workspace preferences, and integrations here.",
    cta: "Click Settings to continue",
    placement: "right",
  },
  {
    target: '[data-tour="user-profile"]',
    title: "You're all set! 🎉",
    description:
      "Head to Projects and create your first project. Describe a test goal in plain English and the AI does the rest.",
    cta: null,
    placement: "right",
  },
];

function fillFieldIfEmpty(selector, value) {
  const el = document.querySelector(selector);
  if (el && (el.value || "").trim()) return; // already has content — don't overwrite
  // Call the React state setter directly (registered by the dialog)
  window.__tourFill?.[selector]?.(value);
}

function useTargetRect(selector, step) {
  const [rect, setRect] = useState(null);
  const rafRef = useRef(null);

  const readRect = useCallback(() => {
    if (!selector) { setRect(null); return; }
    const el = document.querySelector(selector);
    if (el) setRect(el.getBoundingClientRect());
    else setRect(null);
  }, [selector]);

  const refresh = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        readRect();
      });
    });
  }, [readRect]);

  useLayoutEffect(() => {
    refresh();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [refresh, step]);

  useEffect(() => {
    if (!selector) return;
    const el = document.querySelector(selector);
    el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }, [selector, step]);

  useEffect(() => {
    // Retry at increasing intervals — handles elements that appear after navigation + data load
    const delays = [60, 160, 320, 650, 1100];
    const timers = delays.map((d) => setTimeout(refresh, d));
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);

    const mutationObserver = new MutationObserver(refresh);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "data-state", "open"],
    });

    const el = selector ? document.querySelector(selector) : null;
    const resizeObserver = el && "ResizeObserver" in window
      ? new ResizeObserver(refresh)
      : null;
    if (resizeObserver) resizeObserver.observe(el);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
    };
  }, [refresh, selector, step]);

  return rect;
}

function getSpotlightBox(rect) {
  const left = Math.max(0, rect.left - PADDING);
  const top = Math.max(0, rect.top - PADDING);
  const right = Math.min(window.innerWidth, rect.right + PADDING);
  const bottom = Math.min(window.innerHeight, rect.bottom + PADDING);

  return {
    x: left,
    y: top,
    w: Math.max(0, right - left),
    h: Math.max(0, bottom - top),
  };
}

// 4 transparent divs that block clicks everywhere outside the spotlight
function Blockers({ rect }) {
  if (!rect) return null;
  const { x, y, w, h } = getSpotlightBox(rect);

  const base = { position: "fixed", zIndex: 1000, background: "transparent", pointerEvents: "auto" };

  return (
    <>
      <div style={{ ...base, top: 0, left: 0, right: 0, height: y }} />
      <div style={{ ...base, top: y + h, left: 0, right: 0, bottom: 0 }} />
      <div style={{ ...base, top: y, left: 0, width: x, height: h }} />
      <div style={{ ...base, top: y, left: x + w, right: 0, height: h }} />
    </>
  );
}

function Ring({ rect }) {
  if (!rect) return null;
  const { x, y, w, h } = getSpotlightBox(rect);
  const base = {
    position: "fixed",
    zIndex: 1001,
    left: x, top: y, width: w, height: h,
    borderRadius: 10,
    pointerEvents: "none",
    border: "2px solid rgba(255,255,255,0.95)",
    transition: TOUR_TRANSITION,
    willChange: "left, top, width, height",
  };
  return (
    <>
      {/* Solid ring with white border + blue glow pulse */}
      <div style={{ ...base, animation: "tour-ring-pulse 2s ease-in-out infinite" }} />
      {/* Ripple 1 */}
      <div style={{ ...base, animation: "tour-ripple 2s ease-out infinite" }} />
      {/* Ripple 2 — staggered */}
      <div style={{ ...base, animation: "tour-ripple 2s ease-out infinite 0.7s" }} />
    </>
  );
}

function Overlay({ rect }) {
  const base = {
    position: "fixed",
    zIndex: 999,
    background: "rgba(0,0,0,0.6)",
    pointerEvents: "none",
    transition: TOUR_TRANSITION,
    willChange: "left, top, width, height",
  };

  if (!rect) {
    return (
      <div
        style={{
          ...base,
          inset: 0,
        }}
      />
    );
  }

  const { x, y, w, h } = getSpotlightBox(rect);

  return (
    <>
      <div style={{ ...base, top: 0, left: 0, right: 0, height: y }} />
      <div style={{ ...base, top: y + h, left: 0, right: 0, bottom: 0 }} />
      <div style={{ ...base, top: y, left: 0, width: x, height: h }} />
      <div style={{ ...base, top: y, left: x + w, right: 0, height: h }} />
      <Ring rect={rect} />
    </>
  );
}

function Tooltip({ step, index, total, rect, onNext, onBack, onDismiss }) {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  // Next is disabled when: sidebar/button steps that require clicking, OR dialog-create-btn (must actually create)
  const nextDisabled = !isLast && (
    (!!step.target && !step.noClickAdvance && !step.defaultValue && !step.dialogMode) ||
    (!!step.noClickAdvance && !!step.dialogMode)
  );

  // Vertical center of the highlighted element (for connector line + tooltip alignment)
  const targetCenterY = rect ? rect.top + rect.height / 2 : null;

  let style = {
    position: "fixed",
    zIndex: 1002,
    width: TOOLTIP_W,
    maxWidth: "calc(100vw - 32px)",
  };

  const TOOLTIP_LEFT = SIDEBAR_W + 40;
  const TOOLTIP_H_ESTIMATE = 210;
  const placement = step.placement || "right";
  const dialogMode = !!step.dialogMode;
  // Connector only for sidebar "right" steps (not dialog, not bottom)
  const showConnector = rect && placement === "right" && !dialogMode;

  if (!rect) {
    style = { ...style, top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  } else if (placement === "bottom") {
    const left = Math.max(8, Math.min(rect.right - TOOLTIP_W, window.innerWidth - TOOLTIP_W - 8));
    style = { ...style, left, top: rect.bottom + 12 };
  } else if (placement === "top") {
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - TOOLTIP_W / 2, window.innerWidth - TOOLTIP_W - 8));
    style = { ...style, left, top: Math.max(8, rect.top - TOOLTIP_H_ESTIMATE - 12) };
  } else if (dialogMode) {
    // Inside dialog: position to the right of the field naturally
    const left = Math.min(rect.right + 16, window.innerWidth - TOOLTIP_W - 8);
    style = {
      ...style,
      left: Math.max(8, left),
      top: Math.max(8, Math.min(targetCenterY - TOOLTIP_H_ESTIMATE / 2, window.innerHeight - TOOLTIP_H_ESTIMATE - 8)),
    };
  } else {
    // Sidebar "right" — anchor in main content area
    style = {
      ...style,
      left: TOOLTIP_LEFT,
      top: Math.max(8, Math.min(targetCenterY - TOOLTIP_H_ESTIMATE / 2, window.innerHeight - TOOLTIP_H_ESTIMATE - 8)),
    };
  }

  const tooltipTop = showConnector
    ? Math.max(8, Math.min(targetCenterY - TOOLTIP_H_ESTIMATE / 2, window.innerHeight - TOOLTIP_H_ESTIMATE - 8))
    : 0;
  const arrowOffsetY = showConnector
    ? Math.max(20, Math.min(targetCenterY - tooltipTop, TOOLTIP_H_ESTIMATE - 20))
    : 0;

  return (
    <div
      data-tour-tooltip
      style={{
        ...style,
        pointerEvents: "auto",
        transition: "left 220ms cubic-bezier(0.22, 1, 0.36, 1), top 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 180ms ease",
        willChange: "left, top, transform",
      }}
      className="relative bg-background border border-border rounded-xl shadow-2xl overflow-visible"
    >
      {/* Connector: arrowhead at sidebar-item end, dashed line to tooltip */}
      {showConnector && (
        <div
          style={{ top: arrowOffsetY }}
          className="absolute right-full top-0 -translate-y-1/2 flex items-center pointer-events-none"
        >
          {/* Arrowhead pointing RIGHT (toward tooltip) — sits at the sidebar item's right edge */}
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderLeft: "6px solid var(--brand-primary)",
              opacity: 0.55,
              flexShrink: 0,
            }}
          />
          {/* Dashed connector line */}
          <svg
            style={{
              width: Math.max(0, TOOLTIP_LEFT - rect.right - PADDING - 6),
              height: 2,
              display: "block",
            }}
          >
            <line
              x1="0" y1="1" x2="100%" y2="1"
              stroke="var(--brand-primary)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.45"
            />
          </svg>
        </div>
      )}

      <div className="overflow-hidden rounded-xl">
        {/* Progress bar */}
        <div className="h-0.5 bg-muted w-full">
          <div
            className="h-0.5 bg-[var(--brand-primary)] transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        <div className="p-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-medium text-muted-foreground tracking-wide uppercase">
                Step {index + 1} of {total}
              </span>
              <h3 className="font-semibold text-sm mt-0.5 leading-snug">
                {step.title}
              </h3>
            </div>
            <button
              onClick={onDismiss}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {step.cta && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 rounded-md px-2 py-1.5">
              <MousePointerClick className="size-3.5 shrink-0" />
              {step.cta}
            </div>
          )}

          {/* Dot indicators */}
          <div className="flex gap-1.5 justify-center">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-5 h-1.5 bg-[var(--brand-primary)]"
                    : "size-1.5 bg-muted-foreground/25"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={isFirst ? onDismiss : onBack}
            >
              {isFirst ? (
                "Skip tour"
              ) : (
                <>
                  <ChevronLeft className="size-3.5" />
                  Back
                </>
              )}
            </Button>

            <Button
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={isLast ? onDismiss : onNext}
              disabled={nextDisabled}
              title={nextDisabled ? "Click the highlighted element to continue" : undefined}
            >
              {isLast ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ChevronRight className="size-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductTour({ open, onClose, devMode = false }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const rect = useTargetRect(current.target, step);

  // Scroll dialog fields into view when advancing through dialogMode steps
  useEffect(() => {
    if (!open || !current.dialogMode || !current.target) return;
    const el = document.querySelector(current.target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [open, step, current.dialogMode, current.target]);

  // When reaching the create button step, ensure all form fields are filled
  useEffect(() => {
    if (!open || current.target !== '[data-tour="dialog-create-btn"]') return;
    STEPS.forEach((s) => {
      if (s.defaultValue && s.target) fillFieldIfEmpty(s.target, s.defaultValue);
    });
  }, [open, step, current.target]);

  // Signal to dialogs that the tour is in dialog mode — prevents Radix outside-click from closing them
  useEffect(() => {
    if (open && current.dialogMode) {
      document.body.setAttribute("data-tour-dialog", "true");
    } else {
      document.body.removeAttribute("data-tour-dialog");
    }
    return () => document.body.removeAttribute("data-tour-dialog");
  }, [open, current.dialogMode]);

  const dismiss = useCallback(async () => {
    if (!devMode) {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
      const raw = localStorage.getItem("user");
      if (raw) {
        try {
          const u = JSON.parse(raw);
          u.onboarding_completed = true;
          localStorage.setItem("user", JSON.stringify(u));
        } catch {
          // Ignore malformed local user data; the standalone flag still prevents repeat tour loops.
        }
      }

      try {
        await authApi.completeOnboarding();
      } catch {
        // Backend sync is best-effort; local dismissal should still persist for this browser.
      }
    }
    onClose();
  }, [onClose, devMode]);

  const next = useCallback(() => {
    if (current.defaultValue && current.target) {
      fillFieldIfEmpty(current.target, current.defaultValue);
    }
    step < STEPS.length - 1 ? setStep((s) => s + 1) : dismiss();
  }, [step, dismiss, current]);

  const back = useCallback(
    () => step > 0 && setStep((s) => s - 1),
    [step]
  );

  // Advance tour after successful project creation (dialog dispatches this event)
  useEffect(() => {
    if (!current.noClickAdvance) return;
    const handler = () => next();
    window.addEventListener("tour:advance", handler);
    return () => window.removeEventListener("tour:advance", handler);
  }, [current.noClickAdvance, next]);

  // Fill field on click (capture phase — bypasses z-index/pointer-events issues)
  useEffect(() => {
    if (!current.target || !current.defaultValue) return;
    const handler = (e) => {
      const el = document.querySelector(current.target);
      if (el && (el === e.target || el.contains(e.target))) {
        fillFieldIfEmpty(current.target, current.defaultValue);
      }
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [current.target, current.defaultValue]);

  // Clicking the spotlit element advances the tour (non-fill steps only)
  useEffect(() => {
    if (!current.target || current.noClickAdvance || current.defaultValue) return;
    const el = document.querySelector(current.target);
    if (!el) return;
    const handler = () => next();
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [current.target, current.noClickAdvance, current.defaultValue, next]);

  if (!open) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes tour-ring-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(255,255,255,0.9), 0 0 16px 6px rgba(37,99,235,0.6); }
          50%       { box-shadow: 0 0 0 3px rgba(255,255,255,0.9), 0 0 28px 10px rgba(37,99,235,0.25); }
        }
        @keyframes tour-ripple {
          0%   { transform: scale(1);    opacity: 0.6; }
          100% { transform: scale(1.28); opacity: 0;   }
        }
      `}</style>

      <Overlay rect={rect} />
      {rect && <Blockers rect={rect} />}
      <Tooltip
        step={current}
        index={step}
        total={STEPS.length}
        rect={rect}
        onNext={next}
        onBack={back}
        onDismiss={dismiss}
      />
    </>,
    document.body
  );
}
